import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn, initials } from '@/lib/utils';

// A few muted, distinct tones so the same person always gets the same colour.
const TONES = [
  'bg-emerald-100 text-emerald-900',
  'bg-amber-100 text-amber-900',
  'bg-sky-100 text-sky-900',
  'bg-rose-100 text-rose-900',
  'bg-violet-100 text-violet-900',
];

function toneFor(seed: string) {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length];
}

export default function UserAvatar({ name, email, className }: { name: string; email: string; className?: string }) {
  return (
    <Avatar className={className}>
      <AvatarFallback className={cn(toneFor(email))}>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
