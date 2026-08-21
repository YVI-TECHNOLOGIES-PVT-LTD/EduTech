import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

interface StudentAvatarProps {
  firstName: string;
  lastName: string;
  photoUrl?: string;
  className?: string;
}

export const StudentAvatar: React.FC<StudentAvatarProps> = ({
  firstName,
  lastName,
  photoUrl,
  className = 'w-10 h-10',
}) => {
  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Student';
  return (
    <Avatar className={`border border-border/80 shrink-0 ${className}`}>
      <AvatarImage src={photoUrl} alt={fullName} />
      <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">
        {getInitials(fullName, 'S')}
      </AvatarFallback>
    </Avatar>
  );
};

export default StudentAvatar;
