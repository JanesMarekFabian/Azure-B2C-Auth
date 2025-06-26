import userRepository, { User, CreateUserData } from '../repositories/userRepository';

// =============================================================================
// USER SERVICE - Business Logic Layer
// =============================================================================
// Handles user management business logic
// Coordinates between controllers and repositories

export interface AzureUserProfile {
  oid: string;  // Azure Object ID
  email: string; // Will be extracted/fallback in auth route
  given_name?: string;
  family_name?: string;
  name?: string;
  [key: string]: any; // Additional Azure claims
}

export interface UserRegistrationResult {
  user: User;
  isNewUser: boolean;
}

class UserService {

  /**
   * Register or authenticate user from Azure B2C callback
   * Handles both new user registration and existing user login
   */
  async registerOrAuthenticateUser(azureProfile: AzureUserProfile): Promise<UserRegistrationResult> {
    try {
      console.log('🔍 Processing Azure user profile:', {
        oid: azureProfile.oid,
        email: azureProfile.email,
        name: azureProfile.name
      });

      // Check if user already exists
      const existingUser = await userRepository.findByAzureId(azureProfile.oid);
      
      if (existingUser) {
        // Existing user - update last login and sync claims
        await userRepository.updateLastLogin(existingUser.id);
        await userRepository.updateAzureClaims(existingUser.id, azureProfile);
        
        console.log('✅ Existing user authenticated:', {
          id: existingUser.id,
          email: existingUser.email
        });
        
        return {
          user: existingUser,
          isNewUser: false
        };
      } else {
        // New user - create account
        const userData: CreateUserData = {
          azureUserId: azureProfile.oid,
          email: azureProfile.email, // Already validated/fallback in auth route
          firstName: azureProfile.given_name || this.extractFirstName(azureProfile.name) || 'Unknown',
          lastName: azureProfile.family_name || this.extractLastName(azureProfile.name) || 'User',
          azureClaims: azureProfile
        };

        console.log('📝 Creating user with data:', {
          azureUserId: userData.azureUserId,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName
        });

        const newUser = await userRepository.createUser(userData);
        
        console.log('🎉 New user registered:', {
          id: newUser.id,
          email: newUser.email
        });
        
        return {
          user: newUser,
          isNewUser: true
        };
      }
    } catch (error) {
      console.error('❌ Error in registerOrAuthenticateUser:', error);
      throw error;
    }
  }

  /**
   * Get user by ID (for session management)
   */
  async getUserById(userId: number): Promise<User | null> {
    try {
      return await userRepository.findById(userId);
    } catch (error) {
      console.error('❌ Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Get user by Azure ID
   */
  async getUserByAzureId(azureUserId: string): Promise<User | null> {
    try {
      return await userRepository.findByAzureId(azureUserId);
    } catch (error) {
      console.error('❌ Error getting user by Azure ID:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: number, updates: Partial<CreateUserData>): Promise<User> {
    try {
      console.log('📝 Updating user profile:', { userId, updates });
      return await userRepository.updateProfile(userId, updates);
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Get user's session data (safe for frontend)
   */
  async getUserSessionData(userId: number): Promise<any> {
    try {
      const user = await userRepository.findById(userId);
      if (!user) return null;

      // Return only safe data for frontend
      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isActive: user.is_active,
        emailVerified: user.email_verified,
        lastLogin: user.last_login,
        createdAt: user.created_at
      };
    } catch (error) {
      console.error('❌ Error getting user session data:', error);
      throw error;
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: number): Promise<void> {
    try {
      console.log('⚠️ Deactivating user:', userId);
      await userRepository.deactivateUser(userId);
    } catch (error) {
      console.error('❌ Error deactivating user:', error);
      throw error;
    }
  }

  /**
   * Get all active users (admin function)
   */
  async getAllActiveUsers(): Promise<User[]> {
    try {
      return await userRepository.getAllActiveUsers();
    } catch (error) {
      console.error('❌ Error getting all active users:', error);
      throw error;
    }
  }

  /**
   * Check if user has permission
   */
  async userHasPermission(userId: number, permission: string): Promise<boolean> {
    try {
      // For now, implement basic role-based permissions
      // Later can be extended with the user_permissions table
      const user = await userRepository.findById(userId);
      if (!user || !user.is_active) return false;

      // Admin has all permissions
      if (user.role === 'admin') return true;

      // Basic user permissions
      const userPermissions = ['profile:read', 'profile:update'];
      return userPermissions.includes(permission);
    } catch (error) {
      console.error('❌ Error checking user permission:', error);
      return false;
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Extract first name from full name if given_name not available
   */
  private extractFirstName(fullName?: string): string | undefined {
    if (!fullName) return undefined;
    return fullName.split(' ')[0];
  }

  /**
   * Extract last name from full name if family_name not available
   */
  private extractLastName(fullName?: string): string | undefined {
    if (!fullName) return undefined;
    const parts = fullName.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : undefined;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Sanitize user input
   */
  private sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }
}

// Export singleton instance
export default new UserService(); 