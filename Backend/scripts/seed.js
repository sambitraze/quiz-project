const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
}); const seedData = async () => {
    const client = await pool.connect();

    try {
        console.log('Starting database seeding...');

        await client.query('BEGIN');

        // Hash passwords
        const adminPassword = await bcrypt.hash('admin123', 12);
        const studentPassword = await bcrypt.hash('student123', 12);

        // Create sample users
        const usersResult = await client.query(`
      INSERT INTO users (username, email, password, role, created_at, updated_at) VALUES
      ('admin', 'admin@example.com', $1, 'admin', NOW(), NOW()),
      ('john_student', 'john@example.com', $2, 'student', NOW(), NOW()),
      ('jane_student', 'jane@example.com', $2, 'student', NOW(), NOW()),
      ('bob_student', 'bob@example.com', $2, 'student', NOW(), NOW())
      ON CONFLICT (username) DO NOTHING
      RETURNING id, username, role
    `, [adminPassword, studentPassword]);

        console.log('✅ Sample users created');

        // Get admin ID for creating lessons
        const adminUser = await client.query('SELECT id FROM users WHERE username = $1', ['admin']);
        const adminId = adminUser.rows[0]?.id;

        if (adminId) {
            // Create sample lessons
            const lessonsResult = await client.query(`
        INSERT INTO lessons (title, description, content, video_url, level, created_by, created_at, updated_at) VALUES
        ('Introduction to JavaScript', 
         'Learn the fundamentals of JavaScript programming',
         'JavaScript is a versatile programming language used for web development. In this lesson, we will cover the basics of JavaScript including variables, data types, functions, and control structures. JavaScript can be used both on the client-side (in browsers) and server-side (with Node.js).', 
         'https://www.youtube.com/embed/W6NZfCO5SIk',
         'beginner',
         $1, NOW(), NOW()),
        ('HTML Fundamentals', 
         'Master the building blocks of web pages',
         'HTML (HyperText Markup Language) is the standard markup language for creating web pages. This lesson covers HTML elements, attributes, semantic markup, forms, and best practices for writing clean, accessible HTML code.', 
         'https://www.youtube.com/embed/UB1O30fR-EE',
         'beginner',
         $1, NOW(), NOW()),
        ('CSS Styling Basics', 
         'Style your web pages with CSS',
         'CSS (Cascading Style Sheets) is used to style HTML elements. Learn about selectors, properties, values, the box model, flexbox, grid, and responsive design principles to create beautiful and functional web layouts.', 
         'https://www.youtube.com/embed/yfoY53QXEnI',
         'intermediate',
         $1, NOW(), NOW()),
        ('Database Design Principles', 
         'Design efficient and scalable databases',
         'Understanding database design is crucial for building efficient applications. This lesson covers normalization, relationships, indexing, and PostgreSQL-specific features for optimal database performance.', 
         'https://www.youtube.com/embed/ztHopE5Wnpc',
         'advanced',
         $1, NOW(), NOW())
        RETURNING id, title
      `, [adminId]);

            console.log('✅ Sample lessons created');

            // Create sample quizzes with questions
            for (const lesson of lessonsResult.rows) {
                let quizTitle, quizDescription, questions;

                if (lesson.title === 'Introduction to JavaScript') {
                    quizTitle = 'JavaScript Basics Quiz';
                    quizDescription = 'Test your knowledge of JavaScript fundamentals';
                    questions = [
                        {
                            question_text: 'Which of the following is the correct way to declare a variable in JavaScript?',
                            options: ['var name;', 'variable name;', 'v name;', 'declare name;'],
                            correct_answer: 0,
                            points: 1
                        },
                        {
                            question_text: 'What is the result of typeof null in JavaScript?',
                            options: ['null', 'undefined', 'object', 'boolean'],
                            correct_answer: 2,
                            points: 2
                        },
                        {
                            question_text: 'Which method is used to add an element to the end of an array?',
                            options: ['push()', 'pop()', 'shift()', 'unshift()'],
                            correct_answer: 0,
                            points: 1
                        }
                    ];
                } else if (lesson.title === 'HTML Fundamentals') {
                    quizTitle = 'HTML Knowledge Check';
                    quizDescription = 'Assess your understanding of HTML structure and elements';
                    questions = [
                        {
                            question_text: 'Which HTML element is used for the largest heading?',
                            options: ['<h6>', '<h1>', '<heading>', '<header>'],
                            correct_answer: 1,
                            points: 1
                        },
                        {
                            question_text: 'What does the <a> tag represent in HTML?',
                            options: ['Article', 'Anchor/Link', 'Audio', 'Aside'],
                            correct_answer: 1,
                            points: 1
                        },
                        {
                            question_text: 'Which attribute is used to specify the URL in a link?',
                            options: ['src', 'url', 'href', 'link'],
                            correct_answer: 2,
                            points: 1
                        }
                    ];
                } else if (lesson.title === 'CSS Styling Basics') {
                    quizTitle = 'CSS Fundamentals Quiz';
                    quizDescription = 'Test your CSS knowledge and styling concepts';
                    questions = [
                        {
                            question_text: 'Which CSS property is used to change the text color?',
                            options: ['text-color', 'color', 'font-color', 'text-style'],
                            correct_answer: 1,
                            points: 1
                        },
                        {
                            question_text: 'What does CSS stand for?',
                            options: ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style Sheets', 'Colorful Style Sheets'],
                            correct_answer: 1,
                            points: 1
                        }
                    ];
                } else {
                    quizTitle = 'Database Quiz';
                    quizDescription = 'Test your database design knowledge';
                    questions = [
                        {
                            question_text: 'What is a primary key in a database?',
                            options: ['A key that opens the database', 'A unique identifier for records', 'The first key created', 'A password'],
                            correct_answer: 1,
                            points: 2
                        }
                    ];
                }

                // Create quiz
                const quizResult = await client.query(`
          INSERT INTO quizzes (title, description, lesson_id, created_by, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          RETURNING id
        `, [quizTitle, quizDescription, lesson.id, adminId]);

                const quizId = quizResult.rows[0].id;

                // Create questions for this quiz
                for (const question of questions) {
                    await client.query(`
            INSERT INTO questions (quiz_id, question_text, options, correct_answer, points)
            VALUES ($1, $2, $3, $4, $5)
          `, [quizId, question.question_text, JSON.stringify(question.options), question.correct_answer, question.points]);
                }
            }

            console.log('✅ Sample quizzes and questions created');

            // Create sample feedback
            const students = await client.query('SELECT id FROM users WHERE role = $1 LIMIT 3', ['student']);
            const lessons = await client.query('SELECT id FROM lessons LIMIT 2');

            if (students.rows.length > 0 && lessons.rows.length > 0) {
                const feedbackData = [
                    { user_id: students.rows[0].id, lesson_id: lessons.rows[0].id, rating: 5, comment: 'Excellent lesson! Very clear explanations and great examples.' },
                    { user_id: students.rows[1]?.id, lesson_id: lessons.rows[0].id, rating: 4, comment: 'Good content, but could use more practical exercises.' },
                    { user_id: students.rows[0].id, lesson_id: lessons.rows[1]?.id, rating: 4, comment: 'Well structured lesson with good pace.' },
                    { user_id: students.rows[2]?.id, lesson_id: lessons.rows[1]?.id, rating: 5, comment: 'Perfect introduction to the topic!' }
                ];

                for (const feedback of feedbackData) {
                    if (feedback.user_id && feedback.lesson_id) {
                        await client.query(`
              INSERT INTO feedback (user_id, lesson_id, rating, comment, created_at)
              VALUES ($1, $2, $3, $4, NOW())
              ON CONFLICT (user_id, lesson_id) DO NOTHING
            `, [feedback.user_id, feedback.lesson_id, feedback.rating, feedback.comment]);
                    }
                }

                console.log('✅ Sample feedback created');
            }
        }

        await client.query('COMMIT');

        console.log('');
        console.log('🎉 Database seeding completed successfully!');
        console.log('');
        console.log('Sample data created:');
        console.log('👤 Users:');
        console.log('   - admin (username: admin, password: admin123)');
        console.log('   - john_student (username: john_student, password: student123)');
        console.log('   - jane_student (username: jane_student, password: student123)');
        console.log('   - bob_student (username: bob_student, password: student123)');
        console.log('');
        console.log('📚 Lessons: 4 sample lessons created');
        console.log('❓ Quizzes: 4 quizzes with questions created');
        console.log('💬 Feedback: Sample feedback entries created');
        console.log('');
        console.log('You can now test the API with these sample accounts!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Database seeding failed:', error.message);
        throw error;
    } finally {
        client.release();
    }
};

const main = async () => {
    try {
        await seedData();
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
};

// Run seeding if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = { seedData };