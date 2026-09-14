import { AuthUser, UserCreate } from '../types/auth';

const USERS_KEY = 'kazihub_mock_users';
const PENDING_REGISTRATION_KEY = 'kazihub_mock_pending_registration';
const PENDING_RESET_KEY = 'kazihub_mock_password_reset';

interface StoredUser extends AuthUser {
  password: string;
}

interface PendingRegistration {
  payload: UserCreate;
  otp: string;
}

interface PendingReset {
  email: string;
  otp: string;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Unable to persist ${key}`, e);
  }
}

function generateOtp(): string {
  return String(Math.floor(10000 + Math.random() * 90000));
}

function stripPassword(user: StoredUser): AuthUser {
  const { password, ...publicUser } = user;
  return publicUser;
}

function getUsers(): StoredUser[] {
  return readJson<StoredUser[]>(USERS_KEY) || [];
}

function saveUsers(users: StoredUser[]): void {
  writeJson(USERS_KEY, users);
}

function findStoredUserByEmail(email: string): StoredUser | undefined {
  const normalized = email.trim().toLowerCase();
  return getUsers().find((u) => u.email.toLowerCase() === normalized);
}

/** Registration is a two-step flow: stash the payload + a mock OTP, then finalize on verify. */
export function startRegistration(payload: UserCreate): string {
  const otp = generateOtp();
  writeJson(PENDING_REGISTRATION_KEY, { payload, otp } satisfies PendingRegistration);
  console.info(`[Mock Auth] Verification code for ${payload.email}: ${otp}`);
  return otp;
}

export function resendRegistrationOtp(email: string): string | null {
  const pending = readJson<PendingRegistration>(PENDING_REGISTRATION_KEY);
  if (!pending || pending.payload.email.toLowerCase() !== email.trim().toLowerCase()) return null;
  const otp = generateOtp();
  writeJson(PENDING_REGISTRATION_KEY, { ...pending, otp });
  console.info(`[Mock Auth] New verification code for ${email}: ${otp}`);
  return otp;
}

export function completeRegistration(email: string, otp: string): AuthUser {
  const pending = readJson<PendingRegistration>(PENDING_REGISTRATION_KEY);
  if (!pending || pending.payload.email.toLowerCase() !== email.trim().toLowerCase()) {
    throw new Error('No pending registration found for this email. Please sign up again.');
  }
  if (pending.otp !== otp) {
    throw new Error('Invalid verification code. Please try again.');
  }

  const { payload } = pending;
  const newUser: StoredUser = {
    id: `usr-${Date.now()}`,
    first_name: payload.first_name,
    last_name: payload.last_name,
    email: payload.email,
    phone_number: payload.phone_number,
    nin: payload.nin || '',
    state: payload.state,
    role: payload.role,
    is_active: true,
    is_email_verified: true,
    profile_picture: null,
    created_at: new Date().toISOString(),
    password: payload.password,
  };

  const users = getUsers().filter((u) => u.email.toLowerCase() !== newUser.email.toLowerCase());
  users.push(newUser);
  saveUsers(users);
  localStorage.removeItem(PENDING_REGISTRATION_KEY);

  return stripPassword(newUser);
}

export function authenticate(usernameOrEmail: string, password: string): AuthUser {
  const user = findStoredUserByEmail(usernameOrEmail);
  if (!user || user.password !== password) {
    throw new Error('Invalid email/username or password.');
  }
  return stripPassword(user);
}

export function startPasswordReset(email: string): string | null {
  const user = findStoredUserByEmail(email);
  if (!user) return null;
  const otp = generateOtp();
  writeJson(PENDING_RESET_KEY, { email: user.email, otp } satisfies PendingReset);
  console.info(`[Mock Auth] Password reset code for ${email}: ${otp}`);
  return otp;
}

export function completePasswordReset(email: string, otp: string, newPassword: string): void {
  const pending = readJson<PendingReset>(PENDING_RESET_KEY);
  if (!pending || pending.email.toLowerCase() !== email.trim().toLowerCase() || pending.otp !== otp) {
    throw new Error('Invalid or expired reset code.');
  }
  const users = getUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (idx === -1) {
    throw new Error('Account not found.');
  }
  users[idx] = { ...users[idx], password: newPassword };
  saveUsers(users);
  localStorage.removeItem(PENDING_RESET_KEY);
}

export function updateUserRecord(email: string, updates: Partial<AuthUser>): AuthUser | null {
  const users = getUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);
  return stripPassword(users[idx]);
}

export function deleteUserRecord(email: string): void {
  const users = getUsers().filter((u) => u.email.toLowerCase() !== email.trim().toLowerCase());
  saveUsers(users);
}
