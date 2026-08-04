import React from 'react';
import { Outlet } from 'react-router-dom';

export const FacultyLayout = () => {
    return (
        <div className="faculty-layout">
            <header>Faculty Header</header>
            <main>
                <Outlet />
            </main>
        </div>
    );
};
