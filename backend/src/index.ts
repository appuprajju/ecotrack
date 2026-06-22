import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import * as dotenv from 'dotenv';
import { apiRouter } from './presentation/routes';
import { apiLimiter, globalErrorHandler } from './presentation/middlewares';

// Load environment configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;


// Security and utility Middlewares
app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json());

// Bind Global Rate Limiting
app.use('/api', apiLimiter);

// Bind System Routing Modules
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Bind Global Error Interceptor
app.use(globalErrorHandler);

// Start Application Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`   EcoTrack AI Platform Backend Service        `);
    console.log(`   Listening on port: ${PORT}                  `);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`===============================================`);
  });
}

export default app; // For integration test suites
