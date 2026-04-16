import { z } from 'zod';

const passwordRule = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().trim().min(2).max(50),
  password: z
    .string()
    .regex(passwordRule, '密码至少8位，且必须包含字母和数字'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const refreshSchema = z.object({
  token: z.string().min(10),
});
