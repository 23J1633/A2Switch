import { EventEmitter } from 'node:events'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { replaceFilePortable } from './fs-portable.js'

const AGENT_BIN = Object.freeze({ claude: 'cc2server', codex: 'codex2server' })

export class ProcessManager extends EventEmitter {
  constructor({ configFile, pluginService, workspaceRoot }) {
    super()
    this.configFile = configFile
    this.pluginService = pluginService
    this.workspaceRoot = workspaceRoot
    this.children = new Map()
    this.externalPids = new Map()
    this.logLines = []
  }

  appendLog(level, message, source = 'A2Switch') {
    const item = { at: Date.now(), level, source, message: String(message).trimEnd() }
    this.logLines.push(item)
    if (this.logLines.length > 1000) this.logLines.splice(0, this.logLines.length - 1000)
    this.emit('log', item)
  }

  logs(limit = 300) {
    return this.logLines.slice(-Math.max(1, Math.min(1000, limit)))
  }

  async startAgent(type, config) {
    if (type === 'dsh') return await this.controlDsh('start', config)
    if (!AGENT_BIN[type]) throw new Error(`不支持启动 ${type}`)
    const current = this.children.get(type)
    if (current && current.exitCode == null) return this.describe(type)
    const runtime = await this.runtimeStatus(type)
    if (isMatchingRuntime(runtime, config.agents[type]) && isProcessAlive(runtime.pid)) {
      this.externalPids.set(type, runtime.pid)
      this.appendLog('info', `已接管正在运行的 PID ${runtime.pid}`, AGENT_BIN[type])
      return this.describe(type)
    }
    if (!config.agents[type]?.enabled) throw new Error(`${type} 桥接器已禁用`)
    const directory = await this.pluginService.resolvePackage(AGENT_BIN[type], config)
    if (!directory) throw new Error(`${AGENT_BIN[type]} 尚未安装`)
    const entry = join(directory, 'bin', `${AGENT_BIN[type]}.js`)
    if (!await exists(entry)) throw new Error(`找不到桥接器入口：${entry}`)

    const executable = process.versions.electron ? process.execPath : process.execPath
    const child = spawn(executable, [entry, 'start', '--shared-config', this.configFile], {
      cwd: directory,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        ...(process.versions.electron ? { ELECTRON_RUN_AS_NODE: '1' } : {}),
        A2S_CONFIG_PATH: this.configFile,
      },
    })
    this.children.set(type, child)
    this.appendLog('info', `已启动 PID ${child.pid}`, AGENT_BIN[type])
    pipeLines(child.stdout, (line) => this.appendLog('info', line, AGENT_BIN[type]))
    pipeLines(child.stderr, (line) => this.appendLog('error', line, AGENT_BIN[type]))
    child.once('error', (error) => this.appendLog('error', error.message, AGENT_BIN[type]))
    child.once('exit', (code, signal) => {
      this.appendLog(code === 0 ? 'info' : 'warn', `进程已退出（code=${code ?? '-'}, signal=${signal ?? '-'}）`, AGENT_BIN[type])
      this.emit('status', { type, ...this.describe(type) })
    })
    this.emit('status', { type, ...this.describe(type) })
    return this.describe(type)
  }

  async stopAgent(type) {
    if (type === 'dsh') return await this.controlDsh('stop')
    const child = this.children.get(type)
    if (!child || child.exitCode != null) {
      let externalPid = this.externalPids.get(type)
      if (!externalPid) {
        const runtime = await this.runtimeStatus(type)
        if (runtime.plugin === AGENT_BIN[type] && isProcessAlive(runtime.pid)) {
          externalPid = Number(runtime.pid)
          this.externalPids.set(type, externalPid)
        }
      }
      if (!externalPid || !isProcessAlive(externalPid)) {
        this.externalPids.delete(type)
        return this.describe(type)
      }
      process.kill(externalPid, 'SIGTERM')
      await waitForExit(externalPid, 4000)
      if (isProcessAlive(externalPid)) process.kill(externalPid, 'SIGKILL')
      this.externalPids.delete(type)
      this.appendLog('info', `已停止接管的 PID ${externalPid}`, AGENT_BIN[type])
      return this.describe(type)
    }
    child.kill('SIGTERM')
    await Promise.race([
      new Promise((resolvePromise) => child.once('exit', resolvePromise)),
      new Promise((resolvePromise) => setTimeout(resolvePromise, 4000)),
    ])
    if (child.exitCode == null) child.kill('SIGKILL')
    return this.describe(type)
  }

  async restartAgent(type, config) {
    if (type === 'dsh') return await this.controlDsh('restart', config)
    await this.stopAgent(type)
    return await this.startAgent(type, config)
  }

  async controlDsh(action, config) {
    if (config && !config.agents.dsh?.enabled && action !== 'stop') throw new Error('dsh 桥接器已禁用')
    const runtime = await this.runtimeStatus('dsh')
    if (!isDshRuntime(runtime, config?.agents?.dsh) || !isProcessAlive(runtime.pid)) {
      throw new Error('未检测到支持本地控制的 dsh2server；请先安装/更新插件并重启一次 DeepSeek Harness')
    }
    this.externalPids.set('dsh', Number(runtime.pid))
    const id = randomUUID()
    const controlFile = join(dirname(this.configFile), 'runtime', 'dsh-control.json')
    await atomicJson(controlFile, {
      version: 1,
      id,
      action,
      instanceId: config?.agents?.dsh?.instanceId || runtime.instanceId,
      requestedAt: new Date().toISOString(),
      requesterPid: process.pid,
    })
    const deadline = Date.now() + 10000
    while (Date.now() < deadline) {
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 100))
      const current = await this.runtimeStatus('dsh')
      if (current.control?.id !== id) continue
      if (!current.control.ok) throw new Error(current.control.error || `DSH ${action} 操作失败`)
      this.appendLog('info', `DeepSeek Harness 桥接连接已${{ start: '启动', stop: '停止', restart: '重启' }[action]}`, 'dsh2server')
      this.emit('status', { type: 'dsh', ...this.describe('dsh') })
      return this.describe('dsh')
    }
    throw new Error(`等待 dsh2server 响应 ${action} 操作超时`)
  }

  async startAuto(config) {
    for (const type of Object.keys(AGENT_BIN)) {
      if (config.agents[type]?.enabled && config.agents[type]?.autoStart && config.server.endpoints.length) {
        await this.startAgent(type, config).catch((error) => this.appendLog('error', error.message, AGENT_BIN[type]))
      }
    }
  }

  async stopAll() {
    await Promise.allSettled([...this.children.keys()].map((type) => this.stopAgent(type)))
  }

  describe(type) {
    const child = this.children.get(type)
    const externalPid = this.externalPids.get(type)
    const externalRunning = !!externalPid && isProcessAlive(externalPid)
    if (externalPid && !externalRunning) this.externalPids.delete(type)
    return {
      running: (!!child && child.exitCode == null) || externalRunning,
      pid: child && child.exitCode == null ? child.pid : externalRunning ? externalPid : null,
      exitCode: child?.exitCode ?? null,
      managed: !!child && child.exitCode == null,
      adopted: externalRunning,
    }
  }

  async runtimeStatus(type) {
    const file = join(dirname(this.configFile), 'runtime', `${type}.json`)
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        if (await hasFreshWriteLock(file)) throw new Error('runtime record is being replaced')
        const [text, info] = await Promise.all([readFile(file, 'utf8'), stat(file)])
        if (await hasFreshWriteLock(file)) throw new Error('runtime record changed while being read')
        const value = JSON.parse(text)
        const recordedAt = Date.parse(value.updatedAt || value.stoppedAt || 0)
        const fresh = Date.now() - Math.max(Number.isFinite(recordedAt) ? recordedAt : 0, info.mtimeMs) < 120000
        return { ...value, fresh }
      } catch (error) {
        // Runtime records are atomically replaced. A very short ENOENT window
        // can still occur on filesystems that cannot overwrite an open target,
        // so treat it like a transient parse/read failure before declaring the
        // bridge offline.
        if (attempt < 7) await new Promise((resolvePromise) => setTimeout(resolvePromise, 20))
      }
    }
    return { running: false, connected: false, fresh: false }
  }

  async status(config, serverState) {
    const statuses = {}
    for (const type of ['claude', 'codex', 'dsh']) {
      const instanceId = config.agents[type].instanceId
      const serverInstance = serverState?.instances?.find((item) => item.instanceId === instanceId)
      const runtime = await this.runtimeStatus(type)
      const runtimeMatches = type === 'dsh' ? isDshRuntime(runtime, config.agents[type]) : isMatchingRuntime(runtime, config.agents[type])
      if (runtimeMatches && isProcessAlive(runtime.pid)) this.externalPids.set(type, Number(runtime.pid))
      statuses[type] = {
        type,
        enabled: config.agents[type].enabled,
        autoStart: config.agents[type].autoStart,
        instanceId,
        process: this.describe(type),
        runtime,
        server: serverInstance || null,
        connected: type === 'dsh' && runtime?.suspended ? false : !!serverInstance?.online || !!runtime?.connected,
      }
    }
    return statuses
  }
}

