/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KYCMethod, VerificationStatus, Role } from '../types';

// Mock localStorage and sessionStorage mocks on globalThis for ESM compatibility
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

import { db } from '../db';

// Mock Firebase & Socket initialization
(db as any).initialized = true;

describe('Automated Bot Testing: KYC Lifecycle & Identity Synchronization', () => {
  let newUser: any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Test 1: should sign up a user and persist to sessionStorage', async () => {
    const signupData = {
      name: 'Bot User',
      email: 'bot@example.com',
      username: 'bot_test',
      phone: '1112223334',
      password: 'password123',
      address: 'Test Node Layer',
      area: 'Digital',
      connectionType: 'Fiber' as const
    };
    
    newUser = {
       id: 'USR-BOT-' + Date.now(),
       ...signupData,
       status: 'Active',
       kyc_status: 'pending',
       approval_status: 'pending',
       role: Role.CUSTOMER,
       kycDocuments: [],
       kyc_history: []
    };

    // Simulate login persistence exactly as it happens after db.login
    (db as any).state.users.push(newUser);
    (db as any).state.currentUser = newUser;
    await (db as any).commit(true);

    const checkPersistence = globalThis.sessionStorage.getItem('clickopticx_session_state');
    expect(checkPersistence).toBeDefined();
    expect(checkPersistence).toContain(newUser.id);
  });

  it('Test 2: should handle KYC Document Submission & Linking', async () => {
    const kycUpload = await db.submitKYC(
      newUser.id,
      KYCMethod.LIVE_SCAN,
      ['data:image/png;base64,mockFront', 'data:image/png;base64,mockBack'],
      'Face scan attached.',
      'data:image/png;base64,mockBiometricSelfie'
    );
    
    const updatedUser = (db as any).state.users.find((u: any) => u.id === newUser.id);
    expect(kycUpload.success).toBe(true);
    expect(updatedUser.isKYCSubmitted).toBe(true);
    expect(updatedUser.kyc_status).toBe('submitted');
    expect(updatedUser.faceData).toBeDefined();
    expect(updatedUser.kycDocuments.length).toBeGreaterThanOrEqual(3);
  });

  it('Test 3: should handle Admin KYC View & Resubmit Flow', async () => {
    const adminReject = await db.requestKYCResubmission(newUser.id, 'Image is too blurry.');
    
    const rejectedUser = (db as any).state.users.find((u: any) => u.id === newUser.id);
    expect(rejectedUser.kyc_status).toBe('rejected');
    expect(rejectedUser.verificationStatus).toBe(VerificationStatus.REVISION);
    expect(rejectedUser.kyc_rejected_reason).toBe('Image is too blurry.');
  });

  it('Test 4: should handle Admin Final Approval & Restriction Lifting', async () => {
    const adminApprove = await db.adminVerifyUser(newUser.id);
    
    const verifiedUser = (db as any).state.users.find((u: any) => u.id === newUser.id);
    expect(verifiedUser.kyc_status).toBe('verified');
    expect(verifiedUser.isKYCVerified).toBe(true);
    expect(verifiedUser.kyc_rejected_reason).toBeUndefined();
  });

  it('Test 5: should generate and sync Audit Logs in Real-Time', () => {
    const auditRecord = (db as any).state.auditLogs.find((l: any) => l.action === 'Manual Verify' && l.userId === newUser.id);
    expect(auditRecord).toBeDefined();
  });
});
