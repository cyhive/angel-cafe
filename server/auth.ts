import { createHmac, timingSafeEqual } from 'node:crypto';
import express from 'express';

const COOKIE_NAME = 'nu_cafe_session';
const SESSION_SECONDS = 60 * 60 * 12;

function equalSecret(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function signature(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function getSecret() {
  return process.env.POS_SESSION_SECRET;
}

function cookieOptions() {
  return `Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

function isAuthenticated(req: express.Request) {
  const secret = getSecret();
  if (!secret) return false;
  const cookie = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return false;
  const token = decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1));
  const [issued, expires, providedSignature] = token.split('.');
  if (!issued || !expires || !providedSignature || !/^\d+$/.test(issued) || !/^\d+$/.test(expires)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Number(issued) > now || Number(expires) < now || Number(expires) - Number(issued) !== SESSION_SECONDS) return false;
  return equalSecret(providedSignature, signature(`${issued}.${expires}`, secret));
}

export function createAuthRouter() {
  const router = express.Router();
  router.use(express.json({ limit: '2kb' }));

  router.get('/session', (req, res) => {
    res.json({ authenticated: isAuthenticated(req) });
  });

  router.post('/login', (req, res) => {
    const username = process.env.POS_USERNAME;
    const password = process.env.POS_PASSWORD;
    const secret = getSecret();
    if (!username || !password || !secret) {
      return res.status(503).json({ error: 'Login is not configured on the server' });
    }
    const suppliedUsername = typeof req.body?.username === 'string' ? req.body.username : '';
    const suppliedPassword = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!equalSecret(suppliedUsername, username) || !equalSecret(suppliedPassword, password)) {
      return res.status(401).json({ error: 'Incorrect username or password' });
    }
    const issued = Math.floor(Date.now() / 1000);
    const expires = issued + SESSION_SECONDS;
    const payload = `${issued}.${expires}`;
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=${payload}.${signature(payload, secret)}; ${cookieOptions()}`);
    res.json({ authenticated: true });
  });

  router.post('/logout', (_req, res) => {
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    res.json({ authenticated: false });
  });

  return router;
}

export function requireAuthentication(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Please log in to continue' });
  next();
}
