/**
 * Re-exports the shared Enterprise DataGrid V2 from modules/common.
 * Maintains backward compatibility for existing admission module imports.
 */
export {
    EnterpriseDataGrid,
    EnterpriseDataGrid as default,
    type GridColumn,
} from '../../../common/datagrid/EnterpriseDataGrid';
