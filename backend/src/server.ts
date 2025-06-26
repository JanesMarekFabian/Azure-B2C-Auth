//🔧 Funktionen Server Setup & Middleware (server.ts)
// 
// Express Server: Hauptserver mit CORS, Session-Management und Cookie-Parser
// Session-Konfiguration: Sichere Session-Verwaltung mit HTTP-only Cookies
// Health Check: /health Endpoint für Server-Status
// Error Handling: Globale Fehlerbehandlung



// Main Azure B2C Backend Server
import express from "express";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';

// Import Routes
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";

// Import Database
import db from './db';

// Load Environment Variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// =============================================================================
// REDIS CLIENT SETUP
// =============================================================================
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  password: process.env.REDIS_PASSWORD,
});

// Handle Redis connection events
redisClient.on('error', (err: Error) => {
  console.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redisClient.on('ready', () => {
  console.log('✅ Redis client ready');
});

redisClient.on('end', () => {
  console.log('❌ Redis connection ended');
});

// Connect to Redis with error handling
const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    process.exit(-1);
  }
};

// Initialize Redis connection
connectRedis();

// =============================================================================
// MIDDLEWARE SETUP
// =============================================================================
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true, // Important for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// SESSION CONFIGURATION
app.use(session({
  store: new RedisStore({
    client: redisClient,
    prefix: 'azure-b2c:',
  }),
  secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // HTTPS in production
    httpOnly: true, // XSS Protection
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
  },
  name: 'azure.b2c.session', // Custom session name
}));

// =============================================================================
// API ROUTES
// =============================================================================
app.use("/auth", authRoutes);
app.use("/api/user", userRoutes);

// =============================================================================
// HEALTH CHECK ENDPOINT
// =============================================================================
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    await db.query('SELECT 1 as test');
    
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      services: {
        redis: redisClient.isOpen ? 'connected' : 'disconnected',
        database: 'connected',
      },
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(503).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      services: {
        redis: redisClient.isOpen ? 'connected' : 'disconnected',
        database: 'disconnected',
      },
      error: 'Service unavailable',
    });
  }
});

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    ...(process.env.NODE_ENV === 'development' && { details: err.message }),
  });
});

// 404 Handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================
const startServer = async (): Promise<void> => {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Azure B2C Backend running on port ${PORT}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
      console.log(`💾 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(-1);
  }
};

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`${signal} received, shutting down gracefully`);
  
  try {
    // Close Redis connection
    if (redisClient.isOpen) {
      await redisClient.quit();
      console.log('✅ Redis connection closed');
    }
    
    // Close database connections
    await db.end();
    console.log('✅ Database connections closed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('❌ Unhandled Rejection:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the server
startServer();

export default app;
