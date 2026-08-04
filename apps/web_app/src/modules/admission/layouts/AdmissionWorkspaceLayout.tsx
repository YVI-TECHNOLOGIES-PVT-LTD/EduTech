import React from 'react';
import { AdmissionMasterDataProvider } from '../context/AdmissionMasterDataContext';
import { DashboardLayout } from '../../../layouts/DashboardLayout';

export function AdmissionWorkspaceLayout() {
    return (
        <AdmissionMasterDataProvider>
            <DashboardLayout />
        </AdmissionMasterDataProvider>
    );
}

export default AdmissionWorkspaceLayout;
