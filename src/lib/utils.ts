export function timeAgo(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return 'şimdi';
  if (diff < 3600) return `${Math.floor(diff / 60)}dk`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}sa`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}g`;
  if (diff < 2629800) return `${Math.floor(diff / 604800)}hf`;
  if (diff < 31557600) return `${Math.floor(diff / 2629800)}ay`;
  return `${Math.floor(diff / 31557600)}y`;
}

export function formatCount(n: number): string {
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(1).replace('.0', '')}B`;
  return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function avatarColor(seed: string): string {
  const colors = [
    'from-rose-500 to-orange-500',
    'from-amber-500 to-pink-500',
    'from-sky-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-violet-500 to-fuchsia-500',
    'from-blue-500 to-indigo-500',
  ];
  const idx = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return colors[idx];
}
