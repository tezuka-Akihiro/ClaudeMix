import { validateEmail } from './validateEmail';

/**
 * Domain Profile for verification
 */
interface DomainProfile {
  email: string;
  provider: string;
}

/**
 * Pure logic for authentication verification
 */
export const authLogic = {
  /**
   * Verify domain profile against business rules
   */
  processProfile(profile: DomainProfile) {
    // 1. Validate email format
    if (!validateEmail(profile.email)) {
      throw new Error('Invalid email format');
    }

    // 2. Additional business rules (e.g. allowed domains)
    // For now, just return normalized data
    return {
      email: profile.email.toLowerCase(),
      provider: profile.provider,
    };
  }
};
