import { createApp } from './app.js';
import { env } from './config/env.js';
import { startCollectScheduler } from './services/collect-scheduler.js';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Backend server running on http://localhost:${env.PORT}`);
});

void startCollectScheduler();
