import api from './api';
import { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/auth';

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/register', payload);
  return response.data;
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', payload);
  return response.data;
}

export async function getCurrentUser(): Promise<{ success: boolean; user: User }> {
  const response = await api.get<{ success: boolean; user: User }>('/auth/me');
  return response.data;
}

