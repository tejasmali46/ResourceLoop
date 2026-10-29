import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';

async function bootstrap() {
  try {
    await connectDB();
    const app = createApp();

    const server = app.listen(ENV.PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 ResourceLoop API Server running on port ${ENV.PORT}`);
      console.log(`📡 Environment: ${ENV.NODE_ENV}`);
      console.log(`🏛️ Institution: ${ENV.INSTITUTION_NAME}`);
      console.log(`🔗 Health check: http://localhost:${ENV.PORT}/health`);
      console.log(`=======================================================`);
    });

    const shutdown = async () => {
      console.log('Gracefully terminating server...');
      server.close(() => {
        console.log('Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
