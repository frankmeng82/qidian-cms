import { beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from './auth';

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().reset();
  });

  it('persists access token and username', () => {
    const { setAccessToken, setUsername } = useAuthStore.getState();
    setAccessToken('token-1');
    setUsername('alice');

    expect(localStorage.getItem('qidian_access_token')).toBe('token-1');
    expect(localStorage.getItem('qidian_username')).toBe('alice');
  });

  it('reset clears local storage keys', () => {
    const { setAccessToken, setUsername, reset } = useAuthStore.getState();
    setAccessToken('token-1');
    setUsername('alice');
    reset();

    expect(localStorage.getItem('qidian_access_token')).toBeNull();
    expect(localStorage.getItem('qidian_username')).toBeNull();
  });

  it('clears token and username when setters receive null', () => {
    const { setAccessToken, setUsername } = useAuthStore.getState();
    setAccessToken('token-1');
    setUsername('alice');

    setAccessToken(null);
    setUsername(null);

    expect(localStorage.getItem('qidian_access_token')).toBeNull();
    expect(localStorage.getItem('qidian_username')).toBeNull();
  });
});
