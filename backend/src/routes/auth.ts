

// 🔧 Funktionen im Detail
// 
// generateCodeVerifier()
// Generiert 256-bit Zufallswert für PKCE
// Base64URL-kodiert (URL-sicher)
// Verhindert Authorization Code Interception
// 
// 
// generateCodeChallenge(verifier: string)
// Erstellt SHA256 Hash aus Code Verifier
// Base64URL-kodiert für OAuth2 PKCE
// Wird an Azure B2C gesendet
// 
// 
// login Endpoint
// Phase 1: Login Initiation
// Generiert PKCE + CSRF State
// Speichert in Session: codeVerifier, oauthState
// Redirect zu Azure B2C Authorization URL
// Error Handling: Redirect zu Frontend bei Fehler
// 
// 
// callback Endpoint
// Phase 2: Callback Handling
// Validierung: CSRF State + Authorization Code + PKCE
// Token Exchange: Authorization Code → Access/ID Token
// Claims Extraction: JWT ID Token → User Information
// Session Creation: User Data in Session speichern
// Cleanup: OAuth State + PKCE Werte löschen
// Redirect: Frontend Dashboard bei Erfolg


// Logout Endpoint
// Session Destruction
// Löscht Session + Session Cookie
// Logging: User Email für Audit
// Response: Success + Redirect URL
// 
// 
// buildAuthUrl(state: string, codeChallenge: string)
// Baut Azure B2C Authorization URL
// Parameter: Client ID, Scopes, PKCE, CSRF State
// Scopes: openid profile email
// Sicherheit: CSRF Protection durch State
// 
// 
// exchangeCodeForToken(code: string, codeVerifier: string)
// Token Exchange mit PKCE
// POST Request an Azure B2C Token Endpoint
// Parameter: Client Secret, Code, Code Verifier
// Response: Access Token, ID Token, Refresh Token
// 
// 
// validateAndExtractClaims(idToken: string)
// JWT Token Validation & Decoding
// Extrahiert User Claims aus ID Token
// Hinweis: In Produktion JWKS-Signaturvalidierung
// Claims: sub, email, given_name, family_name
// 
// 
// createUserSession(req: express.Request, user: any)
// Session Creation nach erfolgreicher Auth
// Speichert User Data: id, azureUserId, email, name, role
// Setzt isAuthenticated = true
// Session wird für API-Zugriff verwendet
// 
// 
// formatUserInfo(claims: any)
// Formatiert Azure B2C Claims für Logging
// Mapping: sub → id, given_name → name
// Fallback: emails[0] wenn email nicht vorhanden
// Return: { id, email, name, surname }



// Azure External ID Authentication Routes
import express from "express";
import crypto from "crypto";
import axios from "axios";
import jwt from "jsonwebtoken";
import "../types/session"; // Import session type extensions
import userService, { AzureUserProfile } from "../services/userService";
import dotenv from "dotenv";
dotenv.config();
const router = express.Router();

// Azure External ID Configuration
const AZURE_CIAM_AUTHORITY_BASE = process.env.AZURE_CIAM_AUTHORITY_BASE; // z.B. freakydeaky.ciamlogin.com
const AZURE_B2C_TENANT_ID = process.env.AZURE_B2C_TENANT_ID;
const AZURE_B2C_CLIENT_ID = process.env.AZURE_B2C_CLIENT_ID;
const AZURE_B2C_CLIENT_SECRET = process.env.AZURE_B2C_CLIENT_SECRET;
const AZURE_B2C_REDIRECT_URI = process.env.AZURE_B2C_REDIRECT_URI;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

console.log('ENV DEBUG:', {
  AZURE_CIAM_AUTHORITY_BASE,
  AZURE_B2C_TENANT_ID,
  AZURE_B2C_CLIENT_ID,
  AZURE_B2C_CLIENT_SECRET,
  AZURE_B2C_REDIRECT_URI
});

