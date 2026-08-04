import React from 'react';
import { Outlet } from 'react-router-dom';

export const ParentLayout = () => {
    return (
        <div className="parent-layout">
            <header>Parent Header</header>
            <main>
                <Outlet />
            </main>
        </div>
    );
};
