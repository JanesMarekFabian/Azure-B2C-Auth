

// 🔧 Funktionen im Detail
// 
// requireAuth Middleware
// Prüft ob Benutzer authentifiziert ist
// Session Check: isAuthenticated + user data
// Response: 401 + redirectTo bei fehlender Auth
// 
// 
// requireRole Middleware
// Rollenbasierte Zugriffskontrolle
// Verwendung: requireRole("admin")
// Response: 403 bei fehlenden Berechtigungen
// 
// 
// profile Endpoint
// Gibt aktuelles Benutzerprofil zurück
// Session User Data: id, email, name, role
// Response: { success: true, user: {...} }
// 
// 
// dashboard Endpoint
// Dashboard-Daten mit personalisierter Begrüßung
// Features: Azure B2C Auth, Session Mgmt, Role-based Access
// Response: { success: true, data: { welcomeMessage, user, features } }
// 
// 
// premium Endpoint
// Premium-Inhalt nur für Admins
// Middleware: requireAuth + requireRole("admin")
// Features: Advanced Analytics, Priority Support, Custom Features



// User API Routes  
import express from "express";
import "../types/session"; // Import session type extensions
import userService from "../services/userService";

const router = express.Router();

// Authentication Middleware
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log('🔍 Session Check:', {
    hasSession: !!req.session,
    isAuthenticated: req.session?.isAuthenticated,
    user: req.session?.user?.email
  });

  if (!req.session?.isAuthenticated) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      redirectTo: '/auth/login'
    });
    return;
  }

  next();
};

// Role-based middleware
const requireRole = (role: string) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.session?.user?.role !== role) {
    res.status(403).json({
      success: false,
      error: `Role '${role}' required`
    });
    return;
  }
  next();
};

/**
 * GET /api/user/profile - Get current user profile
 */
router.get("/profile", requireAuth, async (req, res) => {
  try {
    const userId = req.session.user!.id;
    const userData = await userService.getUserSessionData(userId);
    
    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

/**
 * GET /api/user/dashboard - Dashboard data
 */
router.get("/dashboard", requireAuth, (req, res) => {
  const user = req.session.user!;
  
  res.json({
    success: true,
    data: {
      welcomeMessage: `Willkommen zurück, ${user.firstName}!`,
      user: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        id: user.id
      },
      features: [
        "Azure B2C Authentication",
        "Session Management", 
        "Role-based Access"
      ]
    }
  });
});

/**
 * PUT /api/user/profile - Update user profile
 */
router.put("/profile", requireAuth, async (req, res) => {
  try {
    const userId = req.session.user!.id;
    const { firstName, lastName, email } = req.body;

    // Validate input
    if (!firstName && !lastName && !email) {
      return res.status(400).json({
        success: false,
        error: 'At least one field must be provided'
      });
    }

    const updates: any = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (email !== undefined) updates.email = email;

    const updatedUser = await userService.updateUserProfile(userId, updates);
    const userData = await userService.getUserSessionData(updatedUser.id);

    // Update session with new data
    if (req.session.user) {
      req.session.user.firstName = updatedUser.first_name || '';
      req.session.user.lastName = updatedUser.last_name || '';
      req.session.user.email = updatedUser.email;
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userData
    });
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

/**
 * GET /api/user/premium - Premium content (admin only)
 */
router.get("/premium", requireAuth, requireRole("admin"), (req, res) => {
  res.json({
    success: true,
    data: {
      message: "Premium Content - Admin Only",
      features: [
        "Advanced Analytics",
        "Priority Support",
        "Custom Features"
      ]
    }
  });
});

/**
 * GET /api/user/all - Get all users (admin only)
 */
router.get("/all", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const users = await userService.getAllActiveUsers();
    
    // Remove sensitive data
    const safeUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isActive: user.is_active,
      emailVerified: user.email_verified,
      lastLogin: user.last_login,
      createdAt: user.created_at
    }));

    res.json({
      success: true,
      users: safeUsers,
      count: safeUsers.length
    });
  } catch (error) {
    console.error('❌ Error fetching all users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

export default router;