// PKCE Helper Functions
function generateCodeVerifier() {
  return crypto.randomBytes(32)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateCodeChallenge(verifier: string) {
  return crypto.createHash('sha256')
    .update(verifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * 🚀 PHASE 1: LOGIN INITIATION
 * GET /auth/login - Redirect to Azure External ID
 */
router.get("/login", (req, res) => {
  try {
    // Generate PKCE values
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    
    // Store PKCE values in session
    req.session.codeVerifier = codeVerifier;
    
    // CSRF Protection with random state
    const state = crypto.randomBytes(16).toString('hex');
    req.session.oauthState = state;

    const authUrl = buildAuthUrl(state, codeChallenge);
    console.log("🚀 Redirecting to Azure External ID:", authUrl);
    
    res.redirect(authUrl);
  } catch (error) {
    console.error("❌ Login initiation error:", error);
    res.redirect(`${FRONTEND_URL}/login?error=login_failed`);
  }

  console.log('ENV DEBUG:', {
    AZURE_CIAM_AUTHORITY_BASE,
    AZURE_B2C_TENANT_ID,
    AZURE_B2C_CLIENT_ID,
    AZURE_B2C_CLIENT_SECRET,
    AZURE_B2C_REDIRECT_URI
  });
  

});

/**
 * 🔄 PHASE 2: CALLBACK HANDLING  
 * GET /auth/callback - Handle Azure External ID callback
 */
router.get("/callback", async (req, res) => {
  console.log("📥 Callback received with query params:", req.query);
  console.log("🔍 Session state:", req.session?.oauthState);
  
  const { code, state } = req.query;

  try {
    // 1. Validate CSRF state
    if (!state || state !== req.session.oauthState) {
      console.error("❌ State validation failed:", {
        receivedState: state,
        sessionState: req.session?.oauthState
      });
      throw new Error("Invalid state parameter - CSRF protection");
    }

    if (!code) {
      console.error("❌ No code received in callback");
      throw new Error("No authorization code received");
    }

    if (!req.session.codeVerifier) {
      console.error("❌ No code verifier found in session");
      throw new Error("PKCE code verifier missing");
    }

    console.log("🎫 Authorization code received");

    // 2. Exchange code for tokens with PKCE
    const tokenData = await exchangeCodeForToken(code as string, req.session.codeVerifier);
    console.log("🎫 Tokens received");

    // 3. Validate and extract user claims
    const claims = await validateAndExtractClaims(tokenData.id_token);
    console.log("👤 User Claims extracted:", formatUserInfo(claims));

    // 4. Register or authenticate user in database
    // Extract email from various possible claim names
    const extractedEmail = claims.email || 
                          claims.emails?.[0] || 
                          claims.preferred_username || 
                          claims.upn || 
                          claims.mail || 
                          claims.unique_name ||
                          `${claims.sub}@unknown.local`; // Fallback with Azure ID

    console.log("📧 Email extraction debug:", {
      claims_email: claims.email,
      claims_emails: claims.emails,
      claims_preferred_username: claims.preferred_username,
      claims_upn: claims.upn,
      claims_mail: claims.mail,
      extractedEmail: extractedEmail,
      allClaims: Object.keys(claims)
    });

    const azureProfile: AzureUserProfile = {
      oid: claims.sub,
      email: extractedEmail,
      given_name: claims.given_name,
      family_name: claims.family_name,
      name: claims.name,
      ...claims // Include all Azure claims
    };

    const { user, isNewUser } = await userService.registerOrAuthenticateUser(azureProfile);
    
    if (isNewUser) {
      console.log("🎉 New user registered and authenticated:", user.email);
    } else {
      console.log("✅ Existing user authenticated:", user.email);
    }

    // 5. Create session with real user data
    createUserSession(req, user);
    console.log("💾 Session created for user:", user.email);

    // 6. Clear OAuth state and PKCE values
    delete req.session.oauthState;
    delete req.session.codeVerifier;

    // 7. Redirect to frontend dashboard
    res.redirect(`${FRONTEND_URL}/dashboard`);

  } catch (error) {
    console.error("❌ Callback Error:", error);
    res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
  }
});

/**
 * 🔒 LOGOUT
 * POST /auth/logout - Destroy session
 */
router.post("/logout", (req, res) => {
  const userEmail = req.session?.user?.email || "unknown";

  req.session.destroy((err: any) => {
    if (err) {
      console.error("❌ Logout Error:", err);
      return res.status(500).json({ success: false });
    }

    console.log("👋 User logged out:", userEmail);
    res.clearCookie("connect.sid");
    res.json({ 
      success: true,
      redirectTo: "/login"
    });
  });
});

// UTILITY FUNCTIONS
function buildAuthUrl(state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: AZURE_B2C_CLIENT_ID!,
    response_type: "code",
    redirect_uri: AZURE_B2C_REDIRECT_URI!,
    scope: "openid profile email",
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256"
  });

  // Verwende die Tenant-ID statt /common
  return `https://${AZURE_CIAM_AUTHORITY_BASE}/${AZURE_B2C_TENANT_ID}/oauth2/v2.0/authorize?${params}`;
}

async function exchangeCodeForToken(code: string, codeVerifier: string) {
  const tokenUrl = `https://${AZURE_CIAM_AUTHORITY_BASE}/${AZURE_B2C_TENANT_ID}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams({
    client_id: AZURE_B2C_CLIENT_ID!,
    client_secret: AZURE_B2C_CLIENT_SECRET!, 
    code: code,
    code_verifier: codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: AZURE_B2C_REDIRECT_URI!,
  });

  const response = await axios.post(tokenUrl, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  return response.data;
}

async function validateAndExtractClaims(idToken: string) {
  // Simple JWT decode - in production, validate signature with JWKS
  const decoded = jwt.decode(idToken) as any;
  
  if (!decoded) {
    throw new Error("Invalid JWT token");
  }

  return decoded;
}

function createUserSession(req: express.Request, user: any) {
  req.session.user = {
    id: user.id,
    azureUserId: user.azure_user_id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
  };
  req.session.isAuthenticated = true;
}

function formatUserInfo(claims: any) {
  return {
    id: claims.sub,
    email: claims.email || claims.emails?.[0],
    name: claims.given_name || claims.name,
    surname: claims.family_name,
  };
}

export default router;