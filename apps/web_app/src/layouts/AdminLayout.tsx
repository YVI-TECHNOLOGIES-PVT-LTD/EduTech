import React from 'react';
import { Outlet } from 'react-router-dom';

export const AdminLayout = () => {
    return (
        <div className="admin-layout">
            <header>Admin Header</header>
            <main>
                <Outlet />
            </main>
        </div>
    );
};
