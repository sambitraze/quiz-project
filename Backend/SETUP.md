# Quiz Application Backend - Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- PostgreSQL (v12+)
- npm or yarn

### 1. Environment Setup
Copy the environment template and configure your database:
```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL connection URL:
```env
PORT=3001
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
```

### 2. Database Setup
Use your PostgreSQL connection URL (supports local PostgreSQL, Neon, Supabase, etc.)

### 3. Install & Run
```bash
# Install dependencies (already done)
npm install

# Run database migrations
npm run migrate

# (Optional) Seed with sample data
npm run seed

# Start development server
npm run dev
```

The server will start on `http://localhost:3001`

## 📁 Project Structure

```
Backend/
├── config/
│   └── database.js          # PostgreSQL connection
├── docs/
│   ├── API.md              # Complete API documentation
│   └── DATABASE.md         # Database schema documentation
├── middleware/
│   ├── auth.js             # Authentication & authorization
│   └── validation.js       # Input validation schemas
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── users.js            # User management (admin)
│   ├── lessons.js          # Lesson CRUD operations
│   ├── quizzes.js          # Quiz & question management
│   ├── quizResults.js      # Quiz submission & results
│   └── feedback.js         # Lesson feedback system
├── scripts/
│   ├── migrate.js          # Database table creation
│   └── seed.js             # Sample data population
├── .env.example            # Environment template
├── .gitignore             # Git ignore rules
├── package.json           # Dependencies & scripts
├── README.md              # Main documentation
├── server.js              # Express server entry point
└── setup.js               # Automated setup script
```

## 🔧 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run migrate` - Create database tables
- `npm run seed` - Populate sample data

## 🧪 Testing with Sample Data

After running `npm run seed`, you can test with these accounts:

### Admin Account
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** Admin (can manage all content)

### Student Accounts
- **Username:** `john_student` | **Password:** `student123`
- **Username:** `jane_student` | **Password:** `student123`
- **Username:** `bob_student` | **Password:** `student123`

## 🔍 API Testing

### 1. Register/Login
```bash
# Register new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test_user","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 2. Get Lessons
```bash
curl http://localhost:3001/api/lessons
```

### 3. Create Quiz (Admin only)
```bash
curl -X POST http://localhost:3001/api/quizzes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Test Quiz",
    "description": "A sample quiz",
    "lesson_id": 1,
    "questions": [
      {
        "question_text": "What is 2+2?",
        "options": ["3", "4", "5", "6"],
        "correct_answer": 1,
        "points": 1
      }
    ]
  }'
```

## 🛡️ Security Features

- **Password Hashing:** bcryptjs with salt rounds
- **JWT Authentication:** Secure token-based auth
- **Rate Limiting:** Prevents API abuse
- **Input Validation:** Joi schemas for all inputs
- **CORS Protection:** Configurable cross-origin requests
- **Helmet Security:** Security headers middleware
- **SQL Injection Prevention:** Parameterized queries

## 📊 Features Overview

### User Management
- ✅ User registration & authentication
- ✅ Role-based access (Student/Admin)
- ✅ JWT token authentication
- ✅ Profile management

### Lessons
- ✅ CRUD operations (Admin)
- ✅ Public lesson viewing
- ✅ Search functionality
- ✅ Pagination support

### Quizzes
- ✅ Quiz creation with questions (Admin)
- ✅ Multiple choice questions
- ✅ Points system
- ✅ Quiz-lesson associations

### Quiz Results
- ✅ Answer submission (Students)
- ✅ Automatic scoring
- ✅ Result tracking
- ✅ Performance analytics
- ✅ One attempt per user per quiz

### Feedback System
- ✅ Lesson feedback & ratings (1-5 stars)
- ✅ Comment system
- ✅ Feedback statistics
- ✅ One feedback per user per lesson

## 🔧 Development

### Adding New Features
1. Create new route file in `/routes`
2. Add middleware for validation/auth
3. Update `server.js` to include routes
4. Add API documentation in `/docs`

### Database Changes
1. Update migration script
2. Add new validation schemas
3. Update API documentation

## 📚 Documentation

- **API Reference:** `/docs/API.md`
- **Database Schema:** `/docs/DATABASE.md`
- **Main README:** `/README.md`

## 🐛 Troubleshooting

### Database Connection Issues
1. Verify PostgreSQL is running
2. Check credentials in `.env`
3. Ensure database exists
4. Check firewall/network settings

### Authentication Problems
1. Verify JWT_SECRET is set
2. Check token expiration
3. Ensure proper Authorization header format

### Migration Failures
1. Check database permissions
2. Verify PostgreSQL version compatibility
3. Review error messages in console

## 🚀 Production Deployment

### Environment Variables
- Set strong `JWT_SECRET`
- Use production database credentials
- Configure appropriate `PORT`
- Set `NODE_ENV=production`

### Security Checklist
- [ ] Strong database passwords
- [ ] Firewall configuration
- [ ] HTTPS/TLS certificates
- [ ] Rate limiting configuration
- [ ] Database backup strategy
- [ ] Log monitoring setup

## 📝 License

MIT License - Feel free to use this project for learning and development.