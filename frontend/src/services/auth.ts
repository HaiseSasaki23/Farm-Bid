import type { RegisterInput, User } from '../types';
import { clearToken, request, TOKEN_KEY } from '../lib/http';

type ApiUser = { id: number; fullName: string; email: string; role: User['role']; accountStatus: string; createdAt: string };

const toUser = (user: ApiUser): User => ({
  userId: user.id, fullName: user.fullName, email: user.email, role: user.role,
  createdAt: user.createdAt, isActive: user.accountStatus === 'Active',
});

export const authService = {
  async register(input: RegisterInput): Promise<void> {
    await request<{ message: string }>('/api/Auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName: input.fullName.trim(), email: input.email.trim(), password: input.password, role: input.role }),
    });
  },

  async login(email: string, password: string): Promise<User> {
    const login = await request<{ token: string }>('/api/Auth/login', {
      method: 'POST', body: JSON.stringify({ email: email.trim(), password }),
    });
    localStorage.setItem(TOKEN_KEY, login.token);
    try { return await this.meOrThrow(); }
    catch (error) { clearToken(); throw error; }
  },

  async me(): Promise<User | null> {
    if (!localStorage.getItem(TOKEN_KEY)) return null;
    try { return await this.meOrThrow(); }
    catch { clearToken(); return null; }
  },

  async meOrThrow(): Promise<User> { return toUser(await request<ApiUser>('/api/User/me')); },

  async verifyEmail(email: string, code: string): Promise<void> {
    await request<{ message: string }>('/api/Auth/verify-email', {
      method: 'POST', body: JSON.stringify({ email: email.trim(), code: code.trim() }),
    });
  },

  async resendVerification(email: string): Promise<void> {
    await request<{ message: string }>('/api/Auth/resend-verification', {
      method: 'POST', body: JSON.stringify({ email: email.trim() }),
    });
  },

  logout: clearToken,
};
