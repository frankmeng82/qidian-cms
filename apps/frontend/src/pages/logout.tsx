import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuthStore } from '../store/auth';

export function LogoutPage() {
  const reset = useAuthStore((state) => state.reset);
  useEffect(() => {
    reset();
  }, [reset]);
  return <Navigate to="/" replace />;
}
