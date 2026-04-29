/**
 * AI/ML Topic Seed Script
 *
 * Adds 5 AI/ML lessons and their quizzes (with 5+ questions each)
 * to the database. Safe to run multiple times — skips already-existing lessons by title.
 *
 * Usage:
 *   node scripts/seed-aiml.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// ─── Lesson + Quiz data ───────────────────────────────────────────────────────

const LESSONS = [
    {
        title: 'Introduction to Machine Learning',
        description: 'Understand what Machine Learning is, how it works, and the main categories of algorithms.',
        level: 'beginner',
        video_url: 'https://www.youtube.com/embed/ukzFI9rgwfU',
        content: `Machine Learning (ML) is a subset of Artificial Intelligence that gives computers the ability to learn from data without being explicitly programmed. Instead of following hard-coded rules, ML systems identify patterns and improve their performance over time.

Key concepts:
- **Training data**: The dataset used to teach the model.
- **Features**: Input variables used to make predictions.
- **Labels / Target**: The output the model tries to predict.
- **Model**: The mathematical function that maps inputs to outputs.
- **Inference**: Using a trained model to make predictions on new data.

Main categories:
1. **Supervised Learning** — The model learns from labelled examples (e.g., spam detection, house price prediction).
2. **Unsupervised Learning** — The model finds hidden structure in unlabelled data (e.g., clustering, dimensionality reduction).
3. **Reinforcement Learning** — An agent learns by interacting with an environment and receiving rewards or penalties.

Common algorithms: Linear Regression, Logistic Regression, Decision Trees, Random Forests, k-Nearest Neighbours, Support Vector Machines, k-Means Clustering.

Applications: image recognition, natural language processing, recommendation systems, fraud detection, medical diagnosis.`,
        quiz: {
            title: 'Machine Learning Fundamentals Quiz',
            description: 'Test your understanding of core ML concepts and terminology.',
            questions: [
                {
                    question_text: 'What is Machine Learning?',
                    options: ['Writing explicit rules for computers to follow', 'A system that learns patterns from data without being explicitly programmed', 'A programming language for AI', 'A type of computer hardware'],
                    correct_answer: 1, points: 1,
                },
                {
                    question_text: 'Which of the following is an example of Supervised Learning?',
                    options: ['Customer segmentation', 'Email spam classification', 'Topic discovery in documents', 'Anomaly detection without labels'],
                    correct_answer: 1, points: 1,
                },
                {
                    question_text: 'In ML, what is a "feature"?',
                    options: ['The final prediction output', 'An input variable used by the model', 'The training algorithm', 'A type of neural network layer'],
                    correct_answer: 1, points: 1,
                },
                {
                    question_text: 'Which learning type does k-Means clustering belong to?',
                    options: ['Supervised Learning', 'Reinforcement Learning', 'Unsupervised Learning', 'Semi-supervised Learning'],
                    correct_answer: 2, points: 2,
                },
                {
                    question_text: 'What is "overfitting" in machine learning?',
                    options: ['When the model performs well on training data but poorly on new data', 'When the model is too simple to capture patterns', 'When training takes too long', 'When data has too many features'],
                    correct_answer: 0, points: 2,
                },
                {
                    question_text: 'What is the purpose of a test set in ML?',
                    options: ['To train the model', 'To tune hyperparameters', 'To evaluate model performance on unseen data', 'To clean the raw data'],
                    correct_answer: 2, points: 2,
                },
            ],
        },
    },
    {
        title: 'Neural Networks & Deep Learning',
        description: 'Explore artificial neural networks, how they learn, and the foundations of deep learning.',
        level: 'intermediate',
        video_url: 'https://www.youtube.com/embed/aircAruvnKk',
        content: `Artificial Neural Networks (ANNs) are computing systems inspired by biological neural networks in animal brains. They consist of layers of interconnected nodes (neurons) that process information.

Architecture:
- **Input Layer**: Receives raw features.
- **Hidden Layers**: Perform intermediate transformations. More hidden layers = "deeper" network.
- **Output Layer**: Produces the final prediction.

Key concepts:
- **Weights & Biases**: Learnable parameters adjusted during training.
- **Activation Function**: Introduces non-linearity (ReLU, sigmoid, tanh, softmax).
- **Forward Pass**: Data flows through the network to produce a prediction.
- **Loss Function**: Measures how wrong the prediction is (e.g., Mean Squared Error, Cross-Entropy).
- **Backpropagation**: Algorithm that computes gradients of the loss w.r.t. each parameter.
- **Gradient Descent**: Optimisation algorithm that updates weights to minimise loss.
- **Learning Rate**: Controls how large each update step is.

Deep Learning uses neural networks with many hidden layers to learn hierarchical representations. It powers image classification (CNNs), language models (Transformers), and speech recognition (RNNs/LSTMs).

Popular frameworks: TensorFlow, PyTorch, Keras.`,
        quiz: {
            title: 'Neural Networks Deep Dive Quiz',
            description: 'Check your knowledge of neural network architecture and the learning process.',
            questions: [
                {
                    question_text: 'What is the role of the activation function in a neural network?',
                    options: ['To initialise weights', 'To introduce non-linearity into the network', 'To calculate the loss', 'To normalise input data'],
                    correct_answer: 1, points: 1,
                },
                {
                    question_text: 'Which algorithm is used to compute gradients and update weights in a neural network?',
                    options: ['k-Means', 'Backpropagation', 'Principal Component Analysis', 'Bagging'],
                    correct_answer: 1, points: 2,
                },
                {
                    question_text: 'What does "deep" mean in Deep Learning?',
                    options: ['The model uses a large dataset', 'The network has many hidden layers', 'The training takes a very long time', 'The model is deployed in production'],
                    correct_answer: 1, points: 1,
                },
                {
                    question_text: 'Which activation function outputs values strictly between 0 and 1?',
                    options: ['ReLU', 'tanh', 'Sigmoid', 'Linear'],
                    correct_answer: 2, points: 2,
                },
                {
                    question_text: 'What is the learning rate in gradient descent?',
                    options: ['The number of training epochs', 'The size of the dataset', 'A scalar that controls the magnitude of weight updates', 'The number of neurons in the hidden layer'],
                    correct_answer: 2, points: 2,
                },
                {
                    question_text: 'Which type of neural network is most commonly used for image recognition?',
                    options: ['Recurrent Neural Network (RNN)', 'Convolutional Neural Network (CNN)', 'Generative Adversarial Network (GAN)', 'Autoencoder'],
                    correct_answer: 1, points: 2,
                },
            ],
        },
    },
    {
        title: 'Python for Data Science & ML',
        description: 'Learn the essential Python libraries and workflows used in data science and machine learning projects.',
        level: 'beginner',
        video_url: 'https://www.youtube.com/embed/LHBE6Q9XlzI',
        content: `Python has become the dominant language for data science and machine learning thanks to its rich ecosystem of libraries and readable syntax.

Core libraries:
- **NumPy**: N-dimensional arrays and mathematical operations. Most ML libraries are built on top of NumPy.
- **Pandas**: DataFrames for tabular data manipulation, cleaning, and exploration.
- **Matplotlib / Seaborn**: Data visualisation.
- **Scikit-learn**: A comprehensive ML library covering preprocessing, model selection, training, and evaluation.
- **TensorFlow / PyTorch**: Deep learning frameworks.
- **Jupyter Notebooks**: Interactive computing environments popular for data exploration.

Typical ML workflow in Python:
1. Load and explore data (pandas).
2. Clean and preprocess (pandas, scikit-learn preprocessing).
3. Select and train a model (scikit-learn or TensorFlow/PyTorch).
4. Evaluate performance (scikit-learn metrics).
5. Tune hyperparameters (GridSearchCV, Optuna).
6. Deploy the model.

Key concepts: vectorisation, broadcasting, train/test split, pipelines, cross-validation.`,
        quiz: {
            title: 'Python for ML Quiz',
            description: 'Assess your knowledge of Python libraries and workflows for machine learning.',
            questions: [
                {
                    question_text: 'Which Python library provides DataFrames for tabular data manipulation?',
                    options: ['NumPy', 'Pandas', 'Matplotlib', 'Scikit-learn'],
                    correct_answer: 1, points: 1,
                },
                {
                    question_text: 'What function in Scikit-learn splits a dataset into training and test sets?',
                    options: ['train_test_split()', 'split_data()', 'cross_val_score()', 'StandardScaler()'],
                    correct_answer: 0, points: 1,
                },
                {
                    question_text: 'What is a NumPy array?',
                    options: ['A Python dictionary', 'A SQL table', 'An efficient N-dimensional array for numerical computation', 'A type of neural network layer'],
                    correct_answer: 2, points: 1,
                },
                {
                    question_text: 'Which library would you use to plot a histogram in Python?',
                    options: ['NumPy', 'Pandas', 'Matplotlib', 'Scikit-learn'],
                    correct_answer: 2, points: 1,
                },
                {
                    question_text: 'What does cross-validation help with in ML?',
                    options: ['Speeding up training', 'Estimating model performance more reliably by using multiple train/test splits', 'Generating new data', 'Visualising decision boundaries'],
                    correct_answer: 1, points: 2,
                },
                {
                    question_text: 'In scikit-learn, what does fit() do?',
                    options: ['Evaluates the model on test data', 'Trains the model on the provided data', 'Generates predictions', 'Normalises the data'],
                    correct_answer: 1, points: 1,
                },
            ],
        },
    },
    {
        title: 'Natural Language Processing Basics',
        description: 'Discover how computers understand, process, and generate human language using NLP techniques.',
        level: 'intermediate',
        video_url: 'https://www.youtube.com/embed/CMrHM8a3hqw',
        content: `Natural Language Processing (NLP) is a branch of AI focused on enabling computers to understand, interpret, and generate human language.

Core NLP tasks:
- **Tokenisation**: Splitting text into words or sub-words.
- **Part-of-Speech (POS) Tagging**: Labelling words as noun, verb, adjective, etc.
- **Named Entity Recognition (NER)**: Identifying entities like people, places, organisations.
- **Sentiment Analysis**: Determining the emotional tone of text.
- **Machine Translation**: Translating text from one language to another.
- **Text Summarisation**: Condensing long documents into shorter summaries.
- **Question Answering**: Extracting or generating answers from text.

Key concepts:
- **Bag of Words (BoW)**: Represents text as word frequency counts.
- **TF-IDF**: Weights words by their importance in a document vs. the corpus.
- **Word Embeddings** (Word2Vec, GloVe): Dense vector representations that capture semantic meaning.
- **Transformers**: The architecture powering modern NLP (BERT, GPT, T5). Uses self-attention to model long-range dependencies.
- **Large Language Models (LLMs)**: Very large Transformer models (GPT-4, Gemini, Claude) trained on massive text corpora.

Libraries: NLTK, spaCy, HuggingFace Transformers.`,
        quiz: {
            title: 'NLP Concepts Quiz',
            description: 'Test your knowledge of Natural Language Processing techniques and terminology.',
            questions: [
                {
                    question_text: 'What is tokenisation in NLP?',
                    options: ['Training a language model', 'Splitting text into smaller units like words or sub-words', 'Translating text to another language', 'Classifying the sentiment of a sentence'],
                    correct_answer: 1, points: 1,
                },
                {
                    question_text: 'What does TF-IDF stand for?',
                    options: ['Text Frequency — Inverse Document Frequency', 'Term Frequency — Inverse Document Frequency', 'Token Format — Integrated Data Flow', 'Term Function — Input Data Filter'],
                    correct_answer: 1, points: 2,
                },
                {
                    question_text: 'What are word embeddings?',
                    options: ['A method to remove stop words', 'Dense vector representations of words that capture semantic meaning', 'A rule-based grammar parser', 'A tokenisation strategy'],
                    correct_answer: 1, points: 2,
                },
                {
                    question_text: 'Which architecture powers modern LLMs like GPT and BERT?',
                    options: ['Recurrent Neural Network', 'Convolutional Neural Network', 'Transformer', 'Decision Tree'],
                    correct_answer: 2, points: 2,
                },
                {
                    question_text: 'Named Entity Recognition (NER) is used to:',
                    options: ['Translate sentences', 'Identify entities such as names, places, and organisations in text', 'Measure text sentiment', 'Compress documents'],
                    correct_answer: 1, points: 1,
                },
                {
                    question_text: 'Which Python library is commonly used for production-grade NLP pipelines?',
                    options: ['Matplotlib', 'spaCy', 'NumPy', 'Flask'],
                    correct_answer: 1, points: 1,
                },
            ],
        },
    },
    {
        title: 'Model Evaluation & Bias in ML',
        description: 'Learn how to measure model performance correctly and understand bias, fairness, and ethical AI.',
        level: 'advanced',
        video_url: 'https://www.youtube.com/embed/85dtiMz9tSo',
        content: `Evaluating ML models correctly is critical to building trustworthy systems. Choosing the wrong metric can hide serious performance issues.

Classification metrics:
- **Accuracy**: Fraction of correct predictions. Misleading when classes are imbalanced.
- **Precision**: Of all positive predictions, how many were correct?
- **Recall (Sensitivity)**: Of all actual positives, how many did we catch?
- **F1 Score**: Harmonic mean of precision and recall — useful when both matter.
- **AUC-ROC**: Area under the Receiver Operating Characteristic curve — model's ability to distinguish classes.
- **Confusion Matrix**: Table showing true/false positives and negatives.

Regression metrics:
- **MAE** (Mean Absolute Error), **MSE** (Mean Squared Error), **RMSE**, **R² Score**.

Bias & Fairness:
- **Data Bias**: Training data that under-represents or misrepresents certain groups.
- **Algorithmic Bias**: The model amplifies existing societal biases.
- **Types**: Sampling bias, confirmation bias, historical bias, measurement bias.
- **Mitigation**: Diverse datasets, fairness-aware learning, bias auditing tools (Fairlearn, AI Fairness 360).

Responsible AI principles: Transparency, Accountability, Fairness, Privacy, Safety.

Overfitting vs Underfitting:
- Overfitting: high variance — model memorises training data.
- Underfitting: high bias — model too simple.
- Solutions: regularisation (L1/L2), dropout, early stopping, more data.`,
        quiz: {
            title: 'ML Evaluation & Ethics Quiz',
            description: 'Advanced quiz on model evaluation metrics, bias detection, and responsible AI.',
            questions: [
                {
                    question_text: 'Which metric is most suitable when false negatives are very costly (e.g., cancer detection)?',
                    options: ['Accuracy', 'Precision', 'Recall', 'Specificity'],
                    correct_answer: 2, points: 2,
                },
                {
                    question_text: 'What does AUC-ROC measure?',
                    options: ['Training speed', 'Memory usage of the model', 'The model\'s ability to discriminate between classes across all thresholds', 'Mean squared error on validation data'],
                    correct_answer: 2, points: 3,
                },
                {
                    question_text: 'High variance in a machine learning model typically indicates:',
                    options: ['Underfitting', 'Overfitting', 'Balanced bias-variance tradeoff', 'Insufficient training data only'],
                    correct_answer: 1, points: 2,
                },
                {
                    question_text: 'What is L2 regularisation (Ridge) designed to do?',
                    options: ['Speed up training', 'Penalise large weights to reduce overfitting', 'Increase model complexity', 'Remove correlated features'],
                    correct_answer: 1, points: 2,
                },
                {
                    question_text: 'Data bias in ML most commonly occurs when:',
                    options: ['The learning rate is too high', 'Training data does not adequately represent the real-world population', 'The model has too many parameters', 'The test set is larger than the training set'],
                    correct_answer: 1, points: 2,
                },
                {
                    question_text: 'The F1 Score is defined as:',
                    options: ['(Precision + Recall) / 2', '2 * (Precision * Recall) / (Precision + Recall)', 'True Positives / (True Positives + False Negatives)', 'Accuracy when classes are balanced'],
                    correct_answer: 1, points: 3,
                },
            ],
        },
    },
];

// ─── Seeding logic ────────────────────────────────────────────────────────────

async function seedAiMl() {
    const client = await pool.connect();
    try {
        console.log('🤖 Starting AI/ML topic seeding…');
        await client.query('BEGIN');

        // Resolve admin user
        const adminResult = await client.query(
            "SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1"
        );
        if (!adminResult.rows.length) {
            throw new Error('No admin user found. Run the main seed script first.');
        }
        const adminId = adminResult.rows[0].id;

        let lessonsCreated = 0;
        let quizzesCreated = 0;
        let questionsCreated = 0;

        for (const lessonDef of LESSONS) {
            // Check if lesson with this title already exists
            const existingLesson = await client.query('SELECT id FROM lessons WHERE title = $1', [lessonDef.title]);

            let lessonId;
            if (existingLesson.rows.length) {
                lessonId = existingLesson.rows[0].id;
                console.log(`  ↩  Lesson already exists: "${lessonDef.title}"`);
            } else {
                // Insert lesson
                const lessonInsert = await client.query(
                    `INSERT INTO lessons (title, description, content, video_url, level, created_by, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                     RETURNING id`,
                    [lessonDef.title, lessonDef.description, lessonDef.content, lessonDef.video_url, lessonDef.level, adminId]
                );
                lessonId = lessonInsert.rows[0].id;
                lessonsCreated++;
            }

            // Check if quiz already exists for this lesson
            const existingQuiz = await client.query(
                'SELECT id FROM quizzes WHERE title = $1 AND lesson_id = $2',
                [lessonDef.quiz.title, lessonId]
            );

            if (!existingQuiz.rows.length) {
                const quizInsert = await client.query(
                    `INSERT INTO quizzes (title, description, lesson_id, created_by, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, NOW(), NOW())
                     RETURNING id`,
                    [lessonDef.quiz.title, lessonDef.quiz.description, lessonId, adminId]
                );
                const quizId = quizInsert.rows[0].id;
                quizzesCreated++;

                // Insert questions
                for (const q of lessonDef.quiz.questions) {
                    await client.query(
                        `INSERT INTO questions (quiz_id, question_text, options, correct_answer, points)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [quizId, q.question_text, JSON.stringify(q.options), q.correct_answer, q.points]
                    );
                    questionsCreated++;
                }
            } else {
                console.log(`  ↩  Quiz already exists: "${lessonDef.quiz.title}"`);
            }
        }

        await client.query('COMMIT');

        console.log('');
        console.log('✅ AI/ML seeding complete!');
        console.log(`   📚 Lessons  created: ${lessonsCreated}`);
        console.log(`   ❓ Quizzes  created: ${quizzesCreated}`);
        console.log(`   🔤 Questions created: ${questionsCreated}`);
        console.log('');
        console.log('Topics added:');
        LESSONS.forEach(l => console.log(`  • ${l.title} (${l.level})`));
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ AI/ML seeding failed:', err.message);
        throw err;
    } finally {
        client.release();
    }
}

if (require.main === module) {
    seedAiMl()
        .then(() => pool.end())
        .catch(err => { console.error(err); process.exit(1); });
}

module.exports = { seedAiMl };
