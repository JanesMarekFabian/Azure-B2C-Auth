# 🔐 Azure B2C Authentication Project

A full-stack authentication system using **Azure B2C External ID**, **PostgreSQL**, **Redis**, and **React**.

## 🚀 Features

- ✅ **Azure B2C External ID** integration
- ✅ **PostgreSQL** database with comprehensive user management
- ✅ **Redis** session store for scalable session management
- ✅ **React + TypeScript** modern frontend
- ✅ **Express.js** backend with 3-tier architecture
- ✅ **Docker** containerized database services
- ✅ **Role-based access control** (RBAC)
- ✅ **Profile management** with modern UI

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Express Backend │    │   PostgreSQL    │
│                 │────│                 │────│                 │
│  - TypeScript   │    │  - 3-Tier Arch  │    │  - User Data    │
│  - Modern UI    │    │  - Session Mgmt  │    │  - Audit Trail  │
│  - Profile Mgmt │    │  - Azure B2C    │    │  - Permissions  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │      Redis      │
                       │                 │
                       │  - Sessions     │
                       │  - Caching      │
                       └─────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js**
- **TypeScript** for type safety
- **PostgreSQL** for persistent data
- **Redis** for session management
- **Azure B2C External ID** for authentication

### Frontend
- **React 18** with modern hooks
- **TypeScript** throughout
- **CSS Modules** for styling
- **Vite** for fast development

### Infrastructure
- **Docker** for database services
- **Docker Compose** for orchestration
- Production-ready configurations

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Azure B2C External ID tenant

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd Azure-B2C-Auth

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Setup
```bash
create the enviroment variables in frontend backend and database.
```

### 3. Start Database Services
```bash
cd datenbank
docker-compose up -d
```

### 4. Start Application
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd frontend
npm run dev
```

### 5. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **pgAdmin**: http://localhost:8080
- **Redis Commander**: http://localhost:8081

## 📁 Project Structure

```
Azure-B2C-Auth/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── repositories/   # Data access layer
│   │   ├── services/       # Business logic layer
│   │   ├── routes/         # API endpoints
│   │   └── types/          # TypeScript definitions
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   └── types/          # TypeScript definitions
│   └── package.json
├── datenbank/              # Database services
│   ├── docker-compose.yml  # PostgreSQL + pgAdmin
│   ├── redis-compose.yml   # Redis + Redis Commander
│   └── init/               # Database initialization
└── README.md
```

## 🔧 Configuration

### Azure B2C Setup
1. Create Azure B2C External ID tenant
2. Register application
3. Configure redirect URIs
4. Update `backend/.env` with your credentials

### Database Schema
The PostgreSQL database includes:
- **Users table** with Azure B2C integration
- **Session management** (hybrid Redis + PostgreSQL)
- **Audit logging** for security compliance
- **Permission system** for role-based access

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration via Azure B2C
- [ ] User login and session persistence
- [ ] Profile management and updates
- [ ] Admin functions (if applicable)
- [ ] Session expiration and cleanup
- [ ] Database connectivity
- [ ] Redis session storage

## 🚀 Deployment

### Production Considerations
- [ ] Environment variables properly configured
- [ ] Database backups scheduled
- [ ] Redis persistence enabled
- [ ] HTTPS certificates configured
- [ ] Rate limiting implemented
- [ ] Monitoring and logging setup

## 📝 Development Notes

This project was built with a focus on:
- **Security**: Proper session management and Azure B2C integration
- **Scalability**: Redis for session storage, PostgreSQL for data
- **Maintainability**: 3-tier architecture with TypeScript
- **User Experience**: Modern React components with responsive design

Its my First serious web development project and I learned a lot from it 

AI will rule the world one day thats the main lesson this project gave me .... im sure! 
I could never created it so fast without the "help" of AI


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational/demonstration purposes.

---

**Built with ❤️ and lots of RedBull ** xDD 



sorry for not cleaning unused stuff in the database.yml feel free to utilize or clean by urself :D
