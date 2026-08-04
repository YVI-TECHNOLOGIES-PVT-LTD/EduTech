import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
            <h1 className="text-4xl font-bold text-gray-900">403</h1>
            <p className="mt-2 text-lg text-gray-600">Unauthorized Access</p>
            <p className="mt-1 text-gray-500">You do not have permission to view this page.</p>
            <Link to="/app/dashboard" className="mt-6 text-blue-600 hover:text-blue-500">
                Go back to Dashboard
            </Link>
        </div>
    );
}
