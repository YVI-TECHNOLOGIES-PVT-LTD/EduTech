import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ForbiddenView } from '../components/common/ErrorBoundary';

export default function UnauthorizedPage() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="w-full flex-1 flex items-center justify-center py-8">
      <ForbiddenView path={location.pathname} onAction={() => navigate('/app')} />
    </div>
  );
}

export { UnauthorizedPage };
