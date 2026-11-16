import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NotFoundView } from '../components/common/ErrorBoundary';

export const NotFoundPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Log route miss for telemetry/debugging
    console.warn(`[Route 404] Attempted to access non-existent route: ${location.pathname}`);
  }, [location.pathname]);

  return (
    <div className="w-full flex-1 flex items-center justify-center py-8">
      <NotFoundView path={location.pathname} onAction={() => navigate('/app')} />
    </div>
  );
};

export default NotFoundPage;
