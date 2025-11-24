# LVL.AI - Gamified Task Management Platform

A comprehensive, AI-powered task management platform that gamifies productivity through XP systems, social features, and intelligent task organization. Built with modern web technologies and featuring multiple specialized applications.

## 🚀 Overview

LVL.AI is a full-stack productivity platform that transforms task management into an engaging, gamified experience. The platform combines traditional task management with AI-powered insights, social features, and a comprehensive hotel management system.

### Key Features

- **🎮 Gamified Experience**: XP-based leveling system with achievements and streaks
- **🤖 AI-Powered Insights**: Smart task suggestions and productivity analysis using DeepSeek AI
- **👥 Social Features**: Friend connections, shared achievements, and collaborative challenges
- **📊 Advanced Analytics**: Comprehensive progress tracking and productivity metrics
- **🏨 Hotel Management**: Complete hotel operations dashboard with booking and billing systems
- **🔐 Secure Authentication**: JWT-based authentication with email verification
- **📱 Responsive Design**: Modern UI built with Tailwind CSS and Radix UI components

## 🏗️ Architecture

The project consists of three main applications:

```
lvl.ai/
├── backend/          # Node.js/Express API server
├── frontend/         # Next.js React application
└── hotel-dashboard/  # Hotel management dashboard
```

## 🛠️ Technology Stack

### Backend (`/backend`)
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **AI Integration**: 
  - OpenRouter API (DeepSeek models)
  - LangChain for AI workflows
  - Custom RAG (Retrieval-Augmented Generation) agent
- **Security**: Helmet.js, rate limiting, input validation
- **Testing**: Jest with MongoDB Memory Server
- **Logging**: Winston logger

### Frontend (`/frontend`)
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with custom components
- **State Management**: React Context API
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Icons**: Heroicons and Lucide React

