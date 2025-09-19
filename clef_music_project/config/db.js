const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Create a new pool instance. The pool will manage connections to the database.
// It reads connection details from environment variables by default.
const isProduction = process.env.NODE_ENV === 'production';
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
    ssl: isProduction ? { rejectUnauthorized: true } : undefined,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

// Export a query function that will be used throughout the application
// to interact with the database.
module.exports = {
    query: (text, params) => pool.query(text, params),
    end: () => pool.end(),
};