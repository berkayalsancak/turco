import { useState, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';
import { useRouter } from '../context/RouterContext';
import type { Story } from '../types';
import { timeAgo } from '../lib/utils';

interface StoryBarProps {
  stories: Story[];
}

export function StoryBar({ stories }: StoryBarProps) {
  const { profile } = useAuth();
  const { navigate } = useRouter();
  const [viewing, setViewing] = useState<Story | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const grouped = stories.reduce<Record<string, Story[]>>((acc, s) => {
    (acc[s.user_id] ||= []).push(s);
    return acc;
  }, {});

  const handleStoryUpload = async (file: File) => {
    if (!profile) return;
    const ext = file.name.split('.').pop();
    const path = `stories/${profile.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('media').upload(path, file);
    if (upErr) { alert('Yükleme hatası: ' + upErr.message); return; }
    const { data: pub } = supabase.storage.from('media').getPublicUrl(path);
    await supabase.from('stories').insert({
      user_id: profile.id,
      media_url: pub.publicUrl,
      media_type: file.type.startsWith('video') ? 'video' : 'image',
    });
    window.location.reload();
  };

  return (
    <>
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-1 py-3">
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative rounded-full"
          >
            <Avatar profile={profile || { avatar_url: null, username: '', full_name: '' }} size={64} />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ig-accent)] text-white ring-2 ring-[var(--ig-surface)]">
              <Plus size={14} strokeWidth={3} />
            </span>
          </button>
          <span className="max-w-[64px] truncate text-xs">Sen</span>
        </div>

        {Object.entries(grouped).map(([userId, userStories]) => {
          const s = userStories[0];
          return (
            <div key={userId} className="flex flex-col items-center gap-1">
              <button onClick={() => setViewing(s)} className="ig-story-ring rounded-full">
                <div className="rounded-full bg-[var(--ig-surface)] p-[2px]">
                  <Avatar profile={s.profile || { avatar_url: null, username: '', full_name: '' }} size={64} />
                </div>
              </button>
              <span className="max-w-[64px] truncate text-xs">{s.profile?.username || 'kullanıcı'}</span>
            </div>
          );
        })}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleStoryUpload(e.target.files[0])}
      />

      {viewing && <StoryViewer story={viewing} stories={stories} onClose={() => setViewing(null)} />}
    </>
  );
}

function StoryViewer({ story, stories, onClose }: { story: Story; stories: Story[]; onClose: () => void }) {
  const [idx, setIdx] = useState(stories.findIndex((s) => s.id === story.id));
  const current = stories[idx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black animate-fade-in" onClick={onClose}>
      <button className="absolute right-4 top-4 z-10 text-white" onClick={onClose}><X size={28} /></button>
      <div className="relative max-h-[90vh] max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="absolute left-4 right-4 top-4 z-10 flex gap-1">
          {stories.map((_, i) => (
            <div key={i} className="h-0.5 flex-1 rounded-full bg-white/30">
              {i === idx && <div className="h-full w-full animate-pulse rounded-full bg-white" />}
              {i < idx && <div className="h-full w-full rounded-full bg-white" />}
            </div>
          ))}
        </div>
        <div className="absolute left-4 top-8 z-10 flex items-center gap-2">
          <Avatar profile={current.profile || { avatar_url: null, username: '', full_name: '' }} size={32} />
          <span className="text-sm font-semibold text-white">{current.profile?.username}</span>
          <span className="text-xs text-white/70">{timeAgo(current.created_at)}</span>
        </div>
        {current.media_type === 'video' ? (
          <video src={current.media_url} autoPlay controls className="max-h-[90vh] rounded-lg" />
        ) : (
          <img src={current.media_url} alt="" className="max-h-[90vh] rounded-lg" />
        )}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between p-4">
          <button
            onClick={() => idx > 0 && setIdx(idx - 1)}
            className="rounded-full bg-white/20 px-4 py-2 text-white"
          >
            Önceki
          </button>
          <button
            onClick={() => idx < stories.length - 1 ? setIdx(idx + 1) : onClose()}
            className="rounded-full bg-white/20 px-4 py-2 text-white"
          >
            {idx < stories.length - 1 ? 'Sonraki' : 'Kapat'}
          </button>
        </div>
      </div>
    </div>
  );
}
