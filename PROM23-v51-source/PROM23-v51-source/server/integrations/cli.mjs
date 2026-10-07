import { createBitrixReader, loadBridgeConfig, BridgeError } from './bitrix-client.mjs';
import { inspectIntegrationSource } from './readiness.mjs';

try {
  const command = process.argv[2] ?? 'readiness';
  if (command === 'readiness' && !process.argv.includes('--probe')) {
    console.log(JSON.stringify(inspectIntegrationSource(), null, 2));
  } else {
    const reader = createBitrixReader(loadBridgeConfig());
    let result;
    if (command === 'readiness') result = await reader.readiness();
    else if (command === 'export-order' || command === 'document-manifest') {
      const actor = { userId: Number(process.argv[3]), organizationId: Number(process.argv[4]) };
      const orderId = Number(process.argv[5]);
      result = command === 'export-order' ? await reader.exportOrder(actor, orderId) : await reader.documentManifest(actor, orderId);
    } else throw new BridgeError('COMMAND_NOT_SUPPORTED', 400);
    console.log(JSON.stringify(result, null, 2));
  }
} catch (error) {
  console.error(JSON.stringify({ error: { code: error instanceof BridgeError ? error.code : 'INTEGRATION_DIAGNOSTIC_FAILED' } }));
  process.exitCode = 1;
}
