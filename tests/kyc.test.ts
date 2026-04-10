/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '../db';
import { VerificationStatus, KYCMethod } from '../types';

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

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadString: vi.fn(),
  getDownloadURL: vi.fn(),
}));

describe('KYC Lifecycle and Gating Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = {
    id: 'USR-TEST-123',
    name: 'KYC Test User',
    verificationStatus: VerificationStatus.UNVERIFIED,
    isKYCVerified: false,
    isKYCSubmitted: false,
    kyc_history: []
  };

  it('should initialize with correct KYC defaults', () => {
    expect(mockUser.verificationStatus).toBe(VerificationStatus.UNVERIFIED);
    expect(mockUser.isKYCVerified).toBe(false);
  });

  it('should process KYC submission correctly', async () => {
    // Manually push user into mock state
    (db as any).state.users.push(mockUser);
    
    const res = await db.submitKYC(
      mockUser.id,
      KYCMethod.CNIC,
      ['data:image/png;base64,mock_front', 'data:image/png;base64,mock_back']
    );

    expect(res.success).toBe(true);
    const updatedUser = (db as any).state.users.find((u: any) => u.id === mockUser.id);
    expect(updatedUser?.isKYCSubmitted).toBe(true);
    expect(updatedUser?.verificationStatus).toBe(VerificationStatus.PENDING);
  });

  it('should handle admin verification', async () => {
    const res = await db.adminVerifyUser(mockUser.id);
    expect(res.success).toBe(true);
    const updatedUser = (db as any).state.users.find((u: any) => u.id === mockUser.id);
    expect(updatedUser?.isKYCVerified).toBe(true);
    expect(updatedUser?.verificationStatus).toBe(VerificationStatus.VERIFIED);
  });

  it('should handle resubmission requests', async () => {
    const res = await db.requestKYCResubmission(mockUser.id, 'Image was blurry');
    expect(res.success).toBe(true);
    const updatedUser = (db as any).state.users.find((u: any) => u.id === mockUser.id);
    expect(updatedUser?.isKYCVerified).toBe(false);
    expect(updatedUser?.verificationStatus).toBe(VerificationStatus.REVISION);
    expect(updatedUser?.kyc_rejected_reason).toBe('Image was blurry');
  });
});
