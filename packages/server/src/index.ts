import dotenv from 'dotenv';
import path from 'path'; // Import path module

// Remove this block - dotenv is loaded by config.ts now
// // Specify the path relative to the current working directory (project root)
// dotenv.config({ path: path.resolve(process.cwd(), 'packages/server/.env') });
// Note: Path might differ slightly depending on build output structure, adjust if needed

import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { presentationRouter, errorHandler } from './routes/presentations.routes';
import { authRouter } from './routes/auth.routes'; // Import the auth router
import { setupWebSocket } from './utils/socket';
import { config } from './config';
import { connectToDatabase } from './db/astra-client';

async function startServer() {
  try {
    await connectToDatabase();
    console.log('Successfully connected to Astra DB');

    const app = express();
    const server = http.createServer(app);

    // Setup CORS
    app.use(
      cors({
        origin: config.clientUrl,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      })
    );

    // Middlewares
    app.use(express.json()); // Parse JSON bodies

    // Setup WebSocket Server
    console.log(`Configuring Socket.IO CORS for origin: ${config.clientUrl}`);
    const io = new SocketIOServer(server, {
      pingTimeout: 60000, // Increase ping timeout just in case
      cors: {
        origin: config.clientUrl,
        methods: ['GET', 'POST'],
      },
    });
    setupWebSocket(io);
    console.log('WebSocket server initialized');

    // API Routes
    app.get('/', (req: express.Request, res: express.Response) => {
      res.send('PresentX API is running!');
    });
    app.use('/api/presentations', presentationRouter);
    app.use('/api/auth', authRouter); // Mount the auth router

    // --- Global Error Handler (should be last middleware) ---
    app.use(errorHandler);

    // Start Server
    server.listen(config.port, () => {
      console.log(`Server listening on port ${config.port}`);
      console.log(`Allowing requests from: ${config.clientUrl}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1); // Exit if DB connection fails
  }
}

startServer(); 