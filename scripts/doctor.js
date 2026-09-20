#!/usr/bin/env node
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defaultConfigFile, ensureConfig, fingerprint } from '../lib/config-service.js'
import { PluginService } from '../lib/plugin-service.js'
import { inspectServer } from '../lib/server-client.js'
import { probeAgents } from '../lib/system-probe.js'

const directory = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = resolve(directory, '..', '..')
const configFile = defaultConfigFile()
const config = await ensureConfig(configFile)
const plugins = new PluginService({ configFile, workspaceRoot })
const [agents, catalog, server] = await Promise.all([
  probeAgents({ refresh: true }),
  plugins.catalog(config),
  inspectServer(config),
])

const report = {
  ok: true,
  configFile,
  deviceId: config.device.id,
  keyFingerprint: fingerprint(config.device.key),
  endpoints: config.server.endpoints,
  agents,
  plugins: catalog.map((item) => ({ id: item.id, installed: item.installed, developmentAvailable: item.developmentAvailable, version: item.installedVersion || item.developmentVersion })),
  server,
}
report.ok = ['claude', 'codex'].every((type) => report.agents[type].installed)
console.log(JSON.stringify(report, null, 2))
if (!report.ok) process.exitCode = 1
