import { useState, useRef } from 'react';
import { X, Image, Film, MapPin, Music, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';

interface CreatePageProps {
  type: 'post' | 'story' | 'reel';
}

export function CreatePage({ type }: CreatePageProps) {
  const { profile } = useAuth();
  const { navigate, back } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [music, setMusic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const accept = type === 'post' ? 'image/*,video/*' : type === 'story' ? 'image/*,video/*' : 'video/*';
  const title = type === 'post' ? 'Yeni Gönderi' : type === 'story' ? 'Yeni Story' : 'Yeni Reels';

  const handleFiles = (newFiles: FileList) => {
    const arr = Array.from(newFiles);
    setFiles((f) => [...f, ...arr]);
    setPreviews((p) => [...p, ...arr.map((f) => URL.createObjectURL(f))]);
  };

  const removeFile = (idx: number) => {
    setFiles((f) => f.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const uploadFile = async (file: File, folder: string) => {
    const ext = file.name.split('.').pop();
    const path = `${folder}/${profile?.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('media').upload(path, file);
    if (upErr) throw new Error(upErr.message);
    const { data: pub } = supabase.storage.from('media').getPublicUrl(path);
    return pub.publicUrl;
  };

  const handleSubmit = async () => {
    if (!profile || files.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      if (type === 'post') {
        const urls = await Promise.all(files.map((f) => uploadFile(f, 'posts')));
        await supabase.from('posts').insert({
          user_id: profile.id,
          media_urls: urls,
          caption,
          location,
        });
      } else if (type === 'story') {
        await Promise.all(files.map(async (f) => {
          const url = await uploadFile(f, 'stories');
          await supabase.from('stories').insert({
            user_id: profile.id,
            media_url: url,
            media_type: f.type.startsWith('video') ? 'video' : 'image',
          });
        }));
      } else if (type === 'reel') {
        const url = await uploadFile(files[0], 'reels');
        await supabase.from('reels').insert({
          user_id: profile.id,
          video_url: url,
          caption,
          music,
        });
      }
      navigate({ name: 'home' });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={back}><X size={24} /></button>
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          onClick={handleSubmit}
          disabled={loading || files.length === 0}
          className="text-sm font-semibold text-[var(--ig-accent)] disabled:opacity-40"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Paylaş'}
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-rose-500">{error}</p>}

      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); e.dataTransfer.files && handleFiles(e.dataTransfer.files); }}
        className="mb-4 flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-[var(--ig-surface)]"
      >
        {previews.length > 0 ? (
          <div className="grid h-full w-full grid-cols-2 gap-1 overflow-hidden rounded-xl">
            {previews.map((p, i) => (
              <div key={i} className="relative">
                {files[i].type.startsWith('video') ? (
                  <video src={p} className="h-full w-full object-cover" />
                ) : (
                  <img src={p} className="h-full w-full object-cover" />
                )}
                <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <>
            {type === 'reel' ? <Film size={48} className="text-[var(--ig-muted)]" /> : <Image size={48} className="text-[var(--ig-muted)]" />}
            <p className="mt-3 text-sm text-[var(--ig-muted)]">Dosyaları sürükle veya tıkla</p>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={accept}
        multiple={type !== 'reel'}
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      <div className="space-y-3">
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={type === 'reel' ? 'Reels başlığı...' : 'Başlık ekle...'}
          rows={3}
          className="ig-input resize-none"
        />

        {type === 'post' && (
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-[var(--ig-muted)]" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Konum ekle"
              className="ig-input"
            />
          </div>
        )}

        {type === 'reel' && (
          <div className="flex items-center gap-2">
            <Music size={18} className="text-[var(--ig-muted)]" />
            <input
              value={music}
              onChange={(e) => setMusic(e.target.value)}
              placeholder="Müzik ekle"
              className="ig-input"
            />
          </div>
        )}
      </div>
    </div>
  );
}
