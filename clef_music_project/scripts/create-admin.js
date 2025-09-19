const bcrypt = require('bcryptjs');
const db = require('../config/db');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function createAdminUser() {
    try {
        console.log('🔧 Creating Admin User');
        console.log('====================\n');

        // Get admin details
        const name = await askQuestion('Enter admin name: ');
        const email = await askQuestion('Enter admin email: ');
        const password = await askQuestion('Enter admin password (min 6 characters): ');

        if (!name || !email || !password) {
            console.log('❌ All fields are required!');
            rl.close();
            return;
        }

        if (password.length < 6) {
            console.log('❌ Password must be at least 6 characters long!');
            rl.close();
            return;
        }

        // Check if user already exists
        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            console.log('❌ User with this email already exists!');
            rl.close();
            return;
        }

        // Hash password
        console.log('🔐 Hashing password...');
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert admin user
        console.log('💾 Creating admin user...');
        const newUserQuery = 'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role';
        const { rows } = await db.query(newUserQuery, [name, email, password_hash, 'admin']);
        const newUser = rows[0];

        console.log('\n✅ Admin user created successfully!');
        console.log('=====================================');
        console.log(`ID: ${newUser.id}`);
        console.log(`Name: ${newUser.name}`);
        console.log(`Email: ${newUser.email}`);
        console.log(`Role: ${newUser.role}`);
        console.log('\n🎉 You can now login with these credentials!');

    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
    } finally {
        rl.close();
        await db.end();
    }
}

// Run the script
createAdminUser();

