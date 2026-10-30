import React, { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';

interface MenuPhotoPickerProps {
  image?: string;
  onChange: (image: string) => void;
  compact?: boolean;
}

async function optimizePhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  if (file.size > 12 * 1024 * 1024) throw new Error('Choose an image smaller than 12 MB.');

  const source = URL.createObjectURL(file);
  try {
    const photo = new Image();
    photo.src = source;
    await photo.decode();

    const scale = Math.min(1, 1200 / Math.max(photo.naturalWidth, photo.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(photo.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(photo.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not process this image.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(photo, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(source);
  }
}

export const MenuPhotoPicker: React.FC<MenuPhotoPickerProps> = ({ image, onChange, compact = false }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError('');
    setProcessing(true);
    try {
      onChange(await optimizePhoto(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this image.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={compact ? 'flex items-center gap-2' : 'space-y-2'}>
      {image && (
        <img
          src={image}
          alt="Menu item preview"
          className={compact ? 'h-10 w-10 rounded-lg object-cover' : 'h-28 w-36 rounded-xl object-cover'}
        />
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={processing}
        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs font-medium text-neutral-200 hover:border-amber-500/70 hover:text-amber-300 disabled:opacity-60"
      >
        <ImagePlus className="h-4 w-4" />
        {processing ? 'Preparing photo…' : image ? 'Change photo' : 'Upload photo'}
      </button>
      {error && <p role="alert" className="text-[11px] text-rose-300">{error}</p>}
    </div>
  );
};
