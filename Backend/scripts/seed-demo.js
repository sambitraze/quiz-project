/**
 * seed-demo.js
 * ─────────────────────────────────────────────────────────────
 * Resets all data EXCEPT the admin user, then inserts:
 *   • 8 student users  (credentials printed at the end)
 *   • 10 lessons        (CS / AI / ML topics, full markdown content)
 *   • 10 quizzes        (1 per lesson, 6 questions each)
 *
 * Usage:  node scripts/seed-demo.js
 */

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

// ─── Student accounts ─────────────────────────────────────────────────────────

const STUDENTS = [
    { username: 'alice_smith', email: 'alice@demo.com', password: 'Alice@123' },
    { username: 'bob_jones', email: 'bob@demo.com', password: 'Bob@1234' },
    { username: 'carol_white', email: 'carol@demo.com', password: 'Carol@123' },
    { username: 'david_brown', email: 'david@demo.com', password: 'David@123' },
    { username: 'eva_garcia', email: 'eva@demo.com', password: 'Eva@12345' },
    { username: 'frank_lee', email: 'frank@demo.com', password: 'Frank@123' },
    { username: 'grace_kim', email: 'grace@demo.com', password: 'Grace@123' },
    { username: 'henry_patel', email: 'henry@demo.com', password: 'Henry@123' },
];

// ─── Lessons ──────────────────────────────────────────────────────────────────

