-- Azure B2C Database Schema
-- This script creates the initial database structure for user management
-- 
-- ARCHITECTURE OVERVIEW:
-- - Hybrid identity system: Azure B2C for authentication + local DB for app data
-- - Multi-layered security: RBAC, permissions, audit logging
-- - Performance optimized: Strategic indexing for common queries
-- - Enterprise ready: Referential integrity, triggers, proper data types

-- Enable UUID extension for generating unique identifiers
-- This is useful for session IDs and other unique tokens
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CORE USER TABLE - The foundation of our user management system
-- =============================================================================
-- This table bridges Azure B2C authentication with our local application data
-- Design principle: Dual-ID system (internal + external) for maximum flexibility
CREATE TABLE users (
    -- Internal Database ID (Primary Key)
    -- Used for all internal foreign key relationships
    -- SERIAL = auto-incrementing integer, fast for joins
    id SERIAL PRIMARY KEY,
    
    -- Azure B2C User ID (External Identity)
    -- This is the 'oid' (object identifier) from Azure B2C JWT tokens
    -- UNIQUE ensures no duplicate Azure users in our system
    -- NOT NULL ensures every user has a valid Azure identity
    azure_user_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- Basic User Information
    -- Synchronized from Azure B2C user profile
    -- Email is our primary user identifier and must be unique
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    
    -- Role-based Access Control (RBAC)
    -- CHECK constraint enforces valid roles at database level
    -- DEFAULT 'user' ensures new users get basic permissions
    -- Expandable: add new roles by modifying the CHECK constraint
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'premium')),
    
    -- Account Status Management
    -- is_active: Soft delete mechanism - disable without losing data
    -- email_verified: Track email verification status from Azure B2C
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    
    -- Azure B2C Claims Storage (JSONB for flexibility)
    -- Stores the complete Azure B2C user profile as JSON
    -- JSONB = Binary JSON, faster queries than regular JSON
    -- Allows storing dynamic Azure attributes without schema changes
    azure_claims JSONB DEFAULT '{}',
    
    -- Audit Trail - Essential for security and compliance
    -- TIMESTAMP WITH TIME ZONE = timezone-aware for global applications
    -- created_at: Account creation timestamp
    -- updated_at: Last profile modification (auto-updated via trigger)
    -- last_login: Track user activity patterns
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- SESSION MANAGEMENT TABLE - Hybrid session storage
-- =============================================================================
-- Complements Redis session storage with persistent backup
-- Useful for session analytics and Redis failover scenarios
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    
    -- Foreign key to users table with CASCADE delete
    -- When user is deleted, all their sessions are automatically removed
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session identifier - matches the session ID from express-session
    -- UNIQUE prevents duplicate session IDs
    session_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- Session data storage as JSONB
    -- Stores the same data that would be in Redis
    -- Allows complex queries on session data if needed
    session_data JSONB DEFAULT '{}',
    
    -- Session expiration for automatic cleanup
    -- NOT NULL ensures every session has an expiration
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- GRANULAR PERMISSIONS SYSTEM - Beyond simple roles
-- =============================================================================
-- Allows fine-grained access control beyond the basic role system
-- Example permissions: 'read:reports', 'write:users', 'admin:settings'
CREATE TABLE user_permissions (
    id SERIAL PRIMARY KEY,
    
    -- User receiving the permission
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Permission string - flexible naming convention
    -- Suggested format: 'action:resource' (e.g., 'read:reports')
    permission VARCHAR(100) NOT NULL,
    
    -- Audit trail for permission grants
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Who granted this permission (for accountability)
    -- Self-referencing foreign key to users table
    granted_by INTEGER REFERENCES users(id),
    
    -- Prevent duplicate permissions for the same user
    UNIQUE(user_id, permission)
);

-- =============================================================================
-- SECURITY AUDIT LOG - Complete activity tracking
-- =============================================================================
-- Records all significant user actions for security monitoring
-- Essential for compliance, forensics, and security incident response
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    
    -- User who performed the action (nullable for system actions)
    user_id INTEGER REFERENCES users(id),
    
    -- Action performed - standardized action names
    -- Examples: 'login', 'logout', 'create_document', 'delete_user'
    action VARCHAR(100) NOT NULL,
    
    -- Resource affected by the action
    -- Examples: 'user_profile', 'document_123', 'admin_settings'
    resource VARCHAR(100),
    
    -- Detailed information about the action as JSON
    -- Can store before/after values, additional context, etc.
    details JSONB DEFAULT '{}',
    
    -- Network forensics data
    -- INET type is optimized for IP address storage and queries
    ip_address INET,
    
    -- Client identification for security analysis
    -- Helps detect unusual access patterns or potential attacks
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PERFORMANCE OPTIMIZATION - Strategic indexing
-- =============================================================================
-- Indexes are chosen based on common query patterns in the application

