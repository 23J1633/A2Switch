import assert from 'node:assert/strict'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defaultConfigFile, ensureConfig } from '../lib/config-service.js'
import { PluginService } from '../lib/plugin-service.js'
import { ProcessManager } from '../lib/process-manager.js'
import { httpEndpoint } from '../lib/server-client.js'

const configFile = defaultConfigFile()
const config = await ensureConfig(configFile)
const adminKey = String(process.env.A2S_ADMIN_KEY || '').trim()
if (!adminKey) throw new Error('真实 DSH 控制验收需要通过 A2S_ADMIN_KEY 单独提供服务器管理员密钥')
const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const pluginService = new PluginService({
  configFile,
  workspaceRoot,
})
const manager = new ProcessManager({ configFile, pluginService, workspaceRoot })

try {
  const before = await manager.runtimeStatus('dsh')
  assert.equal(before.running, true, 'dsh2server runtime must be running')
  assert.equal(before.suspended, false, 'dsh2server must begin active')
  assert.equal(before.connected, true, 'dsh2server must begin connected')
  const hostPid = before.pid

  await manager.stopAgent('dsh')
  await waitFor(async () => {
    const runtime = await manager.runtimeStatus('dsh')
    return runtime.running && runtime.suspended && !runtime.connected
  }, 10000, 'DSH bridge suspension')
  await waitFor(async () => {
    const instances = await inspectInstances(config, adminKey)
    return instances.find((item) => item.instanceId === config.agents.dsh.instanceId)?.online === false
  }, 10000, 'server-side DSH offline state')
  console.log(JSON.stringify({ phase: 'stop', ok: true, hostPidPreserved: true }))

  await manager.startAgent('dsh', config)
  await waitFor(async () => {
    const runtime = await manager.runtimeStatus('dsh')
    return runtime.running && !runtime.suspended && runtime.connected
  }, 20000, 'DSH bridge resume')
  await waitFor(async () => {
    const instances = await inspectInstances(config, adminKey)
    return instances.find((item) => item.instanceId === config.agents.dsh.instanceId)?.online === true
  }, 10000, 'server-side DSH online state')
  console.log(JSON.stringify({ phase: 'start', ok: true, hostPidPreserved: (await manager.runtimeStatus('dsh')).pid === hostPid }))

  await manager.restartAgent('dsh', config)
  await waitFor(async () => {
    const runtime = await manager.runtimeStatus('dsh')
    return runtime.running && !runtime.suspended && runtime.connected && runtime.control?.action === 'restart' && runtime.control?.ok === true
  }, 20000, 'DSH bridge restart')
  assert.equal((await manager.runtimeStatus('dsh')).pid, hostPid, 'restarting the bridge must not terminate the Harness host')
  console.log(JSON.stringify({ phase: 'restart', ok: true, hostPidPreserved: true }))
} finally {
  const runtime = await manager.runtimeStatus('dsh')
  if (runtime.running && runtime.suspended) await manager.startAgent('dsh', config).catch(() => undefined)
}

async function inspectInstances(config, key) {
  const endpoint = config.server.endpoints[0]
  if (!endpoint) throw new Error('未配置服务器端点')
  const response = await fetch(`${httpEndpoint(endpoint)}/instances`, {
    signal: AbortSignal.timeout(8000),
    headers: { 'x-admin-key': key },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.error?.message || `HTTP ${response.status}`)
  return body?.items || []
}

async function waitFor(predicate, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await predicate()) return
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  throw new Error(`等待${label}超时`)
}