async function hasFreshWriteLock(file) {
  try {
    const info = await stat(`${file}.lock`)
    return Date.now() - info.mtimeMs < 10000
  } catch {
    return false
  }
}

function pipeLines(stream, onLine) {
  if (!stream) return
  let pending = ''
  stream.setEncoding('utf8')
  stream.on('data', (chunk) => {
    pending += chunk
    const lines = pending.split(/\r?\n/)
    pending = lines.pop() || ''
    for (const line of lines) if (line) onLine(line)
  })
  stream.on('end', () => { if (pending) onLine(pending) })
}

async function exists(file) {
  try { await access(resolve(file)); return true } catch { return false }
}

function isMatchingRuntime(runtime, agent) {
  return runtime?.fresh === true && runtime?.running === true && runtime?.connected === true && runtime?.instanceId === agent?.instanceId && Number.isInteger(Number(runtime?.pid))
}

function isDshRuntime(runtime, agent) {
  return runtime?.fresh === true && runtime?.running === true && (!agent?.instanceId || runtime?.instanceId === agent.instanceId) && Number.isInteger(Number(runtime?.pid))
}

async function atomicJson(file, value) {
  await mkdir(dirname(file), { recursive: true, mode: 0o700 })
  const temporary = `${file}.${process.pid}.${process.hrtime.bigint()}.tmp`
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
  await replaceFilePortable(temporary, file)
}

function isProcessAlive(pid) {
  if (!Number.isInteger(Number(pid)) || Number(pid) <= 0) return false
  try { process.kill(Number(pid), 0); return true } catch (error) { return error?.code === 'EPERM' }
}

async function waitForExit(pid, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline && isProcessAlive(pid)) await new Promise((resolvePromise) => setTimeout(resolvePromise, 100))
}