-- Users table indexes - optimized for authentication and user lookups
CREATE INDEX idx_users_azure_user_id ON users(azure_user_id);  -- Login performance
CREATE INDEX idx_users_email ON users(email);                 -- Email-based searches
CREATE INDEX idx_users_role ON users(role);                   -- Admin role filtering
CREATE INDEX idx_users_created_at ON users(created_at);       -- User registration reports
CREATE INDEX idx_users_last_login ON users(last_login);       -- Activity monitoring

-- Session table indexes - optimized for session management
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);   -- User's active sessions
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at); -- Cleanup operations

-- Permission table indexes - optimized for authorization checks
CREATE INDEX idx_permissions_user_id ON user_permissions(user_id); -- User permission lookup

-- Audit log indexes - optimized for security monitoring and reporting
CREATE INDEX idx_audit_user_id ON audit_log(user_id);         -- User activity history
CREATE INDEX idx_audit_created_at ON audit_log(created_at);   -- Time-based audit queries

-- =============================================================================
-- DATABASE AUTOMATION - Triggers and functions
-- =============================================================================
-- Automatic timestamp updates to maintain data consistency

-- Function to update the updated_at column
-- This ensures updated_at is always accurate without manual intervention
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Set the updated_at field to current timestamp
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on users table
-- Fires BEFORE UPDATE to ensure the new timestamp is included in the update
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- DOCUMENTATION - Table and column comments
-- =============================================================================
-- Comprehensive documentation for database maintenance and development

COMMENT ON TABLE users IS 'Core user table synchronized with Azure B2C - stores local user data and maps to external Azure identities';
COMMENT ON COLUMN users.id IS 'Internal primary key for database relationships';
COMMENT ON COLUMN users.azure_user_id IS 'Azure B2C subject ID (oid claim from JWT) - external identity reference';
COMMENT ON COLUMN users.email IS 'User email address - primary identifier and must be unique';
COMMENT ON COLUMN users.role IS 'Basic role-based access control - user/admin/premium';
COMMENT ON COLUMN users.is_active IS 'Soft delete flag - false disables account without data loss';
COMMENT ON COLUMN users.azure_claims IS 'Complete Azure B2C user profile stored as JSONB for flexibility';

COMMENT ON TABLE user_sessions IS 'Session storage backup and analytics - complements Redis session store';
COMMENT ON COLUMN user_sessions.session_id IS 'Express-session compatible session identifier';
COMMENT ON COLUMN user_sessions.expires_at IS 'Session expiration for automatic cleanup';

COMMENT ON TABLE user_permissions IS 'Granular permission system extending basic roles';
COMMENT ON COLUMN user_permissions.permission IS 'Permission string in format action:resource (e.g., read:reports)';
COMMENT ON COLUMN user_permissions.granted_by IS 'User ID who granted this permission for audit trail';

COMMENT ON TABLE audit_log IS 'Complete security audit trail for compliance and forensics';
COMMENT ON COLUMN audit_log.action IS 'Standardized action name (login, create_document, etc.)';
COMMENT ON COLUMN audit_log.resource IS 'Resource affected by the action';
COMMENT ON COLUMN audit_log.details IS 'JSON details including before/after values and context';
COMMENT ON COLUMN audit_log.ip_address IS 'Client IP address for network forensics';
COMMENT ON COLUMN audit_log.user_agent IS 'Client browser/app info for security analysis';

-- =============================================================================
-- INITIAL DATA SETUP (Optional)
-- =============================================================================
-- Placeholder for initial admin user - will be created via API on first admin login
-- This approach is more secure than hardcoding credentials in the schema

-- Example of how the first admin user would be created:
-- INSERT INTO users (azure_user_id, email, first_name, last_name, role, is_active)
-- VALUES ('admin-placeholder', 'admin@your-domain.com', 'System', 'Admin', 'admin', true);

-- =============================================================================
-- MAINTENANCE QUERIES (for reference)
-- =============================================================================
-- Common maintenance operations that should be run periodically:

-- Clean up expired sessions:
-- DELETE FROM user_sessions WHERE expires_at < NOW();

-- Find inactive users (no login in 90 days):
-- SELECT * FROM users WHERE last_login < NOW() - INTERVAL '90 days' OR last_login IS NULL;

-- Audit log cleanup (keep last 1 year):
-- DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '1 year'; 