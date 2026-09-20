import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import test from 'node:test'

import { httpEndpoint, inspectServer } from '../lib/server-client.js'

test('httpEndpoint accepts WebSocket endpoints and removes carrier suffixes', () => {
  assert.equal(httpEndpoint('wss://example.test/a2s-api/ws'), 'https://example.test/a2s-api')
  assert.equal(httpEndpoint('http://example.test/a2s-api/events'), 'http://example.test/a2s-api')
})

test('inspectServer uses public health and avatar endpoints without admin credentials', async () => {
  const requests = []
  const server = createServer((request, response) => {
    let body = ''
    request.on('data', (chunk) => { body += chunk })
    request.on('end', () => {
      requests.push({ url: request.url, method: request.method, key: request.headers['x-admin-key'], body })
      response.setHeader('content-type', 'application/json')
      if (request.url === '/a2s-api/health') response.end(JSON.stringify({ ok: true, service: 'a2s-server-api' }))
      else if (request.url === '/a2s-api/avatar') response.end(JSON.stringify({ ok: true, avatar: null }))
      else { response.statusCode = 404; response.end(JSON.stringify({ error: { message: 'missing' } })) }
    })
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const endpoint = `http://127.0.0.1:${server.address().port}/a2s-api`
  const config = {
    device: { id: 'device-1', name: 'test device', key: `a2sk_${'x'.repeat(43)}` },
    server: { endpoints: [endpoint] },
  }
  try {
    const state = await inspectServer(config)
    assert.equal(state.reachable, true)
    assert.deepEqual(requests.map((item) => item.url), ['/a2s-api/health', '/a2s-api/avatar'])
    assert.equal(requests.every((item) => item.key === undefined), true)
    assert.deepEqual(state.instances, [])
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})
