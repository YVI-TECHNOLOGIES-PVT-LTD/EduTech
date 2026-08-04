import { useLocation, Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import { parseBreadcrumbs } from '../../lib/breadcrumb';

interface BreadcrumbProps {
    /** Additional custom overrides for the current page's label */
    customLabel?: string;
}

/**
 * Breadcrumb — auto-generated from the current URL path.
 * Renders as: Home > Section1 > Section2 > Current Page
 */
export function Breadcrumb({ customLabel }: BreadcrumbProps) {
    const location = useLocation();
    const items = parseBreadcrumbs(location.pathname);

    if (items.length <= 1) return null; // Don't show breadcrumb on top-level pages

    // Override last item label if provided
    const displayItems = customLabel
        ? items.map((item, i) => i === items.length - 1 ? { ...item, label: customLabel } : item)
        : items;

    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs font-medium text-gray-400 px-4 sm:px-6 py-2 border-b border-gray-100 bg-gray-50/50">
            {/* Home icon */}
            <Link
                to="/app/dashboard"
                className="flex items-center gap-1 text-gray-400 hover:text-primary transition-colors"
            >
                <Home className="w-3.5 h-3.5" />
            </Link>

            {displayItems.map((item, i) => (
                <span key={i} className="flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                    {item.isLast ? (
                        <span className="text-gray-700 font-bold">{item.label}</span>
                    ) : (
                        <Link
                            to={item.path}
                            className="hover:text-primary transition-colors"
                        >
                            {item.label}
                        </Link>
                    )}
                </span>
            ))}
        </nav>
    );
}
