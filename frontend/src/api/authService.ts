import type { RegisterInput, User } from '../types';
import { ApiError, TOKEN_KEY, delay, hashPassword, read, write, nextId, type UserRecord } from './mockDb';

const strip = ({ passwordHash: _ph, ...user }: UserRecord): User => user;

export const authService = {
  /** POST /api/auth/register */
  async register(input: RegisterInput): Promise<void> {
    await delay();
    const db = read();
    const email = input.email.trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      throw new ApiError('That email is already registered. Log in or use another email.');
    }
    const user: UserRecord = {
      userId: nextId(db, 'user'),
      fullName: input.fullName.trim(),
      email,
      role: input.role,
      createdAt: new Date().toISOString(),
      isActive: true,
      location: input.location.trim(),
      farmName: input.role === 'Farmer' ? input.farmName?.trim() : undefined,
      buyerType: input.role === 'Buyer' ? input.buyerType : undefined,
      passwordHash: hashPassword(input.password),
    };
    db.users.push(user);
    write(db);
  },

  /** POST /api/auth/login  ->  { token, user } */
  async login(email: string, password: string): Promise<User> {
    await delay();
    const db = read();
    const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.passwordHash !== hashPassword(password)) {
      throw new ApiError('Email or password is incorrect. Check both and try again.');
    }
    if (!user.isActive) throw new ApiError('This account is deactivated. Contact support.');
    localStorage.setItem(TOKEN_KEY, `mockjwt.${user.userId}.${Date.now()}`);
    return strip(user);
  },

  /** GET /api/auth/me */
  async me(): Promise<User | null> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const id = Number(token.split('.')[1]);
    const user = read().users.find((u) => u.userId === id);
    return user ? strip(user) : null;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
  },
};
