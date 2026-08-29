import { AppState, UserStatus } from '../types';

/**
 * KYC Lifecycle Manager
 * Automatically triggers notifications on Day 3, 5, and 7 for unverified users.
 */
export const checkKYCLifecycle = async (db: any) => {
  const state: AppState = db.state;
  const now = new Date();
  let modified = false;

  for (const user of state.users) {
    // Only remind active, unverified, and non-submitted users
    if (user.status === UserStatus.ACTIVE && !user.isKYCVerified && !user.isKYCSubmitted) {
      const createdAt = new Date(user.createdAt || user.kycSubmissionDate || now);
      const diffTime = Math.abs(now.getTime() - createdAt.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // 3 Day Reminder
      if (diffDays >= 3 && diffDays < 5 && user.lastKYCReminderDay !== 3) {
        db.logNotification(user.id, 'info', 'KYC Reminder', 'Secure your account. Please complete your KYC verification to keep all features unlocked.');
        user.lastKYCReminderDay = 3;
        modified = true;
      }
      // 5 Day Reminder
      else if (diffDays >= 5 && diffDays < 7 && user.lastKYCReminderDay !== 5) {
        db.logNotification(user.id, 'warning', 'KYC Required', 'Important: Your account is still unverified. Complete KYC now to avoid service interruptions.');
        user.lastKYCReminderDay = 5;
        modified = true;
      }
      // 7 Day Final Warning
      else if (diffDays >= 7 && user.lastKYCReminderDay !== 7) {
        db.logNotification(user.id, 'error', 'KYC Final Warning', 'Final Notice: Your ability to activate new packages will be restricted until KYC is verified.');
        user.lastKYCReminderDay = 7;
        modified = true;
      }
    }
  }

  if (modified) {
    await db.commit();
  }
};
