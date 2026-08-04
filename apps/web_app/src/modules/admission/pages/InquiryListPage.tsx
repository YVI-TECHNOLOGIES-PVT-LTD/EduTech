import { useLocation } from 'react-router-dom';
import { InquiryWorkspace } from '../components/inquiry/InquiryWorkspace';

export function InquiryListPage() {
    const location = useLocation();
    const isAssignRoute = location.pathname.endsWith('/assign');
    const hashAction = location.hash.replace('#', '');

    return (
        <InquiryWorkspace
            mode={isAssignRoute ? 'assignment' : 'workspace'}
            openCreateOnMount={hashAction === 'new'}
            initialSection={hashAction === 'calls' ? 'followups' : undefined}
        />
    );
}

export default InquiryListPage;
