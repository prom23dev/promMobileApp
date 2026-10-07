import { createApp } from './app.mjs';

const port = Number(process.env.PROM23_PORT ?? 8090);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PROM23_PORT must be an integer from 1 to 65535.');
const allowedOrigins = process.env.PROM23_ALLOWED_ORIGINS === undefined
  ? undefined : JSON.parse(process.env.PROM23_ALLOWED_ORIGINS);
// Live-CMS overlay files are deployed outside the web root (see
// integrations/runtime/cms-sync.php); on the server these live at a
// different absolute path than the repo-local default in app.mjs.
const liveSnapshotPath = process.env.PROM23_LIVE_CMS_SNAPSHOT_PATH;
const liveSlugs = process.env.PROM23_LIVE_CMS_SLUGS === undefined
  ? undefined : JSON.parse(process.env.PROM23_LIVE_CMS_SLUGS);
const app = createApp({
  allowedOrigins,
  ...(liveSnapshotPath ? { liveSnapshotPath } : {}),
  ...(liveSlugs ? { liveSlugs } : {}),
});
app.server.listen(port, '127.0.0.1', () => {
  console.log(`PROM23 local sandbox API: http://127.0.0.1:${port}`);
  console.log('Test data only. No Bitrix, payments, delivery or messages are connected.');
});

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await app.close();
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
