import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

interface LeadAvatarProps {
  name: string;
  size?: 'sm' | 'md';
  avatarUrl?: string;
  className?: string;
}

export function LeadAvatar({ name, size = 'md', avatarUrl, className = '' }: LeadAvatarProps) {
  const avatarSize = size === 'sm' ? 'sm' : 'default';
  return (
    <Avatar size={avatarSize} className={`border border-border/80 shrink-0 ${className}`}>
      <AvatarImage src={avatarUrl} alt={name} />
      <AvatarFallback className="bg-primary/10 text-primary font-black">
        {getInitials(name, '?')}
      </AvatarFallback>
    </Avatar>
  );
}

export default LeadAvatar;
