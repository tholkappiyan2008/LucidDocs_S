import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export interface UserPayload {
  id: string;
  email: string;
  name: string;
}

export function generateToken(payload: UserPayload): string {
  // @ts-ignore
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export function verifyToken(token: string): UserPayload {
  return jwt.verify(token, config.jwtSecret) as UserPayload;
}

