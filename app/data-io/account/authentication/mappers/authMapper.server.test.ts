import { describe, it, expect } from 'vitest';
import { mapGoogleProfileToUser } from './authMapper.server';
import type { GoogleProfile } from 'remix-auth-google';

describe('authMapper.server', () => {
  describe('mapGoogleProfileToUser', () => {
    it('should map a GoogleProfile to internal user data', () => {
      const mockProfile: GoogleProfile = {
        provider: 'google',
        id: 'google-123',
        displayName: 'John Doe',
        name: { familyName: 'Doe', givenName: 'John' },
        emails: [{ value: 'john@example.com' }],
        photos: [{ value: 'https://example.com/photo.jpg' }],
        _json: {
          sub: 'google-123',
          name: 'John Doe',
          given_name: 'John',
          family_name: 'Doe',
          picture: 'https://example.com/photo.jpg',
          locale: 'en',
          email: 'john@example.com',
          email_verified: true,
          hd: 'example.com',
        },
      };

      const result = mapGoogleProfileToUser(mockProfile);

      expect(result.email).toBe('john@example.com');
      expect(result.oauthId).toBe('google-123');
      expect(result.oauthProvider).toBe('google');
      expect(result.subscriptionStatus).toBe('inactive');
    });
  });
});
