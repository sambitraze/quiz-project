#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Setting up Quiz App Database...\n');

try {
    // Change to backend directory
    process.chdir(path.join(__dirname));

    console.log('📊 Running database migration...');
    execSync('node scripts/migrate.js', { stdio: 'inherit' });

    console.log('🌱 Seeding database with sample data...');
    execSync('node scripts/seed.js', { stdio: 'inherit' });

    console.log('\n✅ Database setup completed successfully!');
    console.log('\n👤 Sample Users Created:');
    console.log('   Admin: username="admin", password="admin123"');
    console.log('   Students: username="john_student", password="student123"');
    console.log('            username="jane_student", password="student123"');
    console.log('            username="bob_student", password="student123"');
    console.log('\n🎯 Next Steps:');
    console.log('   1. Start the backend server: npm start');
    console.log('   2. Start the frontend server: cd ../Frontend && npm run dev');
    console.log('   3. Visit http://localhost:3000 to access the app');

} catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
}