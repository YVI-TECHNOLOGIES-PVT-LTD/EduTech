interface LeadAvatarProps {
    name: string;
    size?: 'sm' | 'md';
}

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(p => p[0]?.toUpperCase() ?? '')
        .join('');
}

export function LeadAvatar({ name, size = 'md' }: LeadAvatarProps) {
    const dim = size === 'sm' ? 'w-8 h-8 text-[10px]' : 'w-10 h-10 text-xs';
    return (
        <div
            className={`${dim} rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-black shrink-0`}
        >
            {initials(name || '?')}
        </div>
    );
}

export default LeadAvatar;
