import { spawn } from 'node:child_process'
import { access, cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { basename, join, resolve, sep } from 'node:path'
import extractZip from 'extract-zip'
import { moveDirectoryPortable } from './fs-portable.js'

const MAX_ARCHIVE_BYTES = 50 * 1024 * 1024

const BUILTINS = Object.freeze([
  {
    id: 'dsh2server',
    name: 'DeepSeek Harness Bridge',
    agentType: 'dsh',
    description: '将 DeepSeek Harness 的会话、工具、审批、工作区与插件能力接入 A2S。',
    repository: 'https://github.com/23J1633/dsh2server.git',
  },
  {
    id: 'cc2server',
    name: 'Claude Code Bridge',
    agentType: 'claude',
    description: '以 Claude Code stream-json 协议提供远程会话、提示词与中断控制。',
    repository: 'https://github.com/23J1633/cc2server.git',
  },
  {
    id: 'codex2server',
    name: 'Codex Bridge',
    agentType: 'codex',
    description: '基于官方 Codex app-server JSON-RPC 接口提供完整远程控制。',
    repository: 'https://github.com/23J1633/codex2server.git',
  },
])

export class PluginService {
  constructor({ configFile, workspaceRoot, log = () => {} }) {
    this.configFile = configFile
    this.workspaceRoot = workspaceRoot
    this.log = log
    this.catalogCache = null
  }

  async catalog(config, { refresh = false } = {}) {
    if (!refresh && this.catalogCache) return await this.#decorate(this.catalogCache, config)
    let items = BUILTINS.map((item) => ({ ...item }))
    const url = String(config.plugins.catalogUrl || '').trim()
    if (url) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(10000), headers: { accept: 'application/json' } })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const document = await response.json()
        if (!Array.isArray(document?.plugins)) throw new Error('目录缺少 plugins 数组')
        items = mergeCatalog(items, document.plugins)
      } catch (error) {
        this.log('warn', `插件目录读取失败，已使用内置目录：${error.message}`)
        items = items.map((item) => ({ ...item, catalogWarning: error.message }))
      }
    }
    this.catalogCache = items
    return await this.#decorate(items, config)
  }

  async resolvePackage(id, config) {
    assertPluginId(id)
    const installed = resolve(config.plugins.installDir, id)
    if (await exists(join(installed, 'package.json'))) return installed
    const local = resolve(this.workspaceRoot, id)
    if (await exists(join(local, 'package.json'))) return local
    return null
  }

  async install(id, config) {
    assertPluginId(id)
    const catalog = await this.catalog(config)
    const plugin = catalog.find((item) => item.id === id)
    if (!plugin) throw new Error(`插件目录中没有 ${id}`)

    const installRoot = resolve(config.plugins.installDir)
    const target = resolve(installRoot, id)
    assertInside(installRoot, target)
    await mkdir(installRoot, { recursive: true })
    const stage = resolve(installRoot, `.install-${id}-${process.pid}-${Date.now()}`)
    assertInside(installRoot, stage)
    await mkdir(stage, { recursive: true })
    this.log('info', `正在安装 ${id}…`)

    try {
      const local = resolve(this.workspaceRoot, id)
      let source = 'github'
      if (await exists(join(local, 'package.json'))) {
        await cp(local, stage, { recursive: true, filter: copyFilter })
        source = 'workspace'
      } else {
        await downloadRepository(plugin, stage, this.log)
      }
      await validatePackage(stage, id)
      await installDependencies(stage, this.log)

      let backup = null
      if (await exists(target)) {
        backup = resolve(installRoot, `.backup-${id}-${Date.now()}`)
        assertInside(installRoot, backup)
        await moveDirectoryPortable(target, backup, { filter: copyFilter })
      }
      try {
        await moveDirectoryPortable(stage, target, { filter: copyFilter })
      } catch (error) {
        await rm(target, { recursive: true, force: true }).catch(() => undefined)
        if (backup && await exists(backup)) {
          try {
            await moveDirectoryPortable(backup, target, { filter: copyFilter })
          } catch (rollbackError) {
            error.message = `${error.message}；回滚失败：${rollbackError.message}（备份：${backup}）`
          }
        }
        throw error
      }
      this.log('info', `${id} 已安装到 ${target}`)
      return { ok: true, id, path: target, backup, source }
    } catch (error) {
      await rm(stage, { recursive: true, force: true }).catch(() => undefined)
      throw error
    }
  }

  async #decorate(items, config) {
    return await Promise.all(items.map(async (item) => {
      const installedPath = resolve(config.plugins.installDir, item.id)
      const localPath = resolve(this.workspaceRoot, item.id)
      const installedPackage = await readPackage(installedPath)
      const localPackage = await readPackage(localPath)
      return {
        ...item,
        installed: !!installedPackage,
        installedVersion: installedPackage?.version || null,
        installedPath: installedPackage ? installedPath : null,
        developmentAvailable: !!localPackage,
        developmentVersion: localPackage?.version || null,
      }
    }))
  }
}

function mergeCatalog(builtins, remote) {
  const map = new Map(builtins.map((item) => [item.id, item]))
  for (const item of remote) {
    if (!item || typeof item !== 'object' || !/^[a-z0-9][a-z0-9._-]*$/i.test(item.id || '')) continue
    map.set(item.id, { ...(map.get(item.id) || {}), ...item })
  }
  return [...map.values()]
}

