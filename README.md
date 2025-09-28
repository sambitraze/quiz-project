# Quiz Learning Platform

A comprehensive full-stack web application for online learning with interactive lessons, video content, quizzes, and progress tracking.

## 🚀 Features

### 📚 Learning Management
- **Interactive Lessons** - Rich content with embedded video support
- **Video Integration** - YouTube and direct video URL support
- **Difficulty Levels** - Beginner, Intermediate, and Advanced content
- **Progress Tracking** - Monitor learning journey and achievements

### 🧠 Quiz System
- **Interactive Quizzes** - Multiple choice questions with instant feedback
- **Timed Quizzes** - Optional time limits for assessments
- **Detailed Results** - Question-by-question analysis and explanations
- **Performance Analytics** - Track scores, averages, and improvements

### 👥 User Management
- **Role-Based Access** - Student and Admin user roles
- **Authentication** - Secure JWT-based login system
- **User Profiles** - Track individual progress and statistics

### 📊 Admin Dashboard
- **Content Management** - Create and edit lessons, quizzes, and questions
- **User Management** - Monitor student progress and manage accounts
- **Analytics** - View system-wide statistics and performance metrics
- **Results Management** - Review and analyze quiz results

### 🎨 Modern Interface
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Dark/Light Theme Support** - Comfortable viewing in any environment
- **Intuitive Navigation** - Easy-to-use interface for all user types
- **Real-time Feedback** - Toast notifications and loading states

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **PostgreSQL** - Database with Neon cloud hosting
- **JWT** - Authentication and authorization
- **Joi** - Data validation
- **bcryptjs** - Password hashing

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Hot Toast** - Notification system
- **Lucide React** - Icon library

### Database
- **PostgreSQL** - Primary database
- **Neon** - Cloud PostgreSQL hosting
- **Structured Schema** - Users, lessons, quizzes, questions, results, feedback

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **PostgreSQL** database (local or cloud)
- **Git** (for cloning the repository)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd quiz-learning-platform
```

### 2. Backend Setup

#### Navigate to Backend Directory
```bash
cd Backend
```

#### Install Dependencies
```bash
npm install
```

#### Environment Configuration
Create a `.env` file in the Backend directory:
```env
# Database Configuration
DATABASE_URL=your_neon_postgresql_url

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration (optional)
FRONTEND_URL=http://localhost:3000
```

#### Database Setup
```bash
# Run database migrations
npm run migrate

# Seed with sample data
npm run seed
```

#### Start Backend Server
```bash
npm start
```

The backend will be available at `http://localhost:3001`

### 3. Frontend Setup

#### Navigate to Frontend Directory (in a new terminal)
```bash
cd Frontend
```

#### Install Dependencies
```bash
npm install
```

#### Environment Configuration
Create a `.env.local` file in the Frontend directory:
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

#### Start Frontend Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
quiz-learning-platform/
├── Backend/
│   ├── config/
│   │   └── database.js          # Database connection
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   └── validation.js        # Data validation schemas
│   ├── routes/
│   │   ├── auth.js              # Authentication endpoints
│   │   ├── lessons.js           # Lesson management
│   │   ├── quizzes.js           # Quiz management
│   │   ├── quizResults.js       # Quiz results handling
│   │   └── feedback.js          # Feedback system
│   ├── scripts/
│   │   ├── migrate.js           # Database migration
│   │   └── seed.js              # Sample data seeding
│   ├── server.js                # Express server setup
│   └── package.json
├── Frontend/
│   ├── src/
│   │   ├── app/                 # Next.js 14 App Router
│   │   │   ├── auth/            # Authentication pages
│   │   │   ├── student/         # Student dashboard & features
│   │   │   ├── admin/           # Admin dashboard & management
│   │   │   ├── lessons/         # Public lesson previews
│   │   │   └── quizzes/         # Public quiz previews
│   │   ├── components/          # Reusable UI components
│   │   │   ├── LoadingSpinner.js
│   │   │   ├── Navbar.js
│   │   │   ├── ProtectedRoute.js
│   │   │   └── VideoPlayer.js
│   │   ├── contexts/            # React contexts
│   │   │   └── AuthContext.js
│   │   └── lib/
│   │       └── api.js           # API client configuration
│   ├── public/                  # Static assets
│   └── package.json
└── README.md
```

## 🗄️ Database Schema

### Users Table
```sql
- id (Primary Key)
- username (Unique)
- email (Unique)
- password (Hashed)
- role (student/admin)
- created_at, updated_at
```

### Lessons Table
```sql
- id (Primary Key)
- title
- description
- content (Rich text)
- video_url (YouTube/Video URLs)
- level (beginner/intermediate/advanced)
- created_by (Foreign Key to Users)
- created_at, updated_at
```

### Quizzes Table
```sql
- id (Primary Key)
- title
- description
- lesson_id (Foreign Key to Lessons)
- time_limit (Optional)
- created_by (Foreign Key to Users)
- created_at, updated_at
```

### Questions Table
```sql
- id (Primary Key)
- quiz_id (Foreign Key to Quizzes)
- question_text
- options (JSON Array)
- correct_answer (Index)
- points
```

### Quiz Results Table
```sql
- id (Primary Key)
- user_id (Foreign Key to Users)
- quiz_id (Foreign Key to Quizzes)
- score, total_points
- answers (JSON)
- completed_at
```

## 👤 Default Accounts

After running the seed script, you can use these test accounts:

### Admin Account
- **Username:** `admin`
- **Password:** `admin123`
- **Capabilities:** Full system access, content management

### Student Accounts
- **Username:** `john_student` | **Password:** `student123`
- **Username:** `jane_student` | **Password:** `student123`
- **Username:** `bob_student` | **Password:** `student123`

## 🎯 Usage Guide

### For Students
1. **Register/Login** - Create account or use test credentials
2. **Browse Lessons** - View available learning content
3. **Watch Videos** - Embedded video content in lessons
4. **Take Quizzes** - Test knowledge with interactive quizzes
5. **Track Progress** - Monitor scores and learning statistics

### For Admins
1. **Login** - Use admin credentials
2. **Manage Users** - View and manage student accounts
3. **Create Content** - Add lessons with video content
4. **Design Quizzes** - Create questions and assessments
5. **Monitor Results** - Review student performance and analytics

## 📱 API Endpoints

### Authentication
```
POST /api/auth/register - User registration
POST /api/auth/login - User login
POST /api/auth/logout - User logout
```

### Lessons
```
GET /api/lessons - Get all lessons
GET /api/lessons/:id - Get lesson by ID
POST /api/lessons - Create lesson (Admin)
PUT /api/lessons/:id - Update lesson (Admin)
DELETE /api/lessons/:id - Delete lesson (Admin)
```

### Quizzes
```
GET /api/quizzes - Get all quizzes
GET /api/quizzes/:id - Get quiz by ID
POST /api/quizzes - Create quiz (Admin)
PUT /api/quizzes/:id - Update quiz (Admin)
DELETE /api/quizzes/:id - Delete quiz (Admin)
```

### Quiz Results
```
POST /api/quiz-results - Submit quiz answers
GET /api/quiz-results/user/:userId - Get user results
GET /api/quiz-results/:id - Get detailed result
```

## 🎨 Video Support

### Supported Formats
- **YouTube URLs** - Automatic conversion to embeds
- **Direct Video URLs** - MP4, WebM, OGG formats
- **Responsive Player** - 16:9 aspect ratio with full controls

### Video URL Examples
```javascript
// YouTube formats (all supported)
https://www.youtube.com/watch?v=VIDEO_ID
https://youtu.be/VIDEO_ID
https://www.youtube.com/embed/VIDEO_ID

// Direct video files
https://example.com/video.mp4
https://example.com/video.webm
```

## 🔧 Development Scripts

### Backend Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run migrate    # Run database migrations
npm run seed       # Seed database with sample data
```

### Frontend Scripts
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
```

## 🚀 Production Deployment

### Backend Deployment
1. **Environment Variables** - Set production DATABASE_URL and JWT_SECRET
2. **Database Migration** - Run `npm run migrate` on production database
3. **Process Manager** - Use PM2 or similar for process management
4. **HTTPS** - Configure SSL certificates
5. **CORS** - Update CORS settings for production domain

### Frontend Deployment
1. **Environment Variables** - Set production API URL
2. **Build Application** - Run `npm run build`
3. **Static Hosting** - Deploy to Vercel, Netlify, or similar
4. **Domain Configuration** - Configure custom domain and DNS

### Neon Database Setup
1. Create account at [Neon](https://neon.tech)
2. Create new PostgreSQL database
3. Copy connection string to `DATABASE_URL`
4. Run migrations and seeding

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check DATABASE_URL format
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Verify database is accessible
npm run migrate
```

#### CORS Issues
```javascript
// Update CORS configuration in server.js
app.use(cors({
  origin: ['http://localhost:3000', 'your-production-domain.com'],
  credentials: true
}));
```

#### JWT Token Issues
```bash
# Ensure JWT_SECRET is set and consistent
JWT_SECRET=your_super_secret_key_minimum_32_characters
```

#### Video Playback Issues
- Verify video URLs are accessible
- Check HTTPS requirements for embedded content
- Ensure proper CORS headers for video domains

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** - For the excellent React framework
- **Tailwind CSS** - For the utility-first CSS framework
- **Neon** - For cloud PostgreSQL hosting
- **Vercel** - For deployment platform
- **Lucide** - For beautiful icons

## 📞 Support

If you encounter any issues or have questions:

1. **Check the troubleshooting section** above
2. **Review the console logs** for error messages
3. **Verify environment variables** are correctly set
4. **Ensure all dependencies** are installed
5. **Check database connectivity** and migrations

## 🔄 Updates and Maintenance

### Regular Maintenance
- **Update dependencies** regularly for security patches
- **Backup database** before major changes
- **Monitor application** performance and errors
- **Review user feedback** and feature requests

### Version Updates
- **Backend API versioning** for breaking changes
- **Database migration scripts** for schema updates
- **Frontend compatibility** testing across browsers
- **Mobile responsiveness** testing on various devices

---

**Built with ❤️ using modern web technologies**