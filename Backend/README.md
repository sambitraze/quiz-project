# Quiz Application Backend

A comprehensive Node.js backend for a quiz application built with Express.js and PostgreSQL.

## Features

- **User Management**: Registration, login, and authentication
- **Role-based Access**: Student and Admin roles with different permissions
- **Lessons**: CRUD operations for educational content
- **Quizzes**: Create and manage quizzes with multiple-choice questions
- **Quiz Results**: Track student performance and scores
- **Feedback System**: Students can provide feedback on lessons

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing, helmet for security headers
- **Validation**: Joi for input validation
- **CORS**: Cross-origin resource sharing enabled

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. Clone the repository or navigate to the Backend folder
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```env
   PORT=3001
   DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   ```

4. Set up PostgreSQL database:
   - Use your PostgreSQL connection URL in the DATABASE_URL variable
   - Run the migration script to create tables:
   ```bash
   npm run migrate
   ```

5. (Optional) Seed the database with sample data:
   ```bash
   npm run seed
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on the port specified in your `.env` file (default: 3001).

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (authenticated)

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id/role` - Update user role

### Lessons
- `GET /api/lessons` - Get all lessons
- `GET /api/lessons/:id` - Get lesson by ID
- `POST /api/lessons` - Create new lesson (Admin only)
- `PUT /api/lessons/:id` - Update lesson (Admin only)
- `DELETE /api/lessons/:id` - Delete lesson (Admin only)

### Quizzes
- `GET /api/quizzes` - Get all quizzes
- `GET /api/quizzes/:id` - Get quiz by ID
- `POST /api/quizzes` - Create new quiz (Admin only)
- `PUT /api/quizzes/:id` - Update quiz (Admin only)
- `DELETE /api/quizzes/:id` - Delete quiz (Admin only)

### Quiz Results
- `POST /api/quiz-results` - Submit quiz answers (Students)
- `GET /api/quiz-results/user/:userId` - Get user's quiz results
- `GET /api/quiz-results/quiz/:quizId` - Get all results for a quiz (Admin only)

### Feedback
- `GET /api/feedback` - Get all feedback (Admin only)
- `GET /api/feedback/lesson/:lessonId` - Get feedback for specific lesson
- `POST /api/feedback` - Create new feedback (Students)
- `DELETE /api/feedback/:id` - Delete feedback (Admin only)

## Database Schema

### Users Table
- `id`: Primary key
- `username`: Unique username
- `email`: Unique email address
- `password`: Hashed password
- `role`: ENUM ('student', 'admin')
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Lessons Table
- `id`: Primary key
- `title`: Lesson title
- `content`: Lesson content
- `created_by`: Foreign key to users table
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Quizzes Table
- `id`: Primary key
- `title`: Quiz title
- `description`: Quiz description
- `lesson_id`: Foreign key to lessons table
- `created_by`: Foreign key to users table
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Questions Table
- `id`: Primary key
- `quiz_id`: Foreign key to quizzes table
- `question_text`: The question
- `options`: JSON array of answer options
- `correct_answer`: Index of correct option
- `points`: Points for correct answer

### Quiz Results Table
- `id`: Primary key
- `user_id`: Foreign key to users table
- `quiz_id`: Foreign key to quizzes table
- `score`: User's score
- `total_points`: Maximum possible points
- `answers`: JSON object with user's answers
- `completed_at`: Timestamp

### Feedback Table
- `id`: Primary key
- `user_id`: Foreign key to users table
- `lesson_id`: Foreign key to lessons table
- `rating`: Rating (1-5)
- `comment`: Feedback comment
- `created_at`: Timestamp

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting on API endpoints
- CORS protection
- Helmet for security headers
- Input validation with Joi

## Error Handling

The API uses consistent error response format:
```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

## License

MIT License