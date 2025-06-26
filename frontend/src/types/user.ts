// User Types für Frontend
export interface User {
  id: number;
  azureUserId?: string; // Optional for updates
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: string | Date;
  createdAt?: string | Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  user?: User;
  error?: string;
  redirectTo?: string;
}

export interface DashboardData {
  welcomeMessage: string;
  user: {
    name: string;
    email: string;
    role: string;
    id: number;
  };
  features: string[];
} 