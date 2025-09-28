# API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Error Response Format
```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

## Success Response Format
```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "student" // Optional, defaults to "student"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "student",
      "created_at": "2023-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "student"
    },
    "token": "jwt_token_here"
  }
}
```

### Get Profile
**GET** `/auth/profile`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "student",
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

---

## User Management (Admin Only)

### Get All Users
**GET** `/users?page=1&limit=10`

**Headers:** `Authorization: Bearer <admin_token>`

### Get User by ID
**GET** `/users/:id`

**Headers:** `Authorization: Bearer <token>` (Admin or owner)

### Update User Role
**PUT** `/users/:id/role`

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "role": "admin"
}
```

### Get User Statistics
**GET** `/users/stats/overview`

**Headers:** `Authorization: Bearer <admin_token>`

---

## Lessons

### Get All Lessons
**GET** `/lessons?page=1&limit=10`

### Get Lesson by ID
**GET** `/lessons/:id`

### Create Lesson (Admin Only)
**POST** `/lessons`

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "title": "Introduction to JavaScript",
  "content": "Lesson content here..."
}
```

### Update Lesson (Admin Only)
**PUT** `/lessons/:id`

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "title": "Updated lesson title",
  "content": "Updated lesson content..."
}
```

### Delete Lesson (Admin Only)
**DELETE** `/lessons/:id`

**Headers:** `Authorization: Bearer <admin_token>`

### Search Lessons
**GET** `/lessons/search/:query?page=1&limit=10`

---

## Quizzes

### Get All Quizzes
**GET** `/quizzes?page=1&limit=10`

### Get Quiz by ID (with questions)
**GET** `/quizzes/:id`

### Create Quiz (Admin Only)
**POST** `/quizzes`

**Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "title": "JavaScript Basics Quiz",
  "description": "Test your JavaScript knowledge",
  "lesson_id": 1,
  "questions": [
    {
      "question_text": "What is JavaScript?",
      "options": ["A language", "A framework", "A library", "A database"],
      "correct_answer": 0,
      "points": 1
    }
  ]
}
```

### Update Quiz (Admin Only)
**PUT** `/quizzes/:id`

**Headers:** `Authorization: Bearer <admin_token>`

### Delete Quiz (Admin Only)
**DELETE** `/quizzes/:id`

**Headers:** `Authorization: Bearer <admin_token>`

### Get Quizzes by Lesson
**GET** `/quizzes/lesson/:lessonId`

---

## Quiz Results

### Submit Quiz Answers
**POST** `/quiz-results`

**Headers:** `Authorization: Bearer <student_token>`

**Request Body:**
```json
{
  "quiz_id": 1,
  "answers": [
    {
      "question_id": 1,
      "selected_answer": 0
    },
    {
      "question_id": 2,
      "selected_answer": 2
    }
  ]
}
```

### Get User's Quiz Results
**GET** `/quiz-results/user/:userId?page=1&limit=10`

**Headers:** `Authorization: Bearer <token>` (Admin or owner)

### Get Quiz Results (Admin Only)
**GET** `/quiz-results/quiz/:quizId?page=1&limit=10`

**Headers:** `Authorization: Bearer <admin_token>`

### Get Detailed Result
**GET** `/quiz-results/:id`

**Headers:** `Authorization: Bearer <token>` (Admin or owner)

### Delete Quiz Result (Admin Only)
**DELETE** `/quiz-results/:id`

**Headers:** `Authorization: Bearer <admin_token>`

---

## Feedback

### Get All Feedback (Admin Only)
**GET** `/feedback?page=1&limit=10`

**Headers:** `Authorization: Bearer <admin_token>`

### Get Lesson Feedback
**GET** `/feedback/lesson/:lessonId?page=1&limit=10`

### Create Feedback
**POST** `/feedback`

**Headers:** `Authorization: Bearer <student_token>`

**Request Body:**
```json
{
  "lesson_id": 1,
  "rating": 5,
  "comment": "Great lesson!"
}
```

### Update Feedback
**PUT** `/feedback/:id`

**Headers:** `Authorization: Bearer <token>` (Admin or owner)

### Delete Feedback
**DELETE** `/feedback/:id`

**Headers:** `Authorization: Bearer <token>` (Admin or owner)

### Get My Feedback
**GET** `/feedback/my-feedback?page=1&limit=10`

**Headers:** `Authorization: Bearer <token>`

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (resource already exists)
- `500` - Internal Server Error

---

## Pagination

Many endpoints support pagination with query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

Response includes pagination info:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```