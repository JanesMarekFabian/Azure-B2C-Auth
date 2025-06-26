// Dashboard Page nach erfolgreichem Login
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, authAPI } from '../services/api';
import type { DashboardData } from '../types/user';
import ProfileManager from '../components/ProfileManager';
import styles from './DashboardPage.module.css';

const DashboardPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  // Dashboard Daten laden
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const response = await userAPI.getDashboard();
        
        if (response.success && response.data) {
          setDashboardData(response.data);
        } else {
          setError('Dashboard-Daten konnten nicht geladen werden.');
        }
      } catch (err) {
        console.error('Dashboard Load Error:', err);
        setError('Fehler beim Laden der Dashboard-Daten.');
        // Bei 401 wird automatisch zu /login redirected (siehe api.ts)
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // Logout Handler
  const handleLogout = async () => {
    try {
      await authAPI.logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout Error:', err);
      // Trotzdem zur Login-Seite navigieren
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p>Dashboard wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.errorCard}>
          <h2>⚠️ Fehler</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className={styles.retryButton}>
            🔄 Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardHeader}>
        <h1>📊 Dashboard</h1>
        <button onClick={handleLogout} className={styles.logoutButton}>
          🚪 Abmelden
        </button>
      </div>

      <div className={styles.welcomeCard}>
        <h2>{dashboardData.welcomeMessage}</h2>
        <div className={styles.userInfo}>
          <div className={styles.userDetail}>
            <strong>👤 Name:</strong> {dashboardData.user.name}
          </div>
          <div className={styles.userDetail}>
            <strong>📧 Email:</strong> {dashboardData.user.email}
          </div>
          <div className={styles.userDetail}>
            <strong>🎭 Rolle:</strong> 
            <span className={styles.roleBadge}>{dashboardData.user.role}</span>
          </div>
          <div className={styles.userDetail}>
            <strong>🔢 ID:</strong> {dashboardData.user.id}
          </div>
        </div>
      </div>

      <div className={styles.featuresCard}>
        <h3>🚀 Verfügbare Features</h3>
        <ul className={styles.featuresList}>
          {dashboardData.features.map((feature, index) => (
            <li key={index} className={styles.featureItem}>
              ✅ {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.actionsCard}>
        <h3>🛠️ Aktionen</h3>
        <div className={styles.actionButtons}>
          <button 
            className={styles.actionButton}
            onClick={() => setShowProfile(!showProfile)}
          >
            👤 {showProfile ? 'Dashboard anzeigen' : 'Profil bearbeiten'}
          </button>
          <button className={styles.actionButton}>
            ⚙️ Einstellungen
          </button>
          {dashboardData.user.role === 'admin' && (
            <button className={styles.adminButton}>
              🔐 Admin-Bereich
            </button>
          )}
        </div>
      </div>

      {/* Profile Manager Section */}
      {showProfile && (
        <div className={styles.profileSection}>
          <ProfileManager />
        </div>
      )}
    </div>
  );
};

export default DashboardPage; 