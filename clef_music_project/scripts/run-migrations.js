const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function runMigrations() {
    try {
        console.log('🔄 Starting database migrations...');
        
        // Read the migration file
        const migrationPath = path.join(__dirname, '..', 'config', 'migrations.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Split the SQL into individual statements
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📝 Found ${statements.length} SQL statements to execute`);
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';';
            try {
                console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
                await db.query(statement);
                console.log(`✅ Statement ${i + 1} executed successfully`);
            } catch (error) {
                // Some statements might fail if tables already exist, which is okay
                if (error.message.includes('already exists')) {
                    console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
                } else {
                    console.error(`❌ Error executing statement ${i + 1}:`, error.message);
                    throw error;
                }
            }
        }
        
        console.log('🎉 All migrations completed successfully!');
        console.log('📊 Created tables: visitors, notifications');
        console.log('🔗 Created indexes for better performance');
        
    } catch (error) {
        console.error('💥 Migration failed:', error.message);
        process.exit(1);
    } finally {
        // Close the database connection
        await db.end();
    }
}

// Run migrations
runMigrations();
