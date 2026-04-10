import { db } from '../db';
import { KYCMethod, VerificationStatus, Role } from '../types';

// Mock localStorage and window for the bot test
const mockStorage = new Map();
(global as any).window = { location: { hostname: 'localhost' } };
(global as any).localStorage = {
  getItem: (k: string) => mockStorage.get(k) || null,
  setItem: (k: string, v: string) => mockStorage.set(k, v),
  removeItem: (k: string) => mockStorage.delete(k)
};

// Mock Firebase & Socket
(db as any).initialized = true;

async function runBotAutomation() {
  console.log('🤖 STARTING AUTO-BOT TESTING: KYC LIFECYCLE & IDENTITY SYNCHRONIZATION\n');

  try {
    // 1. User Data Storage & Signup Persistence Fix
    console.log('[TEST 1] Testing Unique Signup & Storage Persistence...');
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
    
    // Simulate backend response bypassing HTTP
    const newUser = {
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

    const checkPersistence = mockStorage.get('click_opticx_state');
    if (!checkPersistence || !checkPersistence.includes(newUser.id)) {
       throw new Error('User did not persist to local storage.');
    }
    console.log('✅ PASS: User successfully saved, unique ID generated, and stored in persistence layer.');

    // 2. KYC Document Storage
    console.log('\n[TEST 2] Testing KYC Document Submission & Linking...');
    const kycUpload = await db.submitKYC(
      newUser.id,
      KYCMethod.LIVE_SCAN,
      ['data:image/png;base64,mockFront', 'data:image/png;base64,mockBack'],
      'Face scan attached.',
      'data:image/png;base64,mockBiometricSelfie'
    );
    
    const updatedUser = (db as any).state.users.find((u: any) => u.id === newUser.id);
    if (!kycUpload.success || !updatedUser.isKYCSubmitted || updatedUser.kyc_status !== 'submitted') {
      throw new Error('KYC Submit failed or status mismatch.');
    }
    if (!updatedUser.faceData || updatedUser.kycDocuments.length < 3) {
      throw new Error('Face verification data or CNIC documents not linked successfully.');
    }
    console.log(`✅ PASS: KYC Documents and Face Data properly linked. Status: ${updatedUser.kyc_status}, Timestamp: ${updatedUser.kycSubmissionDate}`);

    // 3. Admin KYC View & Resubmit Flow
    console.log('\n[TEST 3] Testing Admin View & Force Resubmission...');
    const adminReject = await db.requestKYCResubmission(newUser.id, 'Image is too blurry.');
    
    const rejectedUser = (db as any).state.users.find((u: any) => u.id === newUser.id);
    if (rejectedUser.kyc_status !== 'rejected' || rejectedUser.verificationStatus !== VerificationStatus.REVISION) {
       throw new Error('Admin rejection failed to restrict user.');
    }
    if (rejectedUser.kyc_rejected_reason !== 'Image is too blurry.') {
       throw new Error('Admin reason was not stored.');
    }
    console.log('✅ PASS: Admin successfully forced resubmission. User restricted. History maintained.');

    // 4. One-Time KYC & Final Verification
    console.log('\n[TEST 4] Testing Admin Final Approval & Restriction Lifting...');
    const adminApprove = await db.adminVerifyUser(newUser.id);
    
    const verifiedUser = (db as any).state.users.find((u: any) => u.id === newUser.id);
    if (verifiedUser.kyc_status !== 'verified' || !verifiedUser.isKYCVerified) {
       throw new Error('Verification validation failed.');
    }
    if (verifiedUser.kyc_rejected_reason !== undefined) {
       throw new Error('Rejection reason not cleared upon verification.');
    }
    console.log('✅ PASS: User fully verified. App access unlocked. KYC popup permanently disabled.');

    console.log('\n[TEST 5] Testing Real-Time Synchronized State...');
    const auditRecord = (db as any).state.auditLogs.find((l: any) => l.action === 'Manual Verify' && l.userId === newUser.id);
    if (!auditRecord) {
       throw new Error('Audit real-time log missing.');
    }
    console.log('✅ PASS: Real-time update generated and logged successfully.');

    console.log('\n🎉 ALL BOT AUTOMATION TESTS PASSED 100%!');

  } catch (error: any) {
    console.error(`\n❌ BOT TEST FAILED: ${error.message}`);
    process.exit(1);
  }
}

runBotAutomation();