### Hotel Dashboard (`/hotel-dashboard`)
- **Framework**: Next.js 15 with React 19
- **UI Library**: Radix UI components
- **Styling**: Tailwind CSS
- **Charts**: Recharts for analytics
- **Features**: Booking management, billing system, food delivery tracking

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher ([Download](https://nodejs.org/))
- **MongoDB** 4.4 or higher ([Download](https://www.mongodb.com/try/download/community) or use [Docker](https://www.docker.com/))
- **npm** (comes with Node.js) or **yarn** package manager

> **Note**: This is a Node.js/TypeScript project. No Python virtual environment (venv) is needed.

### Quick Setup (Automated)

Run the setup script to automatically configure the project:

```bash
# Make setup script executable (if needed)
chmod +x setup.sh

# Run setup
./setup.sh
```

The setup script will:
- ✅ Check Node.js version
- ✅ Install backend and frontend dependencies
- ✅ Create `.env` files from `.env.example` templates
- ✅ Provide next steps

### Manual Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lvl.ai
   ```

2. **Install dependencies for all applications**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**

   **Backend** - Copy the example file and update values:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```
   
   Required variables in `backend/.env`:
   ```bash
   NODE_ENV=development
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/lvl-ai
   JWT_ACCESS_TOKEN_SECRET=your_jwt_secret_here  # Generate a secure random string
   JWT_SECRET=your_jwt_secret_here               # Generate a secure random string
   CORS_ORIGIN=http://localhost:3000
   
   # Optional: For AI features
   OPENROUTER_API_KEY=your_openrouter_api_key
   DEEPSEEK_API_KEY=your_deepseek_api_key
   
   # Optional: For email features (password reset, verification)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

   **Frontend** - Copy the example file:
   ```bash
   cd frontend
   cp .env.example .env.local
   # Edit .env.local if needed (default should work)
   ```
   
   Required variables in `frontend/.env.local`:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:5001/api
   ```

4. **Start MongoDB**
   
   **Option 1: Using MongoDB service**
   ```bash
   # macOS (Homebrew)
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```
   
   **Option 2: Using Docker** (Recommended for development)
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```
   
   **Option 3: MongoDB Atlas** (Cloud - Free tier available)
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a cluster and get your connection string
   - Update `MONGODB_URI` in `backend/.env`

5. **Run the applications**

   **Backend** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```
   The backend will start on `http://localhost:5001`

   **Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will start on `http://localhost:3000`

6. **Access the applications**
   - **Frontend Application**: http://localhost:3000
   - **Backend API**: http://localhost:5001
   - **API Health Check**: http://localhost:5001/health

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/logout` | User logout | Private |
| GET | `/api/auth/me` | Get current user | Private |
| PUT | `/api/auth/profile` | Update user profile | Private |
| PUT | `/api/auth/password` | Update password | Private |
| POST | `/api/auth/forgot-password` | Request password reset | Public |
| PUT | `/api/auth/reset-password/:token` | Reset password | Public |
| GET | `/api/auth/verify-email/:token` | Verify email | Public |

### Task Management Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/tasks` | Get user tasks | Private |
| POST | `/api/tasks` | Create new task | Private |
| PUT | `/api/tasks/:id` | Update task | Private |
| DELETE | `/api/tasks/:id` | Delete task | Private |
| PATCH | `/api/tasks/:id/status` | Update task status | Private |

### AI Organizer Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/organizer/chat` | Chat with AI organizer | Private |
| GET | `/api/organizer/suggestions` | Get organization suggestions | Private |
| GET | `/api/organizer/daily-plan` | Get daily task plan | Private |
| GET | `/api/organizer/productivity-analysis` | Analyze productivity patterns | Private |
| GET | `/api/organizer/motivation` | Get motivational messages | Private |

### Social Features Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/friends` | Get friends list | Private |
| POST | `/api/friends/request` | Send friend request | Private |
| PUT | `/api/friends/request/:id` | Accept/reject friend request | Private |
| DELETE | `/api/friends/:id` | Remove friend | Private |

## 🤖 AI Features

### Organizer Agent

The platform includes a sophisticated RAG (Retrieval-Augmented Generation) agent that provides:

- **Context-Aware Assistance**: Retrieves user data and task history for personalized responses
- **Task Organization**: AI-powered suggestions for task prioritization and scheduling
- **Productivity Analysis**: Insights into user patterns and recommendations
- **Daily Planning**: Automated daily task planning based on user preferences
- **Motivational Support**: Personalized encouragement based on progress

### AI Providers

- **Primary**: OpenRouter API with DeepSeek models (free tier)
- **Fallback**: Direct DeepSeek API integration
- **Framework**: LangChain for AI workflow management

## 🎮 Gamification System

### Leveling System
- **XP Points**: Earned by completing tasks (varies by priority and difficulty)
- **Levels**: Progressive leveling system with increasing XP requirements
- **Achievements**: Unlockable badges for various accomplishments
- **Streaks**: Daily completion streaks with bonus rewards

### Social Features
- **Friends System**: Connect with other users
- **Achievement Sharing**: Share accomplishments with friends
- **Leaderboards**: Compare progress with friends
- **Challenges**: Collaborative task challenges

## 🏨 Hotel Dashboard Features

The hotel dashboard provides comprehensive hotel management capabilities:

### Core Modules
- **Dashboard**: Overview of hotel operations with key metrics
- **Booking Management**: Guest check-in/check-out, room assignments
- **Room Management**: Room status, availability tracking
- **Billing System**: Invoice generation, payment tracking
- **Food Delivery**: Room service order management
- **Customer Reviews**: Guest feedback and rating system
- **Analytics**: Revenue tracking, occupancy reports

### Key Metrics
- Daily arrivals/departures
- Room occupancy rates
- Revenue tracking
- Guest satisfaction scores
- Food service analytics

## 🔧 Development Scripts

### Backend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
npm run type-check   # Run TypeScript type checking
```

### Frontend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run type-check   # Run TypeScript type checking
npm run format       # Format code with Prettier
npm run clean        # Clean build artifacts
```

### Hotel Dashboard Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

## 🧪 Testing

### Backend Testing
- **Unit Tests**: Jest for individual function testing
- **Integration Tests**: API endpoint testing with Supertest
- **Database Tests**: MongoDB Memory Server for isolated testing
- **Authentication Tests**: JWT token validation and user flow testing

### Test Coverage
- Authentication flows
- Task CRUD operations
- AI agent functionality
- User management
- API endpoint validation

## 🚀 Deployment

### Production Build

1. **Build all applications**
   ```bash
   # Backend
   cd backend
   npm run build
   
   # Frontend
   cd ../frontend
   npm run build
   
   # Hotel Dashboard
   cd ../hotel-dashboard
   npm run build
   ```

2. **Set production environment variables**

3. **Start production servers**
   ```bash
   # Backend
   cd backend
   npm start
   
   # Frontend
   cd ../frontend
   npm start
   
   # Hotel Dashboard
   cd ../hotel-dashboard
   npm start
   ```

### Environment Requirements
- Node.js >= 18.0.0
- MongoDB >= 4.4
- OpenRouter API key (for AI features)
- SMTP credentials (for email features)

## 📁 Project Structure

### Backend Structure
```
backend/src/
├── ai/                    # AI integration and agents
│   ├── agents/            # RAG organizer agent
│   ├── deepSeek.ts       # DeepSeek API integration
│   ├── langchain.ts      # LangChain workflows
│   └── openRouter.ts     # OpenRouter API client
├── config/               # Configuration files
│   ├── database.ts       # MongoDB connection
│   └── env.ts           # Environment variables
├── controllers/          # Route controllers
│   ├── authController.ts
│   ├── taskController.ts
│   ├── userController.ts
│   └── friendController.ts
├── middleware/           # Custom middleware
│   ├── auth.ts          # Authentication middleware
│   ├── errorHandler.ts  # Error handling
│   ├── securityMiddleware.ts
│   └── upload.ts        # File upload handling
├── models/              # MongoDB models
│   ├── User.ts
│   └── Task.ts
├── routes/              # API routes
│   ├── authRoutes.ts
│   ├── taskRoutes.ts
│   ├── userRoutes.ts
│   ├── friendRoutes.ts
│   └── organizerAgentRoutes.ts
├── services/            # Business logic
├── utils/               # Utility functions
│   ├── logger.ts
│   └── helpers.ts
└── server.ts            # Application entry point
```

### Frontend Structure
```
frontend/src/
├── app/                 # Next.js app directory
│   ├── page.tsx         # Landing page
│   ├── home/            # Dashboard
│   ├── tasks/           # Task management
│   ├── login/           # Authentication
│   └── register/
├── components/          # React components
│   ├── auth/            # Authentication components
│   ├── tasks/            # Task management components
│   ├── ui/               # Reusable UI components
│   ├── layout/           # Layout components
│   └── charts/           # Data visualization
├── contexts/            # React contexts
│   └── AuthContext.tsx
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and configurations
│   ├── api/             # API client and endpoints
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Helper functions
└── providers/           # Context providers
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for secure password storage
- **Input Validation**: Express-validator for request validation
- **Rate Limiting**: Protection against brute force attacks
- **Security Headers**: Helmet.js for security headers
- **CORS Configuration**: Controlled cross-origin requests
- **Email Verification**: Account verification system
- **Password Reset**: Secure password reset flow

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Ensure code passes linting and type checking
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in each application's README
- Review the API documentation for endpoint details

## 🗺️ Roadmap

### Planned Features
- **Mobile App**: React Native mobile application
- **Advanced AI**: Vector database integration for semantic search
- **Team Collaboration**: Multi-user task management
- **Integration APIs**: Third-party service integrations
- **Advanced Analytics**: Machine learning insights
- **Custom Themes**: User-customizable UI themes
- **Offline Support**: Progressive Web App capabilities

---

**Built with ❤️ using modern web technologies**