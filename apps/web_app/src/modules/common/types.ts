export type GridDensity = 'compact' | 'comfortable' | 'spacious';

export type WorkspaceModule =
    | 'admissions'
    | 'students'
    | 'faculty'
    | 'finance'
    | 'exams'
    | 'attendance'
    | 'library'
    | 'hostel'
    | 'transport'
    | 'hr'
    | 'inventory'
    | 'payroll';

export interface SavedGridView {
    id: string;
    name: string;
    module: string;
    visibleColumns: string[];
    pinnedColumns: string[];
    density: GridDensity;
    groupBy?: string;
    filters?: Record<string, string>;
    createdAt: string;
}

export interface BulkOperationResult {
    success: number;
    failed: number;
    errors: { id: string; message: string }[];
}

export interface ApprovalItem {
    id: string;
    title: string;
    module: WorkspaceModule;
    status: 'pending' | 'approved' | 'rejected' | 'review';
    submittedBy: string;
    submittedAt: string;
    priority?: 'high' | 'medium' | 'low';
    metadata?: Record<string, string>;
}

export interface WorkflowStep {
    id: string;
    label: string;
    description?: string;
    route?: string;
    apiAction?: string;
    completed?: boolean;
}

export interface SearchResultItem {
    id: string;
    label: string;
    sub?: string;
    module: WorkspaceModule | 'navigation';
    href: string;
    icon?: string;
}

export interface ProductivityTask {
    id: string;
    text: string;
    done: boolean;
    dueDate?: string;
}

export interface ProductivityBookmark {
    id: string;
    label: string;
    href: string;
    module?: WorkspaceModule;
}
