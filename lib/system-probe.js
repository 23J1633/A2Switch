import { spawn } from 'node:child_process'
import { access } from 'node:fs/promises'
import { join } from 'node:path'

const COMMANDS = Object.freeze({
  claude: { command: process.platform === 'win32' ? 'claude.cmd' : 'claude', args: ['--version'] },
  codex: { command: process.platform === 'win32' ? 'codex.exe' : 'codex', args: ['--version'] },
  dsh: { command: process.platform === 'win32' ? 'dsh.cmd' : 'dsh', args: ['--version'] },
})

let cached = null
let cachedAt = 0

export async function probeAgents({ refresh = false } = {}) {
  if (!refresh && cached && Date.now() - cachedAt < 30000) return cached
  const entries = await Promise.all(Object.entries(COMMANDS).map(async ([type, spec]) => {
    if (type === 'dsh') return [type, await probeDsh(spec)]
    const result = await commandOutput(spec.command, spec.args, 8000)
    return [type, {
      installed: result.code === 0,
      command: spec.command,
      version: firstLine(result.stdout || result.stderr),
      error: result.code === 0 ? null : firstLine(result.stderr || result.stdout) || '未找到可执行文件',
    }]
  }))
  cached = Object.fromEntries(entries)
  cachedAt = Date.now()
  return cached
}

async function probeDsh(spec) {
  const regular = await commandOutput(spec.command, spec.args, 8000)
  if (regular.code === 0) {
    return { installed: true, command: spec.command, version: firstLine(regular.stdout || regular.stderr) || 'DeepSeek Harness', error: null }
  }
  const candidates = [
    process.env.DSH_EXE,
    process.platform === 'win32' ? 'D:\\dsh\\dsh.cmd' : '',
    process.platform === 'win32' ? join(process.env.APPDATA || '', 'npm', 'dsh.cmd') : '',
    process.platform === 'win32' ? 'D:\\dsh\\app\\dsh.cmd' : '',
  ].filter(Boolean)
  for (const command of [...new Set(candidates)]) {
    if (!await exists(command)) continue
    const result = await commandOutput(command, spec.args, 8000)
    if (result.code === 0) {
      return { installed: true, command, version: firstLine(result.stdout || result.stderr) || 'DeepSeek Harness', error: null }
    }
  }
  return { installed: false, command: spec.command, version: '', error: firstLine(regular.stderr || regular.stdout) || '未找到可执行文件' }
}

export function commandOutput(command, args = [], timeoutMs = 10000) {
  return new Promise((resolve) => {
    let settled = false
    let stdout = ''
    let stderr = ''
    const child = spawn(command, args, {
      windowsHide: true,
      shell: process.platform === 'win32' && /\.cmd$/i.test(command),
    })
    const finish = (value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(value)
    }
    const timer = setTimeout(() => {
      child.kill()
      finish({ code: 1, stdout, stderr: `${stderr}\n执行超时`.trim() })
    }, timeoutMs)
    child.stdout?.on('data', (chunk) => { stdout += chunk })
    child.stderr?.on('data', (chunk) => { stderr += chunk })
    child.once('error', (error) => finish({ code: 1, stdout, stderr: `${stderr}${error.message}` }))
    child.once('exit', (code) => finish({ code: code ?? 1, stdout, stderr }))
  })
}

function firstLine(value) {
  return String(value || '').trim().split(/\r?\n/, 1)[0] || ''
}

async function exists(file) {
  try { await access(file); return true } catch { return false }
}
