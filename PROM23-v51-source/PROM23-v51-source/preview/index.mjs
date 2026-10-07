import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../server/app.mjs';
import { createPreview } from './http.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PROM23_PREVIEW_PORT ?? 8087);
const apiPort = Number(process.env.PROM23_API_PORT ?? 8090);
const bind = process.env.PROM23_PREVIEW_BIND ?? '127.0.0.1';
if (!['127.0.0.1', '0.0.0.0'].includes(bind)) throw new Error('Invalid preview bind');
for (const p of [port, apiPort]) if (!Number.isInteger(p) || p < 1024 || p > 65535) throw new Error('Invalid port');
const hosts = JSON.parse(process.env.PROM23_PREVIEW_HOSTS ?? '["127.0.0.1:8087","localhost:8087","127.0.0.1:8088","localhost:8088"]');
const app = createApp({ databasePath: process.env.PROM23_DATABASE_PATH ?? resolve(here, '../server/data/runtime.sqlite'), allowedOrigins: hosts.map(host => `http://${host}`) });
const server = createPreview({ root: resolve(here, '../mobile/dist'), apiPort, hosts });
app.server.on('error', error => { console.error(error.code); process.exit(1); });
server.on('error', error => { console.error(error.code); process.exit(1); });
app.server.listen(apiPort, '127.0.0.1', () => {
  server.listen(port, bind, () => console.log(`PROM23 test preview listening on ${bind}:${port}`));
});
let stopping = false;
async function stop() {
  if (stopping) return; stopping = true;
  await new Promise(resolveClose => { server.close(resolveClose); server.closeIdleConnections(); });
  await app.close();
}
process.on('SIGINT', stop); process.on('SIGTERM', stop);