async function downloadRepository(plugin, stage, log) {
  const archiveUrl = plugin.archive ? validatedArchiveUrl(plugin.archive) : repositoryArchiveUrl(plugin.repository, plugin.ref)
  const archiveFile = `${stage}.zip`
  const extractRoot = `${stage}-archive`
  log('info', `正在从 GitHub 下载 ${plugin.id}…`)
  try {
    const response = await fetch(archiveUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(120000),
      headers: {
        accept: 'application/zip, application/octet-stream',
        'user-agent': 'A2Switch plugin installer',
      },
    })
    if (!response.ok) throw new Error(`下载失败：HTTP ${response.status}`)
    const declaredSize = Number(response.headers.get('content-length') || 0)
    if (declaredSize > MAX_ARCHIVE_BYTES) throw new Error('插件压缩包超过 50 MB 限制')
    const archive = Buffer.from(await response.arrayBuffer())
    if (archive.length > MAX_ARCHIVE_BYTES) throw new Error('插件压缩包超过 50 MB 限制')
    await writeFile(archiveFile, archive)
    await mkdir(extractRoot, { recursive: true })
    await extractZip(archiveFile, { dir: extractRoot })

    const entries = await readdir(extractRoot, { withFileTypes: true })
    const archiveRoot = entries.length === 1 && entries[0].isDirectory()
      ? join(extractRoot, entries[0].name)
      : extractRoot
    const source = plugin.subdir ? resolve(archiveRoot, String(plugin.subdir)) : archiveRoot
    assertInsideOrEqual(archiveRoot, source)
    if (!await exists(source)) throw new Error(`压缩包中没有目录 ${plugin.subdir}`)
    await cp(source, stage, { recursive: true, filter: copyFilter })
  } finally {
    await rm(archiveFile, { force: true }).catch(() => undefined)
    await rm(extractRoot, { recursive: true, force: true }).catch(() => undefined)
  }
}

export function repositoryArchiveUrl(repository, ref) {
  if (!repository) throw new Error('插件没有可下载的 repository')
  let url
  try { url = new URL(String(repository)) } catch { throw new Error('插件 repository 不是合法 URL') }
  if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'github.com') {
    throw new Error('一键安装仅支持 HTTPS GitHub repository，也可在在线目录中提供 archive URL')
  }
  const parts = url.pathname.replace(/^\/+|\/+$/g, '').replace(/\.git$/i, '').split('/')
  if (parts.length !== 2 || parts.some((part) => !/^[a-z0-9_.-]+$/i.test(part))) {
    throw new Error('插件 repository 必须是 https://github.com/<owner>/<repo>')
  }
  const suffix = ref ? `/${encodeURIComponent(String(ref))}` : ''
  return `https://api.github.com/repos/${parts[0]}/${parts[1]}/zipball${suffix}`
}

function validatedArchiveUrl(value) {
  let url
  try { url = new URL(String(value)) } catch { throw new Error('插件 archive 不是合法 URL') }
  if (url.protocol !== 'https:') throw new Error('插件 archive 必须使用 HTTPS')
  return url.toString()
}

async function installDependencies(directory, log) {
  const manifest = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'))
  if (!manifest.dependencies || Object.keys(manifest.dependencies).length === 0) return
  log('info', `正在安装 ${basename(directory)} 的运行依赖…`)
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  await run(npm, ['install', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: directory, timeoutMs: 180000 })
}

async function validatePackage(directory, expectedId) {
  const manifest = await readPackage(directory)
  if (!manifest) throw new Error('下载内容中没有 package.json')
  if (!manifest.name || typeof manifest.name !== 'string') throw new Error('package.json 缺少 name')
  if (expectedId !== 'dsh2server') {
    const binary = join(directory, 'bin', `${expectedId}.js`)
    if (!await exists(binary)) throw new Error(`插件缺少入口 ${binary}`)
  }
}

async function readPackage(directory) {
  try { return JSON.parse(await readFile(join(directory, 'package.json'), 'utf8')) } catch { return null }
}

function copyFilter(source) {
  const parts = resolve(source).split(/[\\/]/)
  return !parts.includes('node_modules') && !parts.includes('.git') && !parts.includes('dist')
}

function run(command, args, { cwd, timeoutMs }) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, windowsHide: true, shell: process.platform === 'win32' && /\.cmd$/i.test(command) })
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => {
      child.kill()
      reject(new Error(`${command} 执行超时`))
    }, timeoutMs)
    child.stdout?.on('data', (chunk) => { stdout += chunk })
    child.stderr?.on('data', (chunk) => { stderr += chunk })
    child.once('error', (error) => { clearTimeout(timer); reject(error) })
    child.once('exit', (code) => {
      clearTimeout(timer)
      if (code === 0) resolvePromise({ stdout, stderr })
      else reject(new Error(`${command} 退出码 ${code}：${stderr.trim() || stdout.trim()}`))
    })
  })
}

async function exists(file) {
  try { await access(file); return true } catch { return false }
}

function assertPluginId(id) {
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(String(id || ''))) throw new Error('非法插件 ID')
}

function assertInside(root, target) {
  const prefix = resolve(root) + sep
  if (!resolve(target).startsWith(prefix)) throw new Error('插件路径超出安装目录')
}

function assertInsideOrEqual(root, target) {
  if (resolve(root) === resolve(target)) return
  assertInside(root, target)
}
