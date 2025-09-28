const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
}); const createTables = async () => {
    const client = await pool.connect();

    try {
        console.log('Starting database migration...');

        // Start transaction
        await client.query('BEGIN');

        // Create ENUM type for user roles
        await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('student', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

        // Create users table
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role user_role DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create lessons table
        await client.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        video_url VARCHAR(500),
        level VARCHAR(20) DEFAULT 'beginner',
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Add video_url column if it doesn't exist (for existing databases)
        await client.query(`
      DO $$ 
      BEGIN
        BEGIN
          ALTER TABLE lessons ADD COLUMN video_url VARCHAR(500);
        EXCEPTION
          WHEN duplicate_column THEN RAISE NOTICE 'column video_url already exists in lessons.';
        END;
        BEGIN
          ALTER TABLE lessons ADD COLUMN description TEXT;
        EXCEPTION
          WHEN duplicate_column THEN RAISE NOTICE 'column description already exists in lessons.';
        END;
        BEGIN
          ALTER TABLE lessons ADD COLUMN level VARCHAR(20) DEFAULT 'beginner';
        EXCEPTION
          WHEN duplicate_column THEN RAISE NOTICE 'column level already exists in lessons.';
        END;
      END $$;
    `);

        // Create quizzes table
        await client.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Create questions table
        await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        options JSON NOT NULL,
        correct_answer INTEGER NOT NULL,
        points INTEGER DEFAULT 1
      )
    `);

        // Create quiz_results table
        await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        total_points INTEGER NOT NULL,
        answers JSON NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, quiz_id)
      )
    `);

        // Create feedback table
        await client.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, lesson_id)
      )
    `);

        // Create indexes for better performance
        await client.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');

        await client.query('CREATE INDEX IF NOT EXISTS idx_lessons_created_by ON lessons(created_by)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON lessons(created_at)');

        await client.query('CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id ON quizzes(lesson_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_quizzes_created_by ON quizzes(created_by)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quizzes(created_at)');

        await client.query('CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id)');

        await client.query('CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_id ON quiz_results(quiz_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_quiz_results_completed_at ON quiz_results(completed_at)');

        await client.query('CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_feedback_lesson_id ON feedback(lesson_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at)');

        // Commit transaction
        await client.query('COMMIT');

        console.log('✅ Database migration completed successfully!');
        console.log('Tables created:');
        console.log('  - users');
        console.log('  - lessons');
        console.log('  - quizzes');
        console.log('  - questions');
        console.log('  - quiz_results');
        console.log('  - feedback');
        console.log('');
        console.log('Indexes created for better performance.');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Database migration failed:', error.message);
        throw error;
    } finally {
        client.release();
    }
};

const main = async () => {
    try {
        await createTables();
        console.log('Database setup completed. You can now start the server.');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
};

// Run migration if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = { createTables };