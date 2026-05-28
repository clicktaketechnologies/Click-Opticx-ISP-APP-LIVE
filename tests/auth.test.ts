/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Define localStorage and sessionStorage mocks on globalThis for ESM compatibility
const storageMock = () => {
  const storage: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
    removeItem: vi.fn((key: string) => { delete storage[key]; }),
    clear: vi.fn(() => { for (const key in storage) delete storage[key]; }),
    length: 0,
    key: vi.fn(() => null),
  } as any;
};

if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = storageMock();
}
if (typeof global.localStorage === 'undefined') {
  global.localStorage = globalThis.localStorage;
}

if (typeof globalThis.sessionStorage === 'undefined') {
  globalThis.sessionStorage = storageMock();
}
if (typeof global.sessionStorage === 'undefined') {
  global.sessionStorage = globalThis.sessionStorage;
}

// Mock fetch globally to reject instantly for offline/fallback test execution
globalThis.fetch = vi.fn().mockImplementation(() => Promise.reject(new TypeError('Failed to fetch')));

import { db } from '../db';

// Mock Firebase and other global dependencies
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  RecaptchaVerifier: vi.fn(),
  signInWithPhoneNumber: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  onSnapshot: vi.fn(),
}));

describe('ClickOptix Authentication Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize the database without throwing', () => {
    expect(db).toBeDefined();
  });

  it('should attempt login and return failure for empty credentials', async () => {
    const res = await db.login('', '');
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Identity required for lookup/);
  });

  it('should handle signup requests', async () => {
    const signupData = {
      name: 'Test User',
      username: 'testunit',
      email: 'test@unit.com',
      phone: '1234567890',
      address: 'Unit Test St'
    };
    
    const res = await db.submitSignupRequest(signupData);
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/Account handshake complete/);
  });
});
