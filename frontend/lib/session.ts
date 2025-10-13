// src/lib/session.ts
import Cookies from 'js-cookie';
import type { LoginResponse } from './auth';

const USER_KEY = 'user';
const TOKEN_KEY = 'token';

export function setUser(user: LoginResponse) {
  Cookies.set(USER_KEY, JSON.stringify(user), { sameSite: 'lax' });
  if (user.token) {
    Cookies.set(TOKEN_KEY, user.token, { sameSite: 'lax' });
  }
}

export function getUser(): LoginResponse | null {
  const raw = Cookies.get(USER_KEY);
  return raw ? (JSON.parse(raw) as LoginResponse) : null;
}

export function clearUser() {
  Cookies.remove(USER_KEY);
  Cookies.remove(TOKEN_KEY);
}