const LESSONS = [
    {
        title: 'Introduction to Artificial Intelligence',
        description: 'A broad overview of AI — what it is, how it works, and where it is used today.',
        level: 'beginner',
        video_url: 'https://www.youtube.com/embed/mJeNghZXtMo',
        content: `## What is Artificial Intelligence?

Artificial Intelligence (AI) is the simulation of human intelligence processes by machines, especially computer systems. AI enables computers to perform tasks that normally require human intelligence — such as recognising speech, making decisions, translating languages, and understanding images.

## A Brief History

- **1950** — Alan Turing proposes the "Turing Test" as a measure of machine intelligence.
- **1956** — The term "Artificial Intelligence" is coined at the Dartmouth Conference.
- **1997** — IBM's Deep Blue defeats chess champion Garry Kasparov.
- **2012** — Deep learning breakthroughs dramatically improve image recognition.
- **2022–present** — Large Language Models (ChatGPT, Gemini) reach mainstream adoption.

## Key Branches of AI

| Branch | Description |
|---|---|
| **Machine Learning** | Systems that learn from data without being explicitly programmed |
| **Natural Language Processing** | Understanding and generating human language |
| **Computer Vision** | Interpreting and analysing images and video |
| **Robotics** | Physical agents that perceive and act in the real world |
| **Expert Systems** | Rule-based systems that encode human expertise |

## Types of AI

- **Narrow AI (Weak AI)**: Designed for a specific task (e.g., spam filters, recommendation engines). All AI in use today is Narrow AI.
- **General AI (Strong AI)**: Hypothetical AI with the ability to perform any intellectual task a human can. Does not yet exist.
- **Super AI**: A hypothetical future AI that surpasses all human intelligence.

## Real-World Applications

- **Healthcare**: Medical image analysis, drug discovery, patient outcome prediction.
- **Finance**: Fraud detection, algorithmic trading, credit scoring.
- **Transport**: Self-driving cars, route optimisation, air traffic control.
- **Education**: Personalised learning, automated grading, intelligent tutoring systems.
- **Entertainment**: Game AI, recommendation systems (Netflix, Spotify), content generation.

## Responsible AI Principles

Transparency, Accountability, Fairness, Privacy, Safety — these five principles guide ethical AI development to ensure AI systems benefit society without causing harm.`,
    },
    {
        title: 'Machine Learning Fundamentals',
        description: 'Understand how machines learn from data — covering supervised, unsupervised, and reinforcement learning.',
        level: 'intermediate',
        video_url: 'https://www.youtube.com/embed/ukzFI9rgwfU',
        content: `## What is Machine Learning?

Machine Learning (ML) is a subset of AI where systems learn patterns from data and improve their performance over time **without being explicitly programmed**. Instead of writing rules, we give the algorithm examples and it finds the rules itself.

## The Three Learning Paradigms

### 1. Supervised Learning
The algorithm learns from **labelled** training data — each example has an input and a correct output.

- **Classification**: Predict a category (e.g., spam / not spam, dog / cat / bird).
- **Regression**: Predict a continuous value (e.g., house price, temperature).

Common algorithms: Linear Regression, Logistic Regression, Decision Trees, Random Forests, SVM, Neural Networks.

### 2. Unsupervised Learning
The algorithm finds **hidden patterns** in **unlabelled** data.

- **Clustering**: Group similar data points (K-Means, DBSCAN).
- **Dimensionality Reduction**: Compress data while preserving structure (PCA, t-SNE).
- **Anomaly Detection**: Identify unusual data points.

### 3. Reinforcement Learning
An **agent** learns by interacting with an environment, receiving **rewards** for good actions and **penalties** for bad ones.

- Used in: game playing (AlphaGo), robotics, autonomous vehicles, resource management.

## The ML Pipeline

1. **Data Collection** — gather raw data from various sources.
2. **Data Preprocessing** — clean, normalise, handle missing values, encode categories.
3. **Feature Engineering** — select or create the most informative input variables.
4. **Model Selection** — choose an appropriate algorithm.
5. **Training** — fit the model to training data.
6. **Evaluation** — measure performance on unseen test data.
7. **Tuning** — optimise hyperparameters (e.g., learning rate, tree depth).
8. **Deployment** — serve the model in a production system.

## Overfitting vs Underfitting

- **Overfitting**: The model memorises the training data but fails on new data (too complex).
- **Underfitting**: The model is too simple to capture the underlying pattern.
- **Solution**: Use cross-validation, regularisation, and sufficient training data.

## Evaluation Metrics

Evaluating ML models correctly is critical to building trustworthy systems. Choosing the wrong metric can hide serious performance issues.

**Classification metrics:**
- **Accuracy**: Fraction of correct predictions. Misleading when classes are imbalanced.
- **Precision**: Of all positive predictions, how many were correct?
- **Recall (Sensitivity)**: Of all actual positives, how many did we catch?
- **F1 Score**: Harmonic mean of precision and recall — useful when both matter.
- **AUC-ROC**: Area under the Receiver Operating Characteristic curve — model's ability to distinguish classes.
- **Confusion Matrix**: Table showing true/false positives and negatives.

**Regression metrics:**
- **MAE** (Mean Absolute Error), **MSE** (Mean Squared Error), **RMSE**, **R² Score**.

**Bias & Fairness:**
- **Data Bias**: Training data that under-represents or misrepresents certain groups.
- **Algorithmic Bias**: The model amplifies existing societal biases.
- **Types**: Sampling bias, confirmation bias, historical bias, measurement bias.
- **Mitigation**: Diverse datasets, fairness-aware learning, bias auditing tools (Fairlearn, AI Fairness 360).`,
    },
    {
        title: 'Python Programming for Data Science',
        description: 'Learn Python fundamentals and the essential libraries — NumPy, Pandas, and Matplotlib — used in data science and ML.',
        level: 'beginner',
        video_url: 'https://www.youtube.com/embed/LHBE0uvi5io',
        content: `## Why Python for Data Science?

Python has become the dominant language for data science and machine learning because of:
- **Simple, readable syntax** — easy to learn and maintain.
- **Huge ecosystem** — NumPy, Pandas, Matplotlib, Scikit-learn, TensorFlow, PyTorch.
- **Interactive notebooks** — Jupyter Notebook / Google Colab for experimentation.
- **Community support** — massive community and wealth of tutorials.

## Python Basics Recap

\`\`\`python
# Variables and data types
name = "Alice"
age = 25
score = 98.5
is_student = True

# Lists, tuples, dicts
grades = [90, 85, 92, 78]
student = {"name": "Alice", "gpa": 3.8}

# Functions
def calculate_average(numbers):
    return sum(numbers) / len(numbers)

print(calculate_average(grades))  # 86.25

# List comprehension
squared = [x**2 for x in range(1, 6)]
print(squared)  # [1, 4, 9, 16, 25]
\`\`\`

## NumPy — Numerical Computing

\`\`\`python
import numpy as np

arr = np.array([1, 2, 3, 4, 5])
matrix = np.zeros((3, 3))          # 3x3 matrix of zeros
random_data = np.random.randn(100) # 100 standard-normal samples

print(arr.mean(), arr.std())       # mean and standard deviation
print(np.dot(arr, arr))            # dot product = 55
\`\`\`

## Pandas — Data Manipulation

\`\`\`python
import pandas as pd

# Load data
df = pd.read_csv("students.csv")

# Explore
print(df.head())
print(df.describe())    # summary statistics
print(df.isnull().sum()) # count missing values

# Filter and select
high_scorers = df[df["score"] > 80][["name", "score"]]

# Group and aggregate
avg_by_subject = df.groupby("subject")["score"].mean()
\`\`\`

## Matplotlib — Visualisation

\`\`\`python
import matplotlib.pyplot as plt

# Line chart
plt.plot([1, 2, 3, 4], [10, 20, 25, 30])
plt.title("Score over Time")
plt.xlabel("Week"); plt.ylabel("Score")
plt.show()

# Histogram
plt.hist(df["score"], bins=20, color="steelblue", edgecolor="white")
plt.title("Score Distribution")
plt.show()
\`\`\`

## Key Scikit-learn Workflow

\`\`\`python
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test  = scaler.transform(X_test)

model = LogisticRegression()
model.fit(X_train, y_train)
print(accuracy_score(y_test, model.predict(X_test)))
\`\`\``,
    },
    {
        title: 'Data Structures and Algorithms',
        description: 'Master the fundamental data structures and algorithms every computer scientist needs to know.',
        level: 'intermediate',
        video_url: 'https://www.youtube.com/embed/RBSGKlAvoiM',
        content: `## Why Data Structures & Algorithms Matter

A data structure is a way of organising data in memory. An algorithm is a step-by-step procedure to solve a problem. Choosing the right ones can mean the difference between code that runs in milliseconds and code that takes hours.

## Core Data Structures

### Arrays
- Fixed-size sequential storage in contiguous memory.
- **O(1)** access by index; **O(n)** insertion/deletion in the middle.

### Linked Lists
- Nodes linked by pointers. No contiguous memory needed.
- **O(n)** access; **O(1)** insertion/deletion at head.
- Types: Singly, Doubly, Circular.

### Stacks & Queues
- **Stack (LIFO)**: push / pop — used in undo operations, call stacks.
- **Queue (FIFO)**: enqueue / dequeue — used in BFS, task scheduling.

### Hash Tables
- Key-value pairs with **O(1)** average lookup, insert, delete.
- Collisions handled by chaining or open addressing.

### Trees
- **Binary Search Tree (BST)**: O(log n) search when balanced.
- **Heap**: Complete binary tree; efficient priority queues.
- **Trie**: Prefix tree for string searching.

### Graphs
- Vertices + Edges. Directed or undirected, weighted or unweighted.
- Representations: Adjacency Matrix, Adjacency List.

## Big-O Complexity Cheat Sheet

| Operation | Array | Linked List | Hash Table | BST (balanced) |
|---|---|---|---|---|
| Access | O(1) | O(n) | O(1) | O(log n) |
| Search | O(n) | O(n) | O(1) | O(log n) |
| Insert | O(n) | O(1) | O(1) | O(log n) |
| Delete | O(n) | O(1) | O(1) | O(log n) |

## Essential Sorting Algorithms

| Algorithm | Best | Average | Worst | Stable? |
|---|---|---|---|---|
| Bubble Sort | O(n) | O(n²) | O(n²) | Yes |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | Yes |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | No |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | No |

## Graph Traversal

- **BFS (Breadth-First Search)**: Explores level by level. Uses a queue. Finds shortest path in unweighted graphs.
- **DFS (Depth-First Search)**: Explores as far as possible before backtracking. Uses a stack (or recursion). Used for cycle detection, topological sort.

## Dynamic Programming

Break a problem into overlapping subproblems, solve each once, and store results (memoisation / tabulation).

Classic examples: Fibonacci, Longest Common Subsequence, 0/1 Knapsack, Coin Change.`,
    },
    {
        title: 'Computer Networks and the Internet',
        description: 'Understand how data travels across the internet — from physical cables to application protocols like HTTP.',
        level: 'beginner',
        video_url: 'https://www.youtube.com/embed/3QhU9jd03a0',
        content: `## How Does the Internet Work?

The Internet is a global network of billions of interconnected devices that communicate using standardised protocols. Data is broken into small **packets**, each routed independently across the network and reassembled at the destination.

## The OSI Model (7 Layers)

| Layer | Name | Examples |
|---|---|---|
| 7 | Application | HTTP, HTTPS, DNS, SMTP, FTP |
| 6 | Presentation | TLS/SSL, JPEG, MPEG |
| 5 | Session | NetBIOS, RPC |
| 4 | Transport | TCP, UDP |
| 3 | Network | IP, ICMP, ARP |
| 2 | Data Link | Ethernet, Wi-Fi (802.11) |
| 1 | Physical | Cables, fibre, radio waves |

## IP Addressing

Every device on the Internet has an **IP address**.

- **IPv4**: 32-bit, e.g., \`192.168.1.1\` — ~4 billion addresses (nearly exhausted).
- **IPv6**: 128-bit, e.g., \`2001:0db8::1\` — virtually unlimited addresses.
- **Public vs Private**: Private IP addresses (e.g., 192.168.x.x) are used inside home/office networks; NAT translates them to a single public IP.

## TCP vs UDP

| Feature | TCP | UDP |
|---|---|---|
| Connection | Connection-oriented (handshake) | Connectionless |
| Reliability | Guaranteed delivery, ordering | No guarantee |
| Speed | Slower (overhead) | Faster |
| Use Cases | HTTP, email, file transfer | Video streaming, DNS, gaming |

## DNS — The Internet's Phone Book

The **Domain Name System (DNS)** translates human-readable domain names (e.g., \`google.com\`) into IP addresses (e.g., \`142.250.190.78\`).

Steps:
1. Browser checks local cache.
2. Query sent to **Recursive Resolver** (usually your ISP).
3. Resolver queries **Root Name Server** → **TLD Server** (.com) → **Authoritative Name Server**.
4. IP address returned and cached.

## HTTP & HTTPS

- **HTTP (HyperText Transfer Protocol)**: Application-layer protocol for web communication. Stateless — each request is independent.
- **HTTPS**: HTTP secured with **TLS** encryption. Protects data in transit from eavesdropping and tampering.

**HTTP Methods**: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS.

**Status Codes**:
- 2xx Success (200 OK, 201 Created)
- 3xx Redirection (301 Moved Permanently, 304 Not Modified)
- 4xx Client Error (400 Bad Request, 401 Unauthorised, 404 Not Found)
- 5xx Server Error (500 Internal Server Error, 503 Service Unavailable)`,
    },
    {
        title: 'Operating Systems Concepts',
        description: 'Explore the role of operating systems in managing hardware resources, processes, memory, and file systems.',
        level: 'intermediate',
        video_url: 'https://www.youtube.com/embed/26QPDBe-NB8',
        content: `## What is an Operating System?

An **Operating System (OS)** is the software layer between hardware and user applications. It manages hardware resources and provides services that applications rely on.

Major OSes: **Windows**, **Linux** (Ubuntu, Fedora, Arch), **macOS**, **Android**, **iOS**.

## Core OS Responsibilities

1. **Process Management** — create, schedule, and terminate processes.
2. **Memory Management** — allocate and protect RAM.
3. **File System Management** — organise data on storage devices.
4. **Device Management** — interface with hardware via drivers.
5. **Security & Access Control** — authentication, permissions, sandboxing.

## Process vs Thread

| | Process | Thread |
|---|---|---|
| Definition | Independent program in execution | Lightweight unit of execution within a process |
| Memory | Own address space | Shares process memory |
| Communication | IPC (pipes, sockets) | Shared memory |
| Overhead | High (context switch) | Low |

## CPU Scheduling Algorithms

The **scheduler** decides which process gets the CPU next.

- **FCFS (First Come, First Served)**: Simple but can cause long wait times (convoy effect).
- **SJF (Shortest Job First)**: Minimises average wait time; requires knowing burst time.
- **Round Robin**: Each process gets a fixed time quantum — fair and prevents starvation.
- **Priority Scheduling**: Higher-priority processes run first. Risk of **starvation** for low-priority processes.
- **Multilevel Queue**: Different queues for different process types.

## Memory Management

- **Paging**: Divide memory into fixed-size **pages**. Eliminates external fragmentation.
- **Segmentation**: Divide memory into variable-size **segments** (code, data, stack).
- **Virtual Memory**: Use disk storage to extend RAM. **Page faults** trigger disk reads.
- **Demand Paging**: Load pages into RAM only when needed.

## Deadlock

A **deadlock** occurs when a set of processes are each waiting for a resource held by another, creating a circular dependency.

**Four necessary conditions (Coffman conditions)**:
1. **Mutual Exclusion** — resources cannot be shared.
2. **Hold and Wait** — processes hold resources while waiting for others.
3. **No Preemption** — resources cannot be forcibly taken.
4. **Circular Wait** — a cycle of dependencies exists.

**Prevention strategies**: Break any one of the four conditions.

## File Systems

- **FAT32**: Simple, widely compatible; 4 GB file size limit.
- **NTFS**: Windows default; supports large files, permissions, journalling.
- **ext4**: Linux default; journalled, reliable.
- **APFS**: Apple's modern file system; optimised for SSDs.`,
    },
    {
        title: 'Cybersecurity Fundamentals',
        description: 'Learn the essential concepts of cybersecurity — threats, cryptography, authentication, and secure development.',
        level: 'intermediate',
        video_url: 'https://www.youtube.com/embed/inWWhr5tnEA',
        content: `## Why Cybersecurity Matters

Every connected device is a potential target. Cybercrime costs the global economy trillions of dollars annually. Understanding security is essential for every developer, not just security specialists.

## The CIA Triad

The three core principles of information security:

- **Confidentiality**: Only authorised parties can access data. (Encryption, access controls)
- **Integrity**: Data is accurate and has not been tampered with. (Hashing, digital signatures)
- **Availability**: Systems and data are accessible when needed. (Redundancy, DDoS mitigation)

## Common Attack Types

### Social Engineering
- **Phishing**: Fake emails / websites trick users into revealing credentials.
- **Spear Phishing**: Targeted phishing using personal information.
- **Pretexting**: Attacker fabricates a scenario to extract information.

### Web Application Attacks (OWASP Top 10)
- **SQL Injection**: Malicious SQL inserted into input fields to manipulate the database.
- **Cross-Site Scripting (XSS)**: Injecting scripts into web pages viewed by other users.
- **Cross-Site Request Forgery (CSRF)**: Trick a user's browser into making unintended requests.
- **Broken Authentication**: Weak passwords, missing MFA, insecure session management.
- **Security Misconfiguration**: Default credentials, unnecessary services exposed.

### Network Attacks
- **Man-in-the-Middle (MITM)**: Intercepting communications between two parties.
- **DDoS (Distributed Denial of Service)**: Overwhelm a server with traffic.
- **Port Scanning**: Probing for open ports and services (Nmap).

## Cryptography Essentials

### Symmetric Encryption
Same key for encryption and decryption.
- Examples: **AES-256**, DES, 3DES.
- Fast but key distribution is a problem.

### Asymmetric Encryption (Public-Key)
Public key encrypts; private key decrypts (and vice versa for signatures).
- Examples: **RSA**, **ECC**.
- Used in TLS/HTTPS, SSH, digital certificates.

### Hashing
One-way function — input → fixed-size digest. Cannot be reversed.
- Examples: **SHA-256**, SHA-3, bcrypt (for passwords).
- Use bcrypt/Argon2 for passwords — they include salt and are intentionally slow.

## Authentication & Authorisation

- **Authentication** (AuthN): Verifying *who* you are — password, MFA, biometrics.
- **Authorisation** (AuthZ): Verifying *what* you can do — RBAC, ACLs.
- **JWT (JSON Web Token)**: Stateless token for API authentication. Must be signed (HS256/RS256) and kept short-lived.
- **OAuth 2.0**: Delegation protocol allowing third-party access without sharing passwords.
- **MFA (Multi-Factor Authentication)**: Something you know + something you have + something you are.

## Secure Development Practices

- Validate and sanitise ALL user input.
- Use parameterised queries / prepared statements to prevent SQL injection.
- Store passwords with bcrypt/Argon2 — never MD5 or plain text.
- Apply the **principle of least privilege** — give only the minimum access required.
- Keep dependencies updated — vulnerabilities in libraries are a leading attack vector.
- Use HTTPS everywhere; enforce HSTS.`,
    },
    {
        title: 'Database Management Systems',
        description: 'Learn relational database design, SQL, indexing, transactions, and modern NoSQL alternatives.',
        level: 'intermediate',
        video_url: 'https://www.youtube.com/embed/7S_tz1z_5bA',
        content: `## What is a Database Management System?

A **DBMS** is software that manages data storage, retrieval, and manipulation. It provides a layer of abstraction over raw file storage, ensuring data consistency, security, and efficient access.

Popular RDBMS: **PostgreSQL**, MySQL, Oracle, SQL Server.
Popular NoSQL: **MongoDB**, Redis, Cassandra, DynamoDB.

## Relational Model

Data is organised in **tables** (relations) with **rows** (tuples) and **columns** (attributes). Tables are linked by **foreign keys**.

## SQL Essentials

\`\`\`sql
-- Create a table
CREATE TABLE students (
    id       SERIAL PRIMARY KEY,
    name     VARCHAR(100) NOT NULL,
    email    VARCHAR(255) UNIQUE NOT NULL,
    gpa      DECIMAL(3,2),
    enrolled DATE DEFAULT CURRENT_DATE
);

-- Insert
INSERT INTO students (name, email, gpa) VALUES ('Alice', 'alice@demo.com', 3.8);

-- Query with filter and ordering
SELECT name, gpa
FROM students
WHERE gpa > 3.5
ORDER BY gpa DESC
LIMIT 10;

-- JOIN (inner join)
SELECT s.name, c.title
FROM students s
JOIN enrollments e ON s.id = e.student_id
JOIN courses c     ON e.course_id = c.id;

-- Aggregate
SELECT subject, AVG(score) AS avg_score, COUNT(*) AS attempts
FROM quiz_results
GROUP BY subject
HAVING AVG(score) > 70;
\`\`\`

## Database Normalisation

Normalisation removes data redundancy and prevents anomalies.

| Normal Form | Rule |
|---|---|
| **1NF** | All columns atomic; no repeating groups |
| **2NF** | 1NF + no partial dependencies on composite key |
| **3NF** | 2NF + no transitive dependencies |
| **BCNF** | Every determinant is a candidate key |

## Indexing

An **index** speeds up query lookups at the cost of slower writes and more storage.

- **B-Tree index**: Default; good for range queries and equality.
- **Hash index**: Equality lookups only; very fast.
- **Composite index**: Index on multiple columns — order matters.
- **Covering index**: Index contains all columns needed by the query.

\`\`\`sql
CREATE INDEX idx_student_gpa ON students(gpa);
EXPLAIN ANALYZE SELECT * FROM students WHERE gpa > 3.5;
\`\`\`

## ACID Transactions

| Property | Meaning |
|---|---|
| **Atomicity** | All operations succeed or all are rolled back |
| **Consistency** | Transaction brings DB from one valid state to another |
| **Isolation** | Concurrent transactions don't interfere |
| **Durability** | Committed data survives crashes |

## SQL vs NoSQL

| | SQL (Relational) | NoSQL |
|---|---|---|
| Schema | Fixed, structured | Flexible, dynamic |
| Scaling | Vertical (bigger server) | Horizontal (more servers) |
| Consistency | Strong (ACID) | Often eventual |
| Best for | Complex queries, transactions | High volume, unstructured data |`,
    },
    {
        title: 'Cloud Computing and DevOps',
        description: 'Understand cloud infrastructure, deployment models, containerisation with Docker, and CI/CD pipelines.',
        level: 'advanced',
        video_url: 'https://www.youtube.com/embed/M988_fsOSWo',
        content: `## What is Cloud Computing?

Cloud computing is the on-demand delivery of IT resources — compute, storage, databases, networking, software — over the Internet, with pay-as-you-go pricing.

**Top Cloud Providers**: AWS (Amazon Web Services), Microsoft Azure, Google Cloud Platform (GCP).

## Cloud Service Models

| Model | You manage | Provider manages | Examples |
|---|---|---|---|
| **IaaS** (Infrastructure) | OS, runtime, apps | Hardware, network, virtualisation | AWS EC2, Azure VMs |
| **PaaS** (Platform) | Application, data | Everything else | Heroku, Google App Engine, Vercel |
| **SaaS** (Software) | Nothing (just use it) | Everything | Gmail, Salesforce, Dropbox |

## Cloud Deployment Models

- **Public Cloud**: Resources shared across organisations, managed by provider. Most cost-effective.
- **Private Cloud**: Dedicated infrastructure for one organisation. More control, more expensive.
- **Hybrid Cloud**: Mix of public and private. Sensitive data on private; scalable workloads on public.
- **Multi-Cloud**: Using multiple cloud providers to avoid vendor lock-in.

## Containerisation with Docker

\`\`\`dockerfile
# Example Dockerfile for a Node.js app
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 4000
CMD ["node", "server.js"]
\`\`\`

\`\`\`bash
docker build -t quiz-backend .
docker run -p 4000:4000 --env-file .env quiz-backend
docker-compose up -d   # run multi-container app
\`\`\`

**Benefits of containers**: Consistent environments, fast startup, lightweight (vs VMs), easy scaling.

## Kubernetes (K8s)

Kubernetes is a **container orchestration platform** that automates deployment, scaling, and management of containerised applications.

Key concepts: **Pod** (1+ containers), **Deployment** (desired state), **Service** (networking), **Ingress** (HTTP routing), **ConfigMap/Secret** (configuration).

## CI/CD Pipelines

**Continuous Integration (CI)**: Automatically build and test code on every commit.
**Continuous Delivery (CD)**: Automatically deploy tested code to staging/production.

Typical pipeline:
1. Developer pushes code to Git.
2. CI server (GitHub Actions, GitLab CI, Jenkins) triggers.
3. Run tests; build Docker image; push to container registry.
4. CD deploys new image to production cluster.

## Key DevOps Principles

- **Infrastructure as Code (IaC)**: Define infrastructure in code (Terraform, CloudFormation).
- **Immutable Infrastructure**: Never modify running servers — replace them.
- **Monitoring & Observability**: Logs (ELK stack), metrics (Prometheus/Grafana), tracing (Jaeger).
- **Site Reliability Engineering (SRE)**: Treat operations as a software engineering problem.`,
    },
    {
        title: 'Deep Learning and Neural Networks',
        description: 'Explore how deep neural networks learn — from perceptrons to CNNs, RNNs, and Transformers.',
        level: 'advanced',
        video_url: 'https://www.youtube.com/embed/aircAruvnKk',
        content: `## What is Deep Learning?

Deep Learning is a subset of Machine Learning that uses **artificial neural networks** with many layers (hence "deep") to learn hierarchical representations of data. It powers modern AI breakthroughs in vision, language, and audio.

## The Artificial Neuron

Inspired by biological neurons, an artificial neuron:
1. Receives inputs \`x₁, x₂, ..., xₙ\`.
2. Computes weighted sum: \`z = w₁x₁ + w₂x₂ + ... + b\`.
3. Applies an **activation function**: \`a = f(z)\`.

**Common Activation Functions:**
| Function | Formula | Use Case |
|---|---|---|
| **ReLU** | max(0, x) | Hidden layers (default choice) |
| **Sigmoid** | 1/(1+e⁻ˣ) | Binary classification output |
| **Softmax** | eˣᵢ / Σeˣⱼ | Multi-class output layer |
| **Tanh** | (eˣ-e⁻ˣ)/(eˣ+e⁻ˣ) | RNNs, normalised outputs |

## Training: Backpropagation & Gradient Descent

1. **Forward pass**: Input propagates through layers to produce output.
2. **Loss computation**: Compare output with true label (Cross-Entropy, MSE, etc.).
3. **Backward pass**: Gradients of loss w.r.t. weights computed via chain rule.
4. **Weight update**: \`w ← w - η * ∂L/∂w\` (η = learning rate).

**Optimisers**: SGD, Adam (most popular), RMSProp, AdaGrad.

## Convolutional Neural Networks (CNNs)

Designed for **image data**. Key layers:
- **Convolutional layer**: Applies learnable filters to detect local patterns (edges, textures, shapes).
- **Pooling layer**: Reduces spatial dimensions (Max Pooling, Average Pooling).
- **Fully Connected layer**: Classification head at the end.

Famous architectures: LeNet → AlexNet → VGG → ResNet → EfficientNet.

Applications: Image classification, object detection (YOLO), medical imaging, face recognition.

## Recurrent Neural Networks (RNNs)

Designed for **sequential data** (time series, text). A hidden state passes information from one timestep to the next.

**Vanishing gradient problem**: Gradients shrink exponentially over long sequences.

**Solutions**:
- **LSTM (Long Short-Term Memory)**: Gates control what to remember/forget.
- **GRU (Gated Recurrent Unit)**: Simplified version of LSTM.

## Transformers & Attention

The **Transformer** architecture (2017, "Attention Is All You Need") revolutionised NLP and is now used in vision too.

**Self-Attention mechanism**: Every token attends to every other token, capturing long-range dependencies without sequential processing.

Famous models:
- **BERT**: Bidirectional encoder — great for classification, QA.
- **GPT series**: Autoregressive decoder — great for text generation.
- **Vision Transformer (ViT)**: Transformers applied to image patches.
- **Gemini, LLaMA, Claude**: Modern large language models (LLMs).

## Regularisation Techniques

- **Dropout**: Randomly zero out neurons during training — prevents co-adaptation.
- **Batch Normalisation**: Normalise activations across a mini-batch — faster training.
- **Weight Decay (L2 Reg)**: Penalise large weights to prevent overfitting.
- **Data Augmentation**: Artificially expand dataset (flips, crops, noise).`,
    },
];

