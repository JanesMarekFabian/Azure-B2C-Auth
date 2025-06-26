import db from '../db';

// =============================================================================
// USER REPOSITORY - Database Access Layer
// =============================================================================
// Handles all SQL operations for user management
// Clean separation between business logic and database queries

export interface CreateUserData {
  azureUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  azureClaims?: any;
}

export interface User {
  id: number;
  azure_user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  azure_claims: any;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

class UserRepository {
  
  /**
   * Find user by Azure B2C user ID (oid claim)
   */
  async findByAzureId(azureUserId: string): Promise<User | null> {
    try {
      const result = await db.query(
        'SELECT * FROM users WHERE azure_user_id = $1',
        [azureUserId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error finding user by Azure ID:', error);
      throw error;
    }
  }

  /**
   * Find user by email address
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Create new user from Azure B2C profile
   */
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const result = await db.query(`
        INSERT INTO users (
          azure_user_id, 
          email, 
          first_name, 
          last_name, 
          azure_claims,
          email_verified,
          last_login
        )
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        userData.azureUserId,
        userData.email,
        userData.firstName || null,
        userData.lastName || null,
        JSON.stringify(userData.azureClaims || {}),
        true // Azure B2C emails are pre-verified
      ]);

      const user = result.rows[0];
      console.log('✅ User created successfully:', {
        id: user.id,
        email: user.email,
        azureUserId: user.azure_user_id
      });

      return user;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: number): Promise<void> {
    try {
      await db.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );
      console.log('✅ Updated last login for user ID:', userId);
    } catch (error) {
      console.error('❌ Error updating last login:', error);
      throw error;
    }
  }

  /**
   * Update user's Azure B2C claims (profile sync)
   */
  async updateAzureClaims(userId: number, claims: any): Promise<void> {
    try {
      await db.query(`
        UPDATE users 
        SET 
          azure_claims = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [userId, JSON.stringify(claims)]);
      
      console.log('✅ Updated Azure claims for user ID:', userId);
    } catch (error) {
      console.error('❌ Error updating Azure claims:', error);
      throw error;
    }
  }

  /**
   * Update user profile information
   */
  async updateProfile(userId: number, updates: Partial<CreateUserData>): Promise<User> {
    try {
      const setParts: string[] = [];
      const values: any[] = [userId];
      let paramIndex = 2;

      if (updates.email) {
        setParts.push(`email = $${paramIndex++}`);
        values.push(updates.email);
      }
      
      if (updates.firstName !== undefined) {
        setParts.push(`first_name = $${paramIndex++}`);
        values.push(updates.firstName);
      }
      
      if (updates.lastName !== undefined) {
        setParts.push(`last_name = $${paramIndex++}`);
        values.push(updates.lastName);
      }

      setParts.push(`updated_at = CURRENT_TIMESTAMP`);

      const result = await db.query(`
        UPDATE users 
        SET ${setParts.join(', ')}
        WHERE id = $1
        RETURNING *
      `, values);

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Get user by ID (for session management)
   */
  async findById(userId: number): Promise<User | null> {
    try {
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Deactivate user account (soft delete)
   */
  async deactivateUser(userId: number): Promise<void> {
    try {
      await db.query(
        'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );
      console.log('✅ Deactivated user ID:', userId);
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
      const result = await db.query(
        'SELECT * FROM users WHERE is_active = true ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting active users:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new UserRepository(); 