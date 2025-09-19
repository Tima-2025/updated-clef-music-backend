const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { cleanEnv, port, str, num, url } = require('envalid');
const { errors: celebrateErrors } = require('celebrate');
const db = require('./config/db');


// --- Load environment variables ---
dotenv.config();

// --- Validate environment variables ---
const env = cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
    PORT: port({ default: 3000 }),
    JWT_SECRET: str(),
    JWT_EXPIRES_IN: str({ default: '7d' }),
    DB_USER: str(),
    DB_HOST: str(),
    DB_NAME: str(),
    DB_PASSWORD: str(),
    DB_PORT: num({ default: 5432 }),
    CORS_ORIGIN: str({ default: '*' }),
});

// --- Route imports ---
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const visitorRoutes = require('./routes/visitors');
const adminRoutes = require('./routes/admin');
const serviceRequestRoutes = require('./routes/serviceRequestRoutes');

// --- Initialize Express app ---
const app = express();

// --- Middlewares ---
app.use(helmet());
app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.static('public')); // Serve static files from public directory
app.use(morgan(env.isProduction ? 'combined' : 'dev'));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('trust proxy', 1);

// CORS configuration
app.use(cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map(s => s.trim()),
    methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    credentials: true,
}));

// Basic rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// --- Health check endpoint ---
app.get('/', (req, res) => {
    res.send('E-commerce API is running...');
});

// --- Mount routes ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/api/service-requests', serviceRequestRoutes);


// Celebrate validation errors
app.use(celebrateErrors());

// 404 handler
app.use((req, res, next) => {
    if (!res.headersSent) {
        return res.status(404).json({ error: 'Route not found' });
    }
    next();
});

// --- Global error handler ---
app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const message = env.isProduction && status === 500 ? 'Internal Server Error' : (err.message || 'Something went wrong!');
    if (status >= 500) {
        console.error(err);
    }
    res.status(status).json({ error: message });
});


// --- Start the server ---
const PORT = env.PORT;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
const shutdown = (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
        try {
            await db.end();
        } catch (e) {
            console.error('Error closing DB pool', e);
        } finally {
            process.exit(0);
        }
    });
    // Force exit if not closed in time
    setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));