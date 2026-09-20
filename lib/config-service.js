import { createHash, randomBytes } from 'node:crypto'
import { mkdir, open, readFile, writeFile } from 'node:fs/promises'
import { homedir, hostname, userInfo } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { replaceFilePortable } from './fs-portable.js'

export const CONFIG_VERSION = 1

export function defaultConfigDir(env = process.env, platform = process.platform) {
  if (env.A2S_CONFIG_DIR?.trim()) return resolve(env.A2S_CONFIG_DIR.trim())
  if (platform === 'win32') return join(env.APPDATA?.trim() || join(homedir(), 'AppData', 'Roaming'), 'A2S')
  if (platform === 'darwin') return join(homedir(), 'Library', 'Application Support', 'A2S')
  return join(env.XDG_CONFIG_HOME?.trim() || join(homedir(), '.config'), 'a2s')
}

export function defaultConfigFile(env = process.env, platform = process.platform) {
  return env.A2S_CONFIG_PATH?.trim() || join(defaultConfigDir(env, platform), 'config.json')
}

export function generateDeviceKey() {
  return `a2sk_${randomBytes(32).toString('base64url')}`
}

export function deriveDeviceId(env = process.env) {
  const seed = `${safeHost()}|${safeUser()}|${env.COMPUTERNAME ?? ''}`
  return `a2s-${createHash('sha256').update(seed).digest('hex').slice(0, 12)}`
}

export function createDefaultConfig(configDir = defaultConfigDir()) {
  const deviceId = deriveDeviceId()
  return {
    version: CONFIG_VERSION,
    device: {
      id: deviceId,
      name: safeHost(),
      key: generateDeviceKey(),
      createdAt: new Date().toISOString(),
    },
    server: {
      endpoints: [],
      transport: 'auto',
    },
    agents: {
      dsh: { enabled: true, autoStart: false, locale: 'system', instanceId: `${deviceId}:dsh` },
      claude: { enabled: true, autoStart: true, locale: 'system', instanceId: `${deviceId}:claude`, defaultCwd: process.cwd(), executable: platformExecutable('claude') },
      codex: { enabled: true, autoStart: true, locale: 'system', instanceId: `${deviceId}:codex`, defaultCwd: process.cwd(), executable: process.platform === 'win32' ? 'codex.exe' : 'codex' },
    },
    plugins: {
      catalogUrl: '',
      installDir: join(configDir, 'plugins'),
    },
    app: {
      launchAtLogin: false,
      startMinimized: false,
      closeToTray: false,
    },
  }
}

export function normalizeConfig(document, configDir = defaultConfigDir()) {
  if (!document || typeof document !== 'object' || Array.isArray(document)) throw new TypeError('配置必须是 JSON 对象')
  const defaults = createDefaultConfig(configDir)
  const device = { ...defaults.device, ...(document.device || {}) }
  const { adminKey: _legacyAdminKey, ...serverDocument } = document.server || {}
  const server = { ...defaults.server, ...serverDocument }
  if (!String(device.id || '').trim()) throw new TypeError('device.id 不能为空')
  if (String(device.key || '').length < 16) throw new TypeError('设备 key 至少需要 16 个字符')
  server.endpoints = normalizeEndpoints(server.endpoints ?? server.endpoint ?? [])
  if (!['auto', 'ws', 'http'].includes(server.transport)) throw new TypeError('传输模式必须是 auto、ws 或 http')
  const agents = {}
  for (const type of ['dsh', 'claude', 'codex']) {
    agents[type] = { ...defaults.agents[type], ...(document.agents?.[type] || {}) }
    agents[type].enabled = agents[type].enabled !== false
    agents[type].autoStart = agents[type].autoStart === true
    agents[type].locale = ['system', 'zh-CN', 'en-US'].includes(agents[type].locale) ? agents[type].locale : 'system'
    agents[type].instanceId = String(agents[type].instanceId || `${device.id}:${type}`)
    if (process.platform === 'win32' && type === 'codex' && agents[type].executable === 'codex.cmd') agents[type].executable = 'codex.exe'
  }
  return {
    ...defaults,
    ...document,
    version: CONFIG_VERSION,
    device: { ...device, id: String(device.id).trim(), name: String(device.name || safeHost()), key: String(device.key).trim() },
    server,
    agents,
    plugins: { ...defaults.plugins, ...(document.plugins || {}) },
    app: { ...defaults.app, ...(document.app || {}) },
  }
}

export async function ensureConfig(file = defaultConfigFile()) {
  try {
    const source = JSON.parse(await readFile(file, 'utf8'))
    const normalized = normalizeConfig(source, dirname(file))
    // Older A2Switch builds incorrectly stored the server owner credential in
    // the workstation config. Remove it on first read; the server admin key
    // belongs only to the server and the owner's browser session.
    if (Object.hasOwn(source.server || {}, 'adminKey')) await writeConfig(normalized, file)
    return normalized
  } catch (error) {
    if (error?.code !== 'ENOENT') throw new Error(`无法读取 A2S 配置 ${file}: ${error.message}`)
  }
  const document = createDefaultConfig(dirname(file))
  await mkdir(dirname(file), { recursive: true, mode: 0o700 })
  try {
    const handle = await open(file, 'wx', 0o600)
    try { await handle.writeFile(`${JSON.stringify(document, null, 2)}\n`, 'utf8') } finally { await handle.close() }
    return document
  } catch (error) {
    if (error?.code !== 'EEXIST') throw error
    return normalizeConfig(JSON.parse(await readFile(file, 'utf8')), dirname(file))
  }
}

export async function writeConfig(document, file = defaultConfigFile()) {
  const normalized = normalizeConfig(document, dirname(file))
  await mkdir(dirname(file), { recursive: true, mode: 0o700 })
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`
  await writeFile(temporary, `${JSON.stringify(normalized, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
  await replaceFilePortable(temporary, file)
  return normalized
}

export function mergeConfig(current, patch) {
  const next = structuredClone(current)
  if (patch.device) Object.assign(next.device, patch.device)
  if (patch.server) Object.assign(next.server, patch.server)
  if (patch.plugins) Object.assign(next.plugins, patch.plugins)
  if (patch.app) Object.assign(next.app, patch.app)
  if (patch.agents) {
    for (const type of ['dsh', 'claude', 'codex']) {
      if (patch.agents[type]) Object.assign(next.agents[type], patch.agents[type])
    }
  }
  return next
}

export function publicConfig(document, file = defaultConfigFile()) {
  return {
    ...structuredClone(document),
    device: {
      ...document.device,
      key: undefined,
      keyFingerprint: fingerprint(document.device.key),
    },
    server: { ...document.server },
    configFile: file,
  }
}

export function fingerprint(key) {
  const text = String(key || '')
  return text.length > 16 ? `${text.slice(0, 10)}…${text.slice(-4)}` : '未生成'
}

export function normalizeEndpoints(value) {
  const values = Array.isArray(value) ? value : String(value ?? '').split(/[\n,]/)
  const result = []
  for (const entry of values) {
    const text = String(entry || '').trim().replace(/\/+$/, '')
    if (!text) continue
    const url = new URL(text)
    if (!['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)) throw new TypeError(`不支持的服务器协议：${url.protocol}`)
    const normalized = url.toString().replace(/\/+$/, '')
    if (!result.includes(normalized)) result.push(normalized)
  }
  return result
}

function platformExecutable(name) {
  return process.platform === 'win32' ? `${name}.cmd` : name
}

function safeHost() {
  try { return hostname() || 'unknown-host' } catch { return 'unknown-host' }
}

function safeUser() {
  try { return userInfo().username || 'unknown-user' } catch { return 'unknown-user' }
}
