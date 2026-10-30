// Vercel serverless entry point: every /api/* request is routed here by vercel.json
import { createApp } from '../server/app.js';

export default createApp();
