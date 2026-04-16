import { http } from './http';

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  email: string;
  username: string;
  password: string;
};

type LoginResponse = {
  accessToken: string;
  expiresIn: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
};

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>('/auth/login', payload);
  return data;
}

export async function register(payload: RegisterPayload) {
  const { data } = await http.post('/auth/register', payload);
  return data;
}

export async function refreshToken(token: string): Promise<{ accessToken: string }> {
  const { data } = await http.post<{ accessToken: string }>('/auth/refresh', { token });
  return data;
}
