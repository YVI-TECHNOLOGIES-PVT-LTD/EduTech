import React from 'react';
import { ADMISSION_WORKSPACES, type WorkspaceItem } from './admissionWorkspace';

// Workspace sub-pages
import DashboardWorkspace from '../pages/Workspace/AdmissionOfficer/DashboardWorkspace';
import ApplicationsWorkspace from '../pages/Workspace/AdmissionOfficer/ApplicationsWorkspace';
import QueueWorkspace from '../pages/Workspace/AdmissionOfficer/QueueWorkspace';
import DocumentWorkspace from '../pages/Workspace/AdmissionOfficer/DocumentWorkspace';
import InterviewWorkspace from '../pages/Workspace/AdmissionOfficer/InterviewWorkspace';
import MeritWorkspace from '../pages/Workspace/AdmissionOfficer/MeritWorkspace';
import OfferWorkspace from '../pages/Workspace/AdmissionOfficer/OfferWorkspace';
import FinanceWorkspace from '../pages/Workspace/AdmissionOfficer/FinanceWorkspace';
import EnrollmentWorkspace from '../pages/Workspace/AdmissionOfficer/EnrollmentWorkspace';
import ReportsWorkspace from '../pages/Workspace/AdmissionOfficer/ReportsWorkspace';
import SettingsWorkspace from '../pages/Workspace/AdmissionOfficer/SettingsWorkspace';

export interface RegisteredWorkspace extends WorkspaceItem {
    component: React.ComponentType<any>;
}

export const ADMISSION_WORKSPACE_REGISTRY: Record<string, RegisteredWorkspace> = {
    DASHBOARD: {
        ...ADMISSION_WORKSPACES.DASHBOARD,
        component: DashboardWorkspace,
    },
    APPLICATIONS: {
        ...ADMISSION_WORKSPACES.APPLICATIONS,
        component: ApplicationsWorkspace,
    },
    QUEUES: {
        ...ADMISSION_WORKSPACES.QUEUES,
        component: QueueWorkspace,
    },
    DOCUMENTS: {
        ...ADMISSION_WORKSPACES.DOCUMENTS,
        component: DocumentWorkspace,
    },
    INTERVIEWS: {
        ...ADMISSION_WORKSPACES.INTERVIEWS,
        component: InterviewWorkspace,
    },
    MERIT: {
        ...ADMISSION_WORKSPACES.MERIT,
        component: MeritWorkspace,
    },
    OFFERS: {
        ...ADMISSION_WORKSPACES.OFFERS,
        component: OfferWorkspace,
    },
    FINANCE: {
        ...ADMISSION_WORKSPACES.FINANCE,
        component: FinanceWorkspace,
    },
    ENROLLMENT: {
        ...ADMISSION_WORKSPACES.ENROLLMENT,
        component: EnrollmentWorkspace,
    },
    REPORTS: {
        ...ADMISSION_WORKSPACES.REPORTS,
        component: ReportsWorkspace,
    },
    SETTINGS: {
        ...ADMISSION_WORKSPACES.SETTINGS,
        component: SettingsWorkspace,
    },
};

export const REGISTERED_WORKSPACE_LIST = Object.values(ADMISSION_WORKSPACE_REGISTRY).sort((a, b) => a.order - b.order);