// ─── Quizzes (one per lesson) ─────────────────────────────────────────────────

const QUIZZES = [
    {
        lessonIndex: 0, // AI Introduction
        title: 'AI Fundamentals Quiz',
        description: 'Test your understanding of core AI concepts, history, and applications.',
        difficulty: 'easy',
        questions: [
            { q: 'Who proposed the Turing Test as a measure of machine intelligence?', opts: ['John McCarthy', 'Alan Turing', 'Marvin Minsky', 'Claude Shannon'], ans: 1, pts: 1 },
            { q: 'Which type of AI is capable of performing any intellectual task a human can?', opts: ['Narrow AI', 'Expert System', 'General AI', 'Reactive Machine'], ans: 2, pts: 1 },
            { q: 'In which year was the term "Artificial Intelligence" coined?', opts: ['1943', '1950', '1956', '1969'], ans: 2, pts: 1 },
            { q: 'Which branch of AI focuses on enabling computers to interpret images and video?', opts: ['Natural Language Processing', 'Expert Systems', 'Computer Vision', 'Robotics'], ans: 2, pts: 1 },
            { q: 'Which of the following is an example of Narrow AI?', opts: ['A robot with human-level consciousness', 'A spam email filter', 'A hypothetical superintelligence', 'An AI that can do everything humans can'], ans: 1, pts: 1 },
            { q: 'Which principle of responsible AI ensures systems are fair to all individuals?', opts: ['Transparency', 'Accountability', 'Fairness', 'Safety'], ans: 2, pts: 2 },
        ],
    },
    {
        lessonIndex: 1, // ML Fundamentals
        title: 'Machine Learning Concepts Quiz',
        description: 'Evaluate your knowledge of ML paradigms, pipelines, and evaluation metrics.',
        difficulty: 'medium',
        questions: [
            { q: 'Which learning paradigm uses labelled training data?', opts: ['Unsupervised Learning', 'Reinforcement Learning', 'Supervised Learning', 'Semi-supervised Learning'], ans: 2, pts: 1 },
            { q: 'What metric is most appropriate when class imbalance is present?', opts: ['Accuracy', 'F1 Score', 'Mean Squared Error', 'R² Score'], ans: 1, pts: 2 },
            { q: 'What happens when a model memorises training data but fails on unseen data?', opts: ['Underfitting', 'Overfitting', 'Regularisation', 'Normalisation'], ans: 1, pts: 1 },
            { q: 'Which algorithm is commonly used for clustering in unsupervised learning?', opts: ['Linear Regression', 'K-Means', 'Logistic Regression', 'SVM'], ans: 1, pts: 1 },
            { q: 'In reinforcement learning, what guides the agent to learn correct behaviour?', opts: ['Labels', 'Rewards and penalties', 'Clustering', 'Feature engineering'], ans: 1, pts: 2 },
            { q: 'Which step in the ML pipeline involves selecting or creating informative input variables?', opts: ['Data Collection', 'Model Selection', 'Feature Engineering', 'Deployment'], ans: 2, pts: 2 },
        ],
    },
    {
        lessonIndex: 2, // Python
        title: 'Python for Data Science Quiz',
        description: 'Test your Python skills — syntax, NumPy, Pandas, and Matplotlib.',
        difficulty: 'easy',
        questions: [
            { q: 'Which Python library is primarily used for numerical array computation?', opts: ['Pandas', 'Matplotlib', 'NumPy', 'Scikit-learn'], ans: 2, pts: 1 },
            { q: 'What does `df.describe()` return in Pandas?', opts: ['Column names', 'Summary statistics', 'Missing value counts', 'Data types'], ans: 1, pts: 1 },
            { q: 'Which NumPy function generates an array of standard-normal random numbers?', opts: ['np.zeros()', 'np.arange()', 'np.random.randn()', 'np.linspace()'], ans: 2, pts: 1 },
            { q: 'What is the output of `[x**2 for x in range(1,4)]`?', opts: ['[1, 4, 9]', '[2, 4, 6]', '[1, 2, 3]', '[1, 8, 27]'], ans: 0, pts: 1 },
            { q: 'Which Scikit-learn function splits data into training and test sets?', opts: ['StandardScaler', 'train_test_split', 'fit_transform', 'cross_val_score'], ans: 1, pts: 1 },
            { q: 'Which library is used to create line charts, histograms, and scatter plots in Python?', opts: ['NumPy', 'Pandas', 'Matplotlib', 'SciPy'], ans: 2, pts: 1 },
        ],
    },
    {
        lessonIndex: 3, // DSA
        title: 'Data Structures & Algorithms Quiz',
        description: 'Test your knowledge of arrays, trees, sorting algorithms, and Big-O notation.',
        difficulty: 'medium',
        questions: [
            { q: 'What is the average time complexity of searching in a hash table?', opts: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], ans: 2, pts: 1 },
            { q: 'Which sorting algorithm has O(n log n) worst-case time complexity?', opts: ['Bubble Sort', 'Quick Sort', 'Merge Sort', 'Selection Sort'], ans: 2, pts: 2 },
            { q: 'Which data structure follows the LIFO (Last In, First Out) principle?', opts: ['Queue', 'Stack', 'Linked List', 'Heap'], ans: 1, pts: 1 },
            { q: 'What traversal method is used to find the shortest path in an unweighted graph?', opts: ['DFS', 'BFS', 'Dijkstra', 'A*'], ans: 1, pts: 2 },
            { q: 'What technique does dynamic programming use to avoid recomputation?', opts: ['Recursion only', 'Greedy selection', 'Memoisation or tabulation', 'Divide and conquer'], ans: 2, pts: 2 },
            { q: 'In a Binary Search Tree, what is the average time complexity of a search?', opts: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'], ans: 2, pts: 1 },
        ],
    },
    {
        lessonIndex: 4, // Networks
        title: 'Computer Networks Quiz',
        description: 'Assess your understanding of the OSI model, IP addressing, TCP/UDP, DNS, and HTTP.',
        difficulty: 'easy',
        questions: [
            { q: 'At which OSI layer does the IP protocol operate?', opts: ['Layer 2 (Data Link)', 'Layer 3 (Network)', 'Layer 4 (Transport)', 'Layer 7 (Application)'], ans: 1, pts: 1 },
            { q: 'Which transport protocol guarantees delivery and ordering of packets?', opts: ['UDP', 'ICMP', 'TCP', 'ARP'], ans: 2, pts: 1 },
            { q: 'What does DNS primarily do?', opts: ['Encrypts web traffic', 'Assigns IP addresses dynamically', 'Translates domain names to IP addresses', 'Routes packets between networks'], ans: 2, pts: 1 },
            { q: 'What HTTP status code indicates a resource was not found?', opts: ['200', '301', '403', '404'], ans: 3, pts: 1 },
            { q: 'Which protocol secures HTTP traffic using TLS encryption?', opts: ['FTP', 'SMTP', 'HTTPS', 'SSH'], ans: 2, pts: 1 },
            { q: 'How many bits are in an IPv4 address?', opts: ['16', '32', '64', '128'], ans: 1, pts: 1 },
        ],
    },
    {
        lessonIndex: 5, // OS
        title: 'Operating Systems Quiz',
        description: 'Test your OS knowledge — processes, scheduling, memory management, and deadlock.',
        difficulty: 'medium',
        questions: [
            { q: 'Which CPU scheduling algorithm can cause starvation for low-priority processes?', opts: ['Round Robin', 'FCFS', 'Priority Scheduling', 'SJF'], ans: 2, pts: 2 },
            { q: 'What is the key difference between a process and a thread?', opts: ['Threads use more memory', 'Processes share memory; threads do not', 'Threads have their own address space', 'Processes are lighter weight than threads'], ans: 1, pts: 2 },
            { q: 'Which memory management technique divides memory into fixed-size blocks?', opts: ['Segmentation', 'Paging', 'Swapping', 'Compaction'], ans: 1, pts: 1 },
            { q: 'What condition is NOT required for a deadlock to occur?', opts: ['Mutual Exclusion', 'Hold and Wait', 'Preemption allowed', 'Circular Wait'], ans: 2, pts: 2 },
            { q: 'Which file system is the default for Linux systems?', opts: ['NTFS', 'FAT32', 'ext4', 'APFS'], ans: 2, pts: 1 },
            { q: 'What happens when a page needed by a process is not in RAM?', opts: ['The OS terminates the process', 'A page fault occurs and the page is loaded from disk', 'The process waits indefinitely', 'Swapping begins immediately'], ans: 1, pts: 2 },
        ],
    },
    {
        lessonIndex: 6, // Cybersecurity
        title: 'Cybersecurity Quiz',
        description: 'Test your cybersecurity knowledge — CIA triad, attacks, cryptography, and secure practices.',
        difficulty: 'medium',
        questions: [
            { q: 'Which pillar of the CIA triad ensures data has not been tampered with?', opts: ['Confidentiality', 'Availability', 'Integrity', 'Authentication'], ans: 2, pts: 1 },
            { q: 'What type of attack injects malicious SQL to manipulate a database?', opts: ['XSS', 'CSRF', 'SQL Injection', 'Buffer Overflow'], ans: 2, pts: 1 },
            { q: 'Which hashing algorithm is recommended for storing user passwords?', opts: ['MD5', 'SHA-1', 'bcrypt', 'SHA-256'], ans: 2, pts: 2 },
            { q: 'What does HTTPS add to standard HTTP?', opts: ['Faster response times', 'TLS encryption', 'Compression', 'Caching headers'], ans: 1, pts: 1 },
            { q: 'Which attack type tricks users into providing credentials via fake websites?', opts: ['Man-in-the-Middle', 'DDoS', 'Phishing', 'Port Scanning'], ans: 2, pts: 1 },
            { q: 'What cryptographic approach uses a public key to encrypt and a private key to decrypt?', opts: ['Symmetric encryption', 'Hashing', 'Asymmetric encryption', 'Steganography'], ans: 2, pts: 2 },
        ],
    },
    {
        lessonIndex: 7, // DBMS
        title: 'Database Management Quiz',
        description: 'Evaluate your SQL, normalisation, indexing, and transaction knowledge.',
        difficulty: 'medium',
        questions: [
            { q: 'Which SQL clause filters groups after aggregation?', opts: ['WHERE', 'GROUP BY', 'HAVING', 'ORDER BY'], ans: 2, pts: 2 },
            { q: 'Which normal form removes partial dependencies on a composite key?', opts: ['1NF', '2NF', '3NF', 'BCNF'], ans: 1, pts: 2 },
            { q: 'What does the "A" in ACID stand for?', opts: ['Authentication', 'Atomicity', 'Availability', 'Aggregation'], ans: 1, pts: 1 },
            { q: 'Which index type is best suited for equality-only lookups with O(1) performance?', opts: ['B-Tree', 'Full-text', 'Hash', 'Bitmap'], ans: 2, pts: 2 },
            { q: 'Which SQL keyword is used to combine rows from two tables based on a related column?', opts: ['UNION', 'JOIN', 'MERGE', 'INTERSECT'], ans: 1, pts: 1 },
            { q: 'Which NoSQL characteristic allows it to scale horizontally across many servers?', opts: ['Strong ACID guarantees', 'Fixed schema enforcement', 'Eventual consistency and horizontal scaling', 'Complex join support'], ans: 2, pts: 2 },
        ],
    },
    {
        lessonIndex: 8, // Cloud/DevOps
        title: 'Cloud Computing & DevOps Quiz',
        description: 'Test your knowledge of cloud models, Docker, Kubernetes, and CI/CD.',
        difficulty: 'hard',
        questions: [
            { q: 'Which cloud service model requires you to manage only the application and data?', opts: ['IaaS', 'PaaS', 'SaaS', 'FaaS'], ans: 1, pts: 2 },
            { q: 'What is the primary benefit of containerisation with Docker?', opts: ['Faster internet speeds', 'Consistent environments across development and production', 'Free cloud hosting', 'Automatic code generation'], ans: 1, pts: 2 },
            { q: 'In Kubernetes, what is the smallest deployable unit?', opts: ['Container', 'Pod', 'Node', 'Deployment'], ans: 1, pts: 2 },
            { q: 'What does "Infrastructure as Code" (IaC) mean?', opts: ['Writing code inside physical servers', 'Defining infrastructure in version-controlled configuration files', 'Using programming languages to replace DevOps engineers', 'Embedding cloud APIs into backend code'], ans: 1, pts: 2 },
            { q: 'In a CI/CD pipeline, what typically triggers the automated build and test process?', opts: ['A scheduled cron job', 'Manual approval from a manager', 'A developer pushing code to a Git branch', 'A container image being pulled'], ans: 2, pts: 2 },
            { q: 'Which deployment model uses a mix of on-premise private cloud and public cloud?', opts: ['Multi-cloud', 'Public cloud', 'Hybrid cloud', 'Community cloud'], ans: 2, pts: 2 },
        ],
    },
    {
        lessonIndex: 9, // Deep Learning
        title: 'Deep Learning Quiz',
        description: 'Test your understanding of neural networks, CNNs, RNNs, and Transformers.',
        difficulty: 'hard',
        questions: [
            { q: 'Which activation function is most commonly used in hidden layers of deep neural networks?', opts: ['Sigmoid', 'Tanh', 'ReLU', 'Softmax'], ans: 2, pts: 1 },
            { q: 'What problem in RNNs makes it difficult to learn long-term dependencies?', opts: ['Overfitting', 'Vanishing gradient', 'Data augmentation', 'Batch normalisation'], ans: 1, pts: 2 },
            { q: 'Which architecture was introduced in the paper "Attention Is All You Need"?', opts: ['CNN', 'LSTM', 'Transformer', 'ResNet'], ans: 2, pts: 2 },
            { q: 'What does the convolutional layer in a CNN detect in the early layers?', opts: ['Complex scene semantics', 'Low-level patterns like edges and textures', 'Final classification probabilities', 'Sequence dependencies'], ans: 1, pts: 2 },
            { q: 'Which regularisation technique randomly zeroes out neurons during training?', opts: ['Batch Normalisation', 'L2 Regularisation', 'Dropout', 'Data Augmentation'], ans: 2, pts: 2 },
            { q: 'Which step in neural network training computes weight gradients using the chain rule?', opts: ['Forward pass', 'Loss computation', 'Backpropagation', 'Weight initialisation'], ans: 2, pts: 2 },
        ],
    },
];

