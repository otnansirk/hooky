import { spawn } from 'child_process';

const PORT = 3088;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Starting Hooky test server on port', PORT);
  const server = spawn('pnpm', ['next', 'start', '-p', String(PORT)], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'inherit',
  });

  // Give server time to boot
  await sleep(3000);

  try {
    console.log('\n--- Test 1: Generate New Endpoint (POST /api/endpoints) ---');
    const createRes = await fetch(`${BASE_URL}/api/endpoints`, { method: 'POST' });
    if (!createRes.ok) throw new Error(`Create endpoint failed: ${createRes.status}`);
    const endpointData = await createRes.json();
    console.log('✅ Endpoint created:', endpointData.id);
    const endpointId = endpointData.id;

    console.log('\n--- Test 2: Send POST Webhook with JSON payload (/e/[id]) ---');
    const postRes = await fetch(`${BASE_URL}/e/${endpointId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'HookyTestValue',
      },
      body: JSON.stringify({ event: 'order.completed', amount: 49.99, currency: 'USD' }),
    });
    if (!postRes.ok) throw new Error(`POST webhook failed: ${postRes.status}`);
    const postResult = await postRes.json();
    console.log('✅ POST Webhook response:', postResult);

    console.log('\n--- Test 3: Send GET Webhook with Query Params (/e/[id]?search=test&page=2) ---');
    const getRes = await fetch(`${BASE_URL}/e/${endpointId}?search=test&page=2`, {
      method: 'GET',
    });
    if (!getRes.ok) throw new Error(`GET webhook failed: ${getRes.status}`);
    const getResult = await getRes.json();
    console.log('✅ GET Webhook response:', getResult);

    console.log('\n--- Test 4: Retrieve Captured Requests (/api/endpoints/[id]/requests) ---');
    const listRes = await fetch(`${BASE_URL}/api/endpoints/${endpointId}/requests`);
    if (!listRes.ok) throw new Error(`Fetch requests failed: ${listRes.status}`);
    const listData = await listRes.json();
    console.log('✅ Captured requests count:', listData.requests.length);
    if (listData.requests.length !== 2) {
      throw new Error(`Expected 2 requests, got ${listData.requests.length}`);
    }

    const first = listData.requests[0]; // newest
    console.log('✅ Latest request method:', first.method);
    console.log('✅ Query params correctly parsed:', JSON.stringify(first.queryParams));

    console.log('\n--- Test 5: Delete Captured Requests (DELETE /api/endpoints/[id]/requests) ---');
    const deleteRes = await fetch(`${BASE_URL}/api/endpoints/${endpointId}/requests`, {
      method: 'DELETE',
    });
    if (!deleteRes.ok) throw new Error(`Delete requests failed: ${deleteRes.status}`);
    const deleteResult = await deleteRes.json();
    console.log('✅ Delete response:', deleteResult);

    const afterDeleteRes = await fetch(`${BASE_URL}/api/endpoints/${endpointId}/requests`);
    const afterDeleteData = await afterDeleteRes.json();
    if (afterDeleteData.requests.length !== 0) {
      throw new Error(`Expected 0 requests after clear, got ${afterDeleteData.requests.length}`);
    }
    console.log('✅ Verified requests cleared');

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🚀');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exitCode = 1;
  } finally {
    server.kill();
    // Allow process to terminate
    await sleep(500);
  }
}

main();
