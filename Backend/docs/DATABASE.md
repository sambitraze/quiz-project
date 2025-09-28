# Database Schema Documentation

## Overview
This document describes the database schema for the Quiz Application backend.

## Database: `quiz_app`
Engine: PostgreSQL

---

## Tables

### 1. users
Stores user account information with role-based access control.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing user ID |
| username | VARCHAR(50) | UNIQUE, NOT NULL | Unique username for login |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| password | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| role | user_role | DEFAULT 'student' | User role (student/admin) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- `idx_users_username` on username
- `idx_users_email` on email  
- `idx_users_role` on role

**ENUM Types:**
- `user_role`: ('student', 'admin')

---

### 2. lessons
Stores educational lesson content created by administrators.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing lesson ID |
| title | VARCHAR(200) | NOT NULL | Lesson title |
| content | TEXT | NOT NULL | Lesson content/body |
| created_by | INTEGER | REFERENCES users(id) ON DELETE SET NULL | Creator user ID |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- `idx_lessons_created_by` on created_by
- `idx_lessons_created_at` on created_at

---

### 3. quizzes
Stores quiz metadata and information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing quiz ID |
| title | VARCHAR(200) | NOT NULL | Quiz title |
| description | TEXT | | Quiz description |
| lesson_id | INTEGER | REFERENCES lessons(id) ON DELETE SET NULL | Associated lesson ID |
| created_by | INTEGER | REFERENCES users(id) ON DELETE SET NULL | Creator user ID |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- `idx_quizzes_lesson_id` on lesson_id
- `idx_quizzes_created_by` on created_by
- `idx_quizzes_created_at` on created_at

---

### 4. questions
Stores individual quiz questions with multiple choice answers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing question ID |
| quiz_id | INTEGER | REFERENCES quizzes(id) ON DELETE CASCADE | Parent quiz ID |
| question_text | TEXT | NOT NULL | The question text |
| options | JSON | NOT NULL | Array of answer choices |
| correct_answer | INTEGER | NOT NULL | Index of correct option (0-based) |
| points | INTEGER | DEFAULT 1 | Points awarded for correct answer |

**Indexes:**
- `idx_questions_quiz_id` on quiz_id

**JSON Structure for options:**
```json
["Option 1", "Option 2", "Option 3", "Option 4"]
```

---

### 5. quiz_results
Stores student quiz completion results and scores.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing result ID |
| user_id | INTEGER | REFERENCES users(id) ON DELETE CASCADE | Student user ID |
| quiz_id | INTEGER | REFERENCES quizzes(id) ON DELETE CASCADE | Quiz ID |
| score | INTEGER | NOT NULL | Points earned |
| total_points | INTEGER | NOT NULL | Maximum possible points |
| answers | JSON | NOT NULL | Student's answer choices |
| completed_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Completion time |

**Constraints:**
- `UNIQUE(user_id, quiz_id)` - One attempt per user per quiz

**Indexes:**
- `idx_quiz_results_user_id` on user_id
- `idx_quiz_results_quiz_id` on quiz_id  
- `idx_quiz_results_completed_at` on completed_at

**JSON Structure for answers:**
```json
[
  {
    "question_id": 1,
    "selected_answer": 0
  },
  {
    "question_id": 2, 
    "selected_answer": 2
  }
]
```

---

### 6. feedback
Stores student feedback and ratings for lessons.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing feedback ID |
| user_id | INTEGER | REFERENCES users(id) ON DELETE CASCADE | Student user ID |
| lesson_id | INTEGER | REFERENCES lessons(id) ON DELETE CASCADE | Lesson ID |
| rating | INTEGER | CHECK (rating >= 1 AND rating <= 5) | Rating 1-5 stars |
| comment | TEXT | | Optional feedback comment |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Feedback creation time |

**Constraints:**
- `UNIQUE(user_id, lesson_id)` - One feedback per user per lesson
- `CHECK (rating >= 1 AND rating <= 5)` - Valid rating range

**Indexes:**
- `idx_feedback_user_id` on user_id
- `idx_feedback_lesson_id` on lesson_id
- `idx_feedback_rating` on rating
- `idx_feedback_created_at` on created_at

---

## Relationships

### One-to-Many Relationships:
- `users` → `lessons` (created_by)
- `users` → `quizzes` (created_by)  
- `users` → `quiz_results` (user_id)
- `users` → `feedback` (user_id)
- `lessons` → `quizzes` (lesson_id)
- `lessons` → `feedback` (lesson_id)
- `quizzes` → `questions` (quiz_id)
- `quizzes` → `quiz_results` (quiz_id)

### Cascade Behaviors:
- **ON DELETE CASCADE**: When parent is deleted, children are automatically deleted
  - `questions` when `quizzes` deleted
  - `quiz_results` when `users` or `quizzes` deleted
  - `feedback` when `users` or `lessons` deleted

- **ON DELETE SET NULL**: Foreign key set to NULL when parent deleted
  - `lessons.created_by` when `users` deleted
  - `quizzes.created_by` when `users` deleted
  - `quizzes.lesson_id` when `lessons` deleted

---

## Performance Considerations

### Indexes Created:
- Primary keys (automatic)
- Foreign key columns for join performance
- Frequently queried columns (username, email, created_at)
- Composite indexes on commonly filtered combinations

### Query Optimization:
- Use prepared statements (parameterized queries)
- Index on pagination ORDER BY columns
- Efficient JSON querying for answers/options fields

---

## Data Integrity

### Constraints:
- Foreign key relationships maintain referential integrity
- Unique constraints prevent duplicate users/feedback
- Check constraints validate data ranges (rating 1-5)
- NOT NULL constraints ensure required data

### Validation:
- Application-level validation with Joi schemas
- Database-level constraints as backup
- Password hashing with bcrypt
- Input sanitization to prevent injection

---

## Migration Script

Run the migration to create all tables:
```bash
npm run migrate
```

The migration script (`scripts/migrate.js`) creates all tables with proper relationships, indexes, and constraints in the correct order.

## Sample Data

Run the seed script to populate with sample data:
```bash
npm run seed
```

The seed script (`scripts/seed.js`) creates:
- Sample users (admin + students)
- Sample lessons and quizzes
- Sample quiz results and feedback