import React from 'react';

interface StudentAvatarProps {
    firstName: string;
    lastName: string;
    photoUrl?: string;
    className?: string;
}

export const StudentAvatar: React.FC<StudentAvatarProps> = ({ firstName, lastName, photoUrl, className = 'w-10 h-10' }) => {
    return (
        <div className={`${className} rounded-full bg-primary/10 border-2 border-primary/20 overflow-hidden flex items-center justify-center font-black text-primary`}>
            {photoUrl ? (
                <img src={photoUrl} alt="Student avatar" className="w-full h-full object-cover" />
            ) : (
                <span className="text-xs uppercase">
                    {firstName?.[0] || ''}{lastName?.[0] || ''}
                </span>
            )}
        </div>
    );
};

export default StudentAvatar;
