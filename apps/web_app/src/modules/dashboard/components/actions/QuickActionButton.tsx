import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuickActionButtonProps {
    label: string;
    icon: LucideIcon;
    href: string;
    color: string;
    description?: string;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
    label,
    icon: Icon,
    href,
    color,
    description
}) => {
    return (
        <Link
            to={href}
            className={`p-4 rounded-2xl border border-solid transition-all duration-300 flex items-start gap-4 hover:shadow-premium-sm hover:scale-[1.01] ${color}`}
        >
            <div className="p-2.5 rounded-xl bg-white dark:bg-card shrink-0 shadow-sm">
                <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    {label}
                </p>
                {description && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed font-semibold">
                        {description}
                    </p>
                )}
            </div>
        </Link>
    );
};

export default QuickActionButton;
