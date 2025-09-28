#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Quiz App Backend...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file from template...');
    const envExamplePath = path.join(__dirname, '.env.example');
    if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ .env file created. Please update it with your database credentials.\n');
    } else {
        console.log('⚠️  .env.example not found. Please create .env manually.\n');
    }
} else {
    console.log('✅ .env file already exists.\n');
}

try {
    // Install dependencies
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully.\n');

    console.log('🎉 Setup completed!\n');
    console.log('Next steps:');
    console.log('1. Update your .env file with PostgreSQL credentials');
    console.log('2. Create a PostgreSQL database named "quiz_app"');
    console.log('3. Run: npm run migrate');
    console.log('4. Run: npm run seed (optional - for sample data)');
    console.log('5. Run: npm run dev');
    console.log('\nHappy coding! 🚀');

} catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
}