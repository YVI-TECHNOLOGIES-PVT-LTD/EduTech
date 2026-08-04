// Enterprise Workspace Framework — shared module exports

// Workspace
export { WorkspaceProvider } from './workspace/WorkspaceProvider';
export { WorkspaceShell } from './workspace/WorkspaceShell';
export { useWorkspace, useWorkspaceOptional } from './workspace/WorkspaceContext';

// DataGrid V2
export { EnterpriseDataGrid } from './datagrid/EnterpriseDataGrid';
export type { GridColumn } from './hooks/useGridState';
export type { EnterpriseDataGridProps } from './datagrid/types';

// Bulk Operations
export { BulkToolbar } from './bulk/BulkToolbar';
export { BulkActionMenu } from './bulk/BulkActionMenu';
export { BulkConfirmation } from './bulk/BulkConfirmation';
export { BulkProgress } from './bulk/BulkProgress';
export { BulkResult } from './bulk/BulkResult';
export { BULK_OPERATIONS, getBulkOperationsForModule } from './bulk/bulkOperations.config';

// Approval Workspace
export { ApprovalInbox } from './approval/ApprovalInbox';
export { ApprovalTimeline } from './approval/ApprovalTimeline';
export { ApprovalHistory } from './approval/ApprovalHistory';
export { ApprovalCard } from './approval/ApprovalCard';
export { ApprovalFilters } from './approval/ApprovalFilters';
export { ApprovalSummary } from './approval/ApprovalSummary';

// Communication Hub
export { CommunicationCenter } from './communication/CommunicationCenter';
export { EmailComposer } from './communication/EmailComposer';
export { SMSComposer } from './communication/SMSComposer';
export { WhatsAppComposer } from './communication/WhatsAppComposer';

// Reports Engine
export { ReportBuilder } from './reports/ReportBuilder';
export { ReportViewer } from './reports/ReportViewer';
export { ChartBuilder } from './reports/ChartBuilder';
export { ExportMenu as ReportExportMenu } from './reports/ExportMenu';

// Productivity Hub
export { ProductivityHub } from './productivity/ProductivityHub';
export { MyTasks } from './productivity/MyTasks';
export { Notes } from './productivity/Notes';
export { ScratchPad } from './productivity/ScratchPad';

// Workflow Launcher
export { WorkflowLauncher } from './workflow/WorkflowLauncher';
export { getWorkflowSteps } from './workflow/workflowSteps.config';

// Document Center
export { DocumentViewer } from './documents/DocumentViewer';
export type { DocumentItem } from './documents/DocumentViewer';

// Global Search
export { GlobalSearch } from './search/GlobalSearch';

// Executive Command Center
export { ExecutiveOverview } from './executive/ExecutiveOverview';

// Calendar
export { EnterpriseCalendar } from './calendar/EnterpriseCalendar';

// Types
export type * from './types';

// Hooks
export { useLocalStorage } from './hooks/useLocalStorage';
export { useGridState } from './hooks/useGridState';
