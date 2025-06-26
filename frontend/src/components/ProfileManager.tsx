import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import type { User } from '../types/user';
import './ProfileManager.css';

interface ProfileManagerProps {
  className?: string;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ className }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  // Load user profile on component mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await userAPI.getProfile();
      
      if (response.success && response.user) {
        setUser(response.user);
        setFormData({
          firstName: response.user.firstName || '',
          lastName: response.user.lastName || '',
          email: response.user.email || ''
        });
      } else {
        setError('Failed to load user profile');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      // Only send changed fields
      const updates: Partial<User> = {};
      if (formData.firstName !== user?.firstName) updates.firstName = formData.firstName;
      if (formData.lastName !== user?.lastName) updates.lastName = formData.lastName;
      if (formData.email !== user?.email) updates.email = formData.email;

      if (Object.keys(updates).length === 0) {
        setIsEditing(false);
        return;
      }

      const response = await userAPI.updateProfile(updates);
      
      if (response.success && response.user) {
        setUser(response.user);
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || ''
    });
    setIsEditing(false);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className={`profile-manager ${className || ''}`}>
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`profile-manager ${className || ''}`}>
        <div className="error">
          <p>❌ Unable to load user profile</p>
          <button onClick={loadUserProfile} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`profile-manager ${className || ''}`}>
      <div className="profile-header">
        <h2>👤 User Profile</h2>
        <div className="profile-status">
          {user.emailVerified && <span className="verified">✅ Verified</span>}
          <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
            {user.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {error && (
        <div className="alert error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className="alert success">
          <strong>Success:</strong> {success}
        </div>
      )}

      <div className="profile-content">
        <div className="profile-info">
          <div className="info-row">
            <label>User ID:</label>
            <span className="value">{user.id}</span>
          </div>
          
          <div className="info-row">
            <label>Role:</label>
            <span className={`value role ${user.role}`}>{user.role}</span>
          </div>
          
          {user.lastLogin && (
            <div className="info-row">
              <label>Last Login:</label>
              <span className="value">
                {new Date(user.lastLogin).toLocaleString()}
              </span>
            </div>
          )}
          
          {user.createdAt && (
            <div className="info-row">
              <label>Member Since:</label>
              <span className="value">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <div className="profile-form">
          <div className="form-group">
            <label htmlFor="firstName">First Name:</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Enter first name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name:</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Enter last name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Enter email address"
            />
          </div>

          <div className="form-actions">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="edit-btn"
              >
                ✏️ Edit Profile
              </button>
            ) : (
              <div className="edit-actions">
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="save-btn"
                >
                  {isSaving ? '💾 Saving...' : '💾 Save Changes'}
                </button>
                <button 
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="cancel-btn"
                >
                  ❌ Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileManager; 