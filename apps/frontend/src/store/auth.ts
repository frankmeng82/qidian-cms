import { create } from 'zustand';

type AuthState = {
  accessToken: string | null;
  username: string | null;
  setAccessToken: (token: string | null) => void;
  setUsername: (username: string | null) => void;
  reset: () => void;
};

const TOKEN_KEY = 'qidian_access_token';
const USERNAME_KEY = 'qidian_username';

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem(TOKEN_KEY),
  username: localStorage.getItem(USERNAME_KEY),
  setAccessToken: (accessToken) => {
    if (accessToken) {
      localStorage.setItem(TOKEN_KEY, accessToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    set({ accessToken });
  },
  setUsername: (username) => {
    if (username) {
      localStorage.setItem(USERNAME_KEY, username);
    } else {
      localStorage.removeItem(USERNAME_KEY);
    }
    set({ username });
  },
  reset: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    set({ accessToken: null, username: null });
  },
}));
