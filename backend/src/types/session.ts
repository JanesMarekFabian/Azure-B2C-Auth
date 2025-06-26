

// 🔧 Funktionen im Detail
// 
// TypeScript-Typdefinitionen für sichere Session-Verwaltung mit OAuth2 PKCE, CSRF Protection und Benutzerauthentifizierung.



// Session type declarations
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    oauthState?: string;
    codeVerifier?: string;
    user?: {
      id: number;
      azureUserId: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };
    isAuthenticated?: boolean;
  }
}