// ─── Main seed function ───────────────────────────────────────────────────────

async function seed() {
    const client = await pool.connect();

    try {
        console.log('\n🔄  Starting demo seed...\n');
        await client.query('BEGIN');

        // ── 1. Delete all data except the admin user ──────────────────────────
        console.log('🗑   Deleting old data (keeping admin user)...');
        await client.query('DELETE FROM question_performance');
        await client.query('DELETE FROM feedback');
        await client.query('DELETE FROM quiz_results');
        await client.query('DELETE FROM questions');
        await client.query('DELETE FROM quizzes');
        await client.query('DELETE FROM lessons');
        await client.query('DELETE FROM users WHERE role != $1', ['admin']);
        await client.query('DELETE FROM user_level_profiles');

        // ── 2. Get admin ID ───────────────────────────────────────────────────
        const adminRes = await client.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
        if (adminRes.rows.length === 0) {
            throw new Error('No admin user found. Run the original seed.js first, or create an admin account.');
        }
        const adminId = adminRes.rows[0].id;
        console.log(`✅  Admin user found (id=${adminId})\n`);

        // ── 3. Create student users ───────────────────────────────────────────
        console.log('👤  Creating student accounts...');
        const studentIds = [];
        for (const s of STUDENTS) {
            const hash = await bcrypt.hash(s.password, 12);
            const res = await client.query(
                `INSERT INTO users (username, email, password, role, created_at, updated_at)
                 VALUES ($1, $2, $3, 'student', NOW(), NOW())
                 ON CONFLICT (username) DO UPDATE SET email = EXCLUDED.email
                 RETURNING id`,
                [s.username, s.email, hash]
            );
            studentIds.push(res.rows[0].id);
            console.log(`   ✔ ${s.username}  (${s.email})  pw: ${s.password}`);
        }

        // ── 4. Create lessons ─────────────────────────────────────────────────
        console.log('\n📚  Creating lessons...');
        const lessonIds = [];
        for (const lesson of LESSONS) {
            const res = await client.query(
                `INSERT INTO lessons (title, description, content, video_url, level, created_by, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                 RETURNING id`,
                [lesson.title, lesson.description, lesson.content, lesson.video_url, lesson.level, adminId]
            );
            lessonIds.push(res.rows[0].id);
            console.log(`   ✔ [${lesson.level.padEnd(12)}] ${lesson.title}`);
        }

        // ── 5. Create quizzes + questions ─────────────────────────────────────
        console.log('\n📝  Creating quizzes and questions...');
        for (const quiz of QUIZZES) {
            const lessonId = lessonIds[quiz.lessonIndex];

            const qRes = await client.query(
                `INSERT INTO quizzes (lesson_id, title, description, created_by, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, NOW(), NOW())
                 RETURNING id`,
                [lessonId, quiz.title, quiz.description, adminId]
            );
            const quizId = qRes.rows[0].id;

            for (const [i, question] of quiz.questions.entries()) {
                await client.query(
                    `INSERT INTO questions (quiz_id, question_text, options, correct_answer, points)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [quizId, question.q, JSON.stringify(question.opts), question.ans, question.pts]
                );
            }

            console.log(`   ✔ [${quiz.difficulty.padEnd(6)}] ${quiz.title}  (${quiz.questions.length} questions)`);;
        }

        await client.query('COMMIT');

        // ── 6. Print credentials summary ──────────────────────────────────────
        console.log('\n' + '─'.repeat(60));
        console.log('  ✅  DEMO SEED COMPLETE');
        console.log('─'.repeat(60));
        console.log('\n  STUDENT CREDENTIALS\n');
        console.log('  Username           Email                Password');
        console.log('  ' + '-'.repeat(55));
        for (const s of STUDENTS) {
            console.log(`  ${s.username.padEnd(18)} ${s.email.padEnd(22)} ${s.password}`);
        }
        console.log('\n  Admin credentials are unchanged.');
        console.log('─'.repeat(60) + '\n');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('\n❌  Seed failed — rolled back.', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
