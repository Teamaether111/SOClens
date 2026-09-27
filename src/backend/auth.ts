import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Role } from './types';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'sat_sa_nciipc_supervisory_secret_2026';

export interface TokenPayload {
  userId: string;
  username: string;
  name: string;
  role: Role;
  email: string;
}

export function generateToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    email: user.email
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}

export function authenticateUser(username: string, password: string): { user: User; token: string } | null {
  const users = db.getUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase());
  if (!user) return null;

  const valid = bcrypt.compareSync(password, user.passwordHash);
  if (!valid) return null;

  const token = generateToken(user);
  db.logAudit(user.username, 'USER_LOGIN', 'USER', user.id, null, 'Successful authentication session established');

  return { user, token };
}
