import { Outlet } from 'react-router-dom';

export const FinanceLayout = () => {
    return (
        <div className="w-full h-full min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
            <Outlet />
        </div>
    );
};
