/**
 * Domain Profile type (Library-agnostic)
 */
export interface DomainProfile {
  id: string;
  email: string;
  provider: string;
}

/**
 * Mapper to convert library-specific profiles to domain models
 */
export const authMapper = {
  /**
   * Convert Google profile to domain profile
   */
  toDomainProfile(googleProfile: any): DomainProfile {
    return {
      id: googleProfile.id,
      email: googleProfile.emails[0].value,
      provider: 'google',
    };
  }
};
