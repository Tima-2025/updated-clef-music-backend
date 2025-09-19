const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function setupCompleteDatabase() {
    try {
        console.log('🚀 Setting up complete database schema...');
        console.log('=====================================\n');
        
        // Read the complete schema file
        const schemaPath = path.join(__dirname, '..', 'config', 'complete-schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        
        // Split the SQL into individual statements
        const statements = schemaSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📝 Found ${statements.length} SQL statements to execute`);
        console.log('⚠️  This will DROP and RECREATE all tables!\n');
        
        let successCount = 0;
        let skipCount = 0;
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';';
            
            // Skip empty statements and comments
            if (statement.trim() === ';' || statement.trim().startsWith('--')) {
                continue;
            }
            
            try {
                console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
                
                // Execute the statement
                await db.query(statement);
                console.log(`✅ Statement ${i + 1} executed successfully`);
                successCount++;
                
            } catch (error) {
                // Handle specific errors gracefully
                if (error.message.includes('already exists')) {
                    console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
                    skipCount++;
                } else if (error.message.includes('does not exist')) {
                    console.log(`⚠️  Statement ${i + 1} skipped (referenced object does not exist)`);
                    skipCount++;
                } else {
                    console.error(`❌ Error executing statement ${i + 1}:`, error.message);
                    console.error(`Statement: ${statement.substring(0, 100)}...`);
                    throw error;
                }
            }
        }
        
        console.log('\n🎉 Database setup completed successfully!');
        console.log('=====================================');
        console.log(`✅ Successful statements: ${successCount}`);
        console.log(`⚠️  Skipped statements: ${skipCount}`);
        console.log('\n📊 Created tables:');
        console.log('   • users (with roles: admin, user)');
        console.log('   • categories');
        console.log('   • products');
        console.log('   • addresses');
        console.log('   • cart_items');
        console.log('   • orders');
        console.log('   • order_items');
        console.log('   • visitors (for visitor tracking)');
        console.log('   • notifications (for notifications)');
        console.log('   • product_inquiries');
        console.log('\n🔗 Created:');
        console.log('   • Indexes for better performance');
        console.log('   • Triggers for updated_at timestamps');
        console.log('   • Functions for order number generation');
        console.log('   • Views for common queries');
        console.log('   • Sample data for testing');
        console.log('\n🎯 Your e-commerce database is ready!');
        
    } catch (error) {
        console.error('💥 Database setup failed:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Make sure PostgreSQL is running');
        console.error('2. Check your database connection in .env');
        console.error('3. Ensure your database user has CREATE privileges');
        process.exit(1);
    } finally {
        // Close the database connection
        await db.end();
    }
}

// Run the setup
setupCompleteDatabase();
