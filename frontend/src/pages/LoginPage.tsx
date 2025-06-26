// Login Page für Azure B2C Authentication
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import styles from './LoginPage.module.css';




const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  // Check for error parameters from redirect
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'login_failed':
          setError('Login fehlgeschlagen. Bitte versuchen Sie es erneut.');
          break;
        case 'auth_failed':
          setError('Authentifizierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
          break;
        default:
          setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      }
    }
  }, [searchParams]);

  const handleLogin = () => {
    authAPI.login(); // Redirect zu Azure B2C
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h1>🔐 Azure B2C Login</h1>
          <p>Sicherer Login mit Microsoft Azure B2C</p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <span>⚠️ {error}</span>
          </div>
        )}

        <div className={styles.loginContent}>
          <p>
            Klicken Sie auf den Button unten, um sich sicher mit Ihrem 
            Microsoft-Konto anzumelden.
          </p>
          
          <button 
            onClick={handleLogin}
            className={styles.loginButton}
          >
            🚀 Mit Azure B2C anmelden
          </button>
        </div>

        <div className={styles.loginFooter}>
          <p>🛡️ Ihre Daten sind sicher geschützt</p>
          <p>🔒 SSL-verschlüsselte Verbindung</p>
        </div>
      </div>


    </div>
  );
};

export default LoginPage; 