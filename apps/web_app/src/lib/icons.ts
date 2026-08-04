import * as LucideIcons from 'lucide-react';
import React from 'react';

/**
 * Reusable dynamic Icon component.
 * Allows rendering any Lucide icon dynamically by string name.
 */
export interface IconProps {
    name: string;
    className?: string;
    size?: number;
}

export const Icon = ({ name, className, size = 18 }: IconProps) => {
    const LucideIcon = (LucideIcons as any)[name];
    if (!LucideIcon) {
        // Fallback
        return React.createElement(LucideIcons.HelpCircle, { className, size });
    }
    return React.createElement(LucideIcon, { className, size });
};

export const Icons = LucideIcons;
