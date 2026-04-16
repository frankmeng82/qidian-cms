import { useEffect } from 'react';

import { refreshToken } from './services/auth';
import { useAuthStore } from './store/auth';
import { parseJwtPayload } from './utils/jwt';

const ONE_DAY_SECONDS = 24 * 60 * 60;

export function AppBootstrap() {
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const reset = useAuthStore((state) => state.reset);

  useEffect(() => {
    const timer = setInterval(() => {
      const token = localStorage.getItem('qidian_access_token');
      if (!token) return;
      const payload = parseJwtPayload(token);
      if (!payload?.exp) return;
      const secondsLeft = payload.exp - Math.floor(Date.now() / 1000);
      if (secondsLeft > ONE_DAY_SECONDS) return;
      void refreshToken(token)
        .then((data) => setAccessToken(data.accessToken))
        .catch(() => reset());
    }, 60 * 60 * 1000);

    return () => clearInterval(timer);
  }, [reset, setAccessToken]);

  return null;
}
