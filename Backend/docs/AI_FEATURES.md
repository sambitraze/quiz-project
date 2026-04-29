# AI Features — Quiz App

All AI features use **Groq (Llama 3.1)** as the primary provider and **Google Gemini** as the fallback. Every feature degrades gracefully to a local response if neither key is configured.

---

## Setup

In `Backend/.env`, set at least one key:

```env
# Recommended — free, no billing required (14,400 req/day)
# Sign up at https://console.groq.com
GROQ_API_KEY=gsk_...

# Fallback — requires a project WITHOUT billing enabled
# Sign up at https://aistudio.google.com/app/apikey
GEMINI_API_KEY=AIza...
```

---

## Feature Reference

### 1. AI Lesson Summary
**Where:** Lesson view page (student dashboard)  
**How to trigger:** Click the **"Generate"** button in the blue "AI Quick Summary" bar at the top of any lesson.

**What it does:** Returns 3 concise bullet-point summaries of the lesson content for quick review.

**API endpoint:**
```
GET /api/ai/lesson-summary/:lessonId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "lessonId": 12,
    "title": "Machine Learning Fundamentals",
    "summary": [
      "Supervised learning uses labelled data to train classification and regression models.",
      "Overfitting occurs when a model memorises training data and fails to generalise.",
      "F1 Score is the preferred metric when dealing with imbalanced class distributions."
    ],
    "aiPowered": true
  }
}
```

If `aiPowered: false`, no API key is configured and the feature returns an empty array.

---

### 2. AI-Enhanced Quiz Performance Summary
**Where:** Quiz results page (after submitting a quiz)  
**How to trigger:** Automatic — shown after every quiz submission.

**What it does:** Generates a personalised 3–4 sentence performance summary based on the student's score, time taken, consistency, predicted difficulty level (ML), and the specific questions they got wrong.

**API endpoint:**
```
GET /api/ai/summary/:resultId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "resultId": 45,
    "summary": "Great effort on the Machine Learning quiz! You scored 83% showing strong understanding of supervised learning concepts. To improve further, revisit overfitting and regularisation techniques — these appear in questions you struggled with. Try reading your notes on bias-variance tradeoff before the next attempt.",
    "aiPowered": true,
    "mlData": { ... }
  }
}
```

Falls back to a deterministic local summary if no API key is set.

---

### 3. Question Hint
**Where:** Quiz results page — next to each incorrectly answered question  
**How to trigger:** Click the **"Get Hint"** button beside a wrong answer.

**What it does:** Generates a 1–2 sentence hint that guides the student toward the correct answer **without directly revealing it**. Focuses on the key concept or reasoning needed.

**API endpoint:**
```
POST /api/ai/hint
Body: { "question_id": 42, "quiz_result_id": 45 }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hint": "Think about what happens to the loss curve when a model performs perfectly on training data but poorly on validation data — which problem does this describe?",
    "aiPowered": true
  }
}
```

---

### 4. AI Quiz Quality Rater *(Admin only)*
**Where:** Admin → Quizzes → Quiz detail page  
**How to trigger:** Click the **"Rate with AI"** button on a quiz.

**What it does:** Analyses the quiz title, difficulty, and up to 8 questions and returns:
- A quality **rating** (1–5 stars)
- A short **feedback** paragraph
- Up to 5 concrete **suggestions** for improvement

**API endpoint:**
```
POST /api/ai/rate-quiz/:quizId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "quizId": 7,
    "rating": 4,
    "feedback": "The quiz covers key concepts well with clear, unambiguous questions. The distractors are plausible and test genuine understanding rather than pattern matching.",
    "suggestions": [
      "Add at least 2 application-based questions to test deeper understanding.",
      "Include one question that requires multi-step reasoning.",
      "Consider adding brief explanations for the correct answers."
    ],
    "aiPowered": true
  }
}
```

---

### 5. AI Question Generator *(Admin only)*
**Where:** Admin → Quizzes → Create/Edit quiz  
**How to trigger:** Fill in a topic, select difficulty and count, then click **"Generate with AI"**.

**What it does:** Generates ready-to-import multiple-choice questions on any computer science topic. If a `lesson_id` is supplied, the questions are grounded in that lesson's content.

**API endpoint:**
```
POST /api/ai/generate-questions
Body: {
  "topic": "Binary Search Trees",
  "difficulty": "medium",
  "count": 3,
  "lesson_id": 4
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "question_text": "What is the average time complexity of searching in a balanced Binary Search Tree?",
        "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        "correct_answer": 1,
        "points": 2,
        "explanation": "In a balanced BST, each comparison eliminates half the remaining nodes, giving O(log n) search time."
      }
    ],
    "count": 3,
    "aiPowered": true
  }
}
```

Generated questions can be reviewed and edited before saving.

---

## Provider Fallback Logic

```
Request comes in
       │
       ▼
GROQ_API_KEY set?
  ├─ Yes → call Groq (llama-3.1-8b-instant)
  │         ├─ Success → return AI response (aiPowered: true)
  │         └─ Fails  → try Gemini ──┐
  │                                  │
  └─ No                              │
       │                             ▼
       └─────────────────► GEMINI_API_KEY set?
                             ├─ Yes → call Gemini (gemini-2.0-flash)
                             │         ├─ Success → return AI response (aiPowered: true)
                             │         └─ Fails  → local fallback
                             └─ No  → local fallback (aiPowered: false)
```

The `aiPowered` boolean in every response tells the frontend whether real AI was used or a local rule-based fallback was returned.

---

## AI Status Check

Check whether the backend has an AI provider configured:

```
GET /api/ai/status
```

```json
{
  "success": true,
  "data": {
    "configured": true,
    "provider": "groq",
    "model": "llama-3.1-8b-instant"
  }
}
```

---

## Rate Limits

| Provider | Free Limit | Notes |
|---|---|---|
| **Groq** | 14,400 requests/day, 30 RPM | No billing required |
| **Gemini 2.0 Flash** | 1,500 requests/day, 15 RPM | Requires project without billing |
