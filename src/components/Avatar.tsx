import { avatarColor, initials } from '../lib/utils';
import type { Profile } from '../types';

interface AvatarProps {
  profile: Pick<Profile, 'avatar_url' | 'username' | 'full_name'>;
  size?: number;
  ring?: boolean;
  onClick?: () => void;
}

export function Avatar({ profile, size = 40, ring = false, onClick }: AvatarProps) {
  const inner = (
    <div
      className={`rounded-full ${ring ? 'ring-2 ring-[var(--ig-accent)]' : ''} overflow-hidden bg-gradient-to-br ${avatarColor(profile.username || 'SA')} flex items-center justify-center font-bold text-white`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {profile.avatar_url ? (
        <img src={profile.avatar_url} alt={profile.username} className="h-full w-full object-cover" />
      ) : (
        initials(profile.full_name || profile.username || 'SA')
      )}
    </div>
  );

  if (onClick) {
    return <button onClick={onClick}>{inner}</button>;
  }
  return inner;
}
