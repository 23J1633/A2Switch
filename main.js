import { app, BrowserWindow, clipboard, ipcMain, nativeTheme, shell } from 'electron'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  defaultConfigFile,
  ensureConfig,
  fingerprint,
  generateDeviceKey,
  mergeConfig,
  publicConfig,
  writeConfig,
} from './lib/config-service.js'
import { PluginService } from './lib/plugin-service.js'
import { ProcessManager } from './lib/process-manager.js'
import { inspectServer } from './lib/server-client.js'
import { commandOutput, probeAgents } from './lib/system-probe.js'

const APP_DIR = dirname(fileURLToPath(import.meta.url))
const WORKSPACE_ROOT = resolve(APP_DIR, '..')
const CONFIG_FILE = defaultConfigFile()
const PLUGIN_AGENT_TYPES = Object.freeze({ cc2server: 'claude', codex2server: 'codex', dsh2server: 'dsh' })
const CORE_PLUGIN_IDS = Object.freeze(['cc2server', 'codex2server', 'dsh2server'])

let mainWindow = null
let config = null
let pluginService = null
let processManager = null
let statePromise = null
let serverCache = { at: 0, value: null }

async function initialize() {
  config = await ensureConfig(CONFIG_FILE)
  process.env.A2S_CONFIG_PATH = CONFIG_FILE
  pluginService = new PluginService({
    configFile: CONFIG_FILE,
    workspaceRoot: WORKSPACE_ROOT,
    log: (level, message) => processManager?.appendLog(level, message, 'plugins'),
  })
  processManager = new ProcessManager({ configFile: CONFIG_FILE, pluginService, workspaceRoot: WORKSPACE_ROOT })
  processManager.on('log', (item) => mainWindow?.webContents.send('a2s:log', item))
  processManager.on('status', (item) => mainWindow?.webContents.send('a2s:status', item))
  registerIpc()
}

function createWindow() {
  const requestedTheme = argumentValue('theme')
  const requestedLocale = argumentValue('locale')
  if (['light', 'dark'].includes(requestedTheme)) applyNativeTheme(requestedTheme)
  const query = {
    ...(['light', 'dark'].includes(requestedTheme) ? { theme: requestedTheme } : {}),
    ...(['zh-CN', 'en-US'].includes(requestedLocale) ? { locale: requestedLocale } : {}),
  }
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 790,
    minWidth: 920,
    minHeight: 640,
    show: false,
    title: 'A2Switch',
    icon: join(APP_DIR, 'assets', 'icon.png'),
    backgroundColor: requestedTheme === 'dark' ? '#121318' : '#f7f8fb',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(APP_DIR, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  mainWindow.loadFile(join(APP_DIR, 'renderer', 'index.html'), Object.keys(query).length ? { query } : undefined)
  mainWindow.once('ready-to-show', () => mainWindow?.show())
  if (process.argv.includes('--smoke-test')) {
    mainWindow.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        try {
          const uiDeadline = Date.now() + 20_000
          while (Date.now() < uiDeadline) {
            const ready = await mainWindow.webContents.executeJavaScript(
              `document.querySelectorAll('.agentCard').length === 3 && !!document.querySelector('.serverCard')`,
            )
            if (ready) break
            await new Promise((resolvePromise) => setTimeout(resolvePromise, 150))
          }
          const uiReady = await mainWindow.webContents.executeJavaScript(
            `document.querySelectorAll('.agentCard').length === 3 && !!document.querySelector('.serverCard')`,
          )
          if (!uiReady) throw new Error('UI 状态加载超时')
          const output = resolve(process.env.A2S_SMOKE_SCREENSHOT || join(APP_DIR, 'artifacts', 'ui-smoke.png'))
          await mkdir(dirname(output), { recursive: true })
          const image = await mainWindow.capturePage()
          await writeFile(output, image.toPNG())
          const interactions = await mainWindow.webContents.executeJavaScript(`(async () => {
            const root = document.documentElement
            const initialTheme = root.dataset.theme
            const initialLocale = root.lang
            const initialNativeTheme = await window.a2s.getNativeTheme()
            document.querySelector('#themeBtn').click()
            const themeToggle = root.dataset.theme !== initialTheme
            const toggledTheme = root.dataset.theme
            await new Promise((resolve) => setTimeout(resolve, 80))
            const toggledNativeTheme = await window.a2s.getNativeTheme()
            document.querySelector('#themeBtn').click()
            await new Promise((resolve) => setTimeout(resolve, 80))
            const restoredNativeTheme = await window.a2s.getNativeTheme()
            document.querySelector('#languageBtn').click()
            const languageToggle = root.lang !== initialLocale
            document.querySelector('#languageBtn').click()
            document.querySelector('#toastHost').replaceChildren()
            const square = (element) => {
              const box = element.getBoundingClientRect()
              return box.width > 0 && Math.abs(box.width - box.height) < 0.25
            }
            const brandIcons = [...document.querySelectorAll('.brandIcon')]
            const logoTiles = [...document.querySelectorAll('.agentLogo, .pluginIcon, .serverIcon')]
            const appLogo = document.querySelector('.brandLogo')
            const appLogoBox = appLogo?.getBoundingClientRect()
            const appLogoAspectOk = !!appLogoBox && appLogoBox.height > 0 && Math.abs((appLogoBox.width / appLogoBox.height) - 2) < 0.05
            const brandIconsSquare = brandIcons.every(square)
            const logoTilesSquare = logoTiles.every(square)
            document.querySelector('#configNav').click()
            const adminKeyIsAbsent = typeof window.a2s.copyAdminKey === 'undefined'
              && !document.querySelector('[name="adminKey"]')
              && !document.querySelector('#copyAdminKeyButton')
            const endpointCount = document.querySelectorAll('.endpointRow [name="endpoint"]').length
            const endpointsAreInputs = [...document.querySelectorAll('.endpointRow [name="endpoint"]')].every((control) => control.tagName === 'INPUT')
            document.querySelector('#addEndpointButton')?.click()
            const endpointAddWorks = document.querySelectorAll('.endpointRow [name="endpoint"]').length === endpointCount + 1
            document.querySelector('.endpointRow:last-child .endpointRemove')?.click()
            const endpointRemoveWorks = document.querySelectorAll('.endpointRow [name="endpoint"]').length === endpointCount
            document.querySelector('#pluginsNav').click()
            const installAllPluginsButtonPresent = !!document.querySelector('#installAllPluginsButton')
            const englishContentChinese = []
            if (initialLocale === 'en-US') {
              for (const selector of ['#overviewLabel', '#configNav', '#pluginsNav', '[data-view="claude"]', '[data-view="codex"]', '[data-view="dsh"]']) {
                document.querySelector(selector)?.click()
                await new Promise((resolve) => setTimeout(resolve, 40))
                const text = document.querySelector('#content')?.innerText || ''
                englishContentChinese.push(...(text.match(/[\\u3400-\\u9fff][^\\n]*/g) || []))
              }
            }
            return {
              themeToggle,
              nativeThemeInitiallyAligned: initialNativeTheme.themeSource === initialTheme,
              nativeThemeToggleAligned: toggledNativeTheme.themeSource === toggledTheme,
              languageToggle,
              themeRestored: root.dataset.theme === initialTheme,
              nativeThemeRestored: restoredNativeTheme.themeSource === initialTheme,
              languageRestored: root.lang === initialLocale,
              brandIconCount: brandIcons.length,
              brandIconsSquare,
              logoTilesSquare,
              appLogoAspectOk,
              adminKeyIsAbsent,
              endpointsAreInputs,
              endpointAddWorks,
              endpointRemoveWorks,
              installAllPluginsButtonPresent,
              englishContentChinese: [...new Set(englishContentChinese)],
            }
          })()`)
          if (!interactions.themeToggle || !interactions.nativeThemeInitiallyAligned || !interactions.nativeThemeToggleAligned || !interactions.languageToggle || !interactions.themeRestored || !interactions.nativeThemeRestored || !interactions.languageRestored || interactions.brandIconCount < 6 || !interactions.brandIconsSquare || !interactions.logoTilesSquare || !interactions.appLogoAspectOk || !interactions.adminKeyIsAbsent || !interactions.endpointsAreInputs || !interactions.endpointAddWorks || !interactions.endpointRemoveWorks || !interactions.installAllPluginsButtonPresent || interactions.englishContentChinese.length) {
            throw new Error(`UI 交互自检失败：${JSON.stringify(interactions)}`)
          }
          if (process.env.A2S_SMOKE_CONFIG_SCREENSHOT) {
            const configOutput = resolve(process.env.A2S_SMOKE_CONFIG_SCREENSHOT)
            await mkdir(dirname(configOutput), { recursive: true })
            await mainWindow.webContents.executeJavaScript(
              `document.querySelector('#configNav')?.click()`,
            )
            await new Promise((resolvePromise) => setTimeout(resolvePromise, 80))
            await mainWindow.webContents.executeJavaScript(
              `document.querySelector('#configForm')?.scrollIntoView({ block: 'start' })`,
            )
            await new Promise((resolvePromise) => setTimeout(resolvePromise, 100))
            const configImage = await mainWindow.capturePage()
            await writeFile(configOutput, configImage.toPNG())
          }
          console.log(JSON.stringify({ ok: true, screenshot: output, interactions }))
        } catch (error) {
          console.error(error)
          process.exitCode = 1
        } finally {
          await processManager.stopAll()
          app.quit()
        }
      }, 1800)
    })
  }
  if (process.argv.includes('--smoke-install-all')) {
    mainWindow.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        try {
          const result = await mainWindow.webContents.executeJavaScript('window.a2s.installAllPlugins()')
          console.log(JSON.stringify({ ok: result.failures.length === 0, ...result }))
          if (result.failures.length) process.exitCode = 1
        } catch (error) {
          console.error(error)
          process.exitCode = 1
        } finally {
          app.quit()
        }
      }, 500)
    })
  }
  mainWindow.on('closed', () => { mainWindow = null })
}

function registerIpc() {
  ipcMain.handle('a2s:set-native-theme', (_event, value) => applyNativeTheme(value))
  ipcMain.handle('a2s:get-native-theme', () => nativeThemeState())
  ipcMain.handle('a2s:get-state', async () => await getState())
  ipcMain.handle('a2s:save-config', async (_event, patch) => {
    const running = ['claude', 'codex'].filter((type) => processManager.describe(type).running)
    const previousDsh = JSON.stringify({ server: config.server, agent: config.agents.dsh })
    const dshRuntime = await processManager.runtimeStatus('dsh')
    config = await writeConfig(mergeConfig(config, sanitizePatch(patch)), CONFIG_FILE)
    serverCache.at = 0
    for (const type of running) await processManager.restartAgent(type, config)
    const dshChanged = previousDsh !== JSON.stringify({ server: config.server, agent: config.agents.dsh })
    if (dshChanged && dshRuntime.fresh && dshRuntime.running) {
      const action = !config.agents.dsh.enabled ? 'stop' : dshRuntime.suspended ? 'start' : 'restart'
      await processManager.controlDsh(action, config).catch((error) => {
        processManager.appendLog('warn', `统一配置已保存，但 DSH 桥接刷新失败：${error.message}`, 'dsh2server')
      })
    }
    processManager.appendLog('info', '统一配置已保存', 'A2Switch')
    return await getState(true)
  })
  ipcMain.handle('a2s:start-agent', async (_event, type) => {
    assertAgent(type)
    await processManager.startAgent(type, config)
    return await getState(true)
  })
  ipcMain.handle('a2s:stop-agent', async (_event, type) => {
    assertAgent(type)
    await processManager.stopAgent(type)
    return await getState(true)
  })
  ipcMain.handle('a2s:restart-agent', async (_event, type) => {
    assertAgent(type)
    await processManager.restartAgent(type, config)
    return await getState(true)
  })
  ipcMain.handle('a2s:test-server', async () => {
    serverCache.at = 0
    return await serverState(true)
  })
  ipcMain.handle('a2s:copy-key', () => {
    clipboard.writeText(config.device.key)
    return { ok: true, fingerprint: fingerprint(config.device.key) }
  })
  ipcMain.handle('a2s:rotate-key', async () => await rotateDeviceKey())
  ipcMain.handle('a2s:plugins', async (_event, refresh) => await pluginService.catalog(config, { refresh: !!refresh }))
  ipcMain.handle('a2s:install-plugin', async (_event, id) => {
    const result = await installPluginForHost(String(id))
    return { result, plugins: await pluginService.catalog(config, { refresh: true }) }
  })
  ipcMain.handle('a2s:install-all-plugins', async () => {
    const results = []
    const failures = []
    for (const id of CORE_PLUGIN_IDS) {
      try {
        results.push(await installPluginForHost(id))
      } catch (error) {
        failures.push({ id, message: error.message || String(error) })
        processManager.appendLog('error', `${id} 安装失败：${error.message || error}`, 'plugins')
      }
    }
    return {
      results,
      failures,
      plugins: await pluginService.catalog(config, { refresh: true }),
    }
  })
  ipcMain.handle('a2s:logs', (_event, limit) => processManager.logs(Number(limit) || 300))
  ipcMain.handle('a2s:probe', async () => await probeAgents({ refresh: true }))
  ipcMain.handle('a2s:open-path', async (_event, target) => {
    const requested = resolve(String(target || ''))
    const allowed = [resolve(dirname(CONFIG_FILE)), resolve(config.plugins.installDir), WORKSPACE_ROOT]
    if (!allowed.some((root) => requested === root || requested.startsWith(root + sep))) throw new Error('不允许打开该路径')
    return await shell.openPath(requested)
  })
  ipcMain.handle('a2s:open-external', async (_event, target) => {
    const url = new URL(String(target || ''))
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('只允许打开 HTTP(S) 地址')
    await shell.openExternal(url.toString())
    return { ok: true }
  })
}

async function installPluginForHost(pluginId) {
  const agentType = PLUGIN_AGENT_TYPES[pluginId]
  const runtime = agentType ? await processManager.runtimeStatus(agentType) : null
  let dsh = null
  if (pluginId === 'dsh2server') {
    dsh = (await probeAgents({ refresh: true })).dsh
    if (!dsh.installed) throw new Error('未检测到 DeepSeek Harness，无法完成宿主注册')
  }

  const shouldRestart = agentType && agentType !== 'dsh' && runtime?.running && runtime?.fresh
  if (shouldRestart) await processManager.stopAgent(agentType)
  let result
  try {
    result = await pluginService.install(pluginId, config)
    if (pluginId === 'dsh2server') {
      const profile = process.env.A2S_DSH_PROFILE || process.env.DSH_PROFILE || 'web'
      const registered = await commandOutput(dsh.command, ['plugin', '--profile', profile, 'add', result.path], 120000)
      if (registered.code !== 0) throw new Error(`插件已下载，但 DSH 注册失败：${registered.stderr || registered.stdout}`)
      processManager.appendLog('info', `dsh2server 已由 A2Switch 注册到 DSH ${profile} profile`, 'dsh2server')
      result.profile = profile
      result.restartRequired = runtime?.running === true && runtime?.fresh === true
    }
  } catch (error) {
    if (shouldRestart) await processManager.startAgent(agentType, config).catch(() => undefined)
    throw error
  }
  if (shouldRestart) await processManager.startAgent(agentType, config)
  return result
}

function applyNativeTheme(value) {
  const themeSource = value === 'dark' ? 'dark' : 'light'
  nativeTheme.themeSource = themeSource
  mainWindow?.setBackgroundColor(themeSource === 'dark' ? '#121318' : '#f7f8fb')
  return nativeThemeState()
}

function nativeThemeState() {
  return {
    themeSource: nativeTheme.themeSource,
    shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
  }
}

async function getState(refresh = false) {
  if (statePromise && !refresh) return await statePromise
  statePromise = (async () => {
    config = await ensureConfig(CONFIG_FILE)
    const [server, probes, plugins] = await Promise.all([
      serverState(refresh),
      probeAgents({ refresh }),
      pluginService.catalog(config),
    ])
    const agents = await processManager.status(config, server)
    return {
      config: publicConfig(config, CONFIG_FILE),
      server,
      agents,
      probes,
      plugins,
      logs: processManager.logs(120),
      app: { version: app.getVersion(), packaged: app.isPackaged },
    }
  })()
  try { return await statePromise } finally { statePromise = null }
}

async function serverState(refresh = false) {
  if (!refresh && serverCache.value && Date.now() - serverCache.at < 2500) return serverCache.value
  const value = await inspectServer(config)
  serverCache = { at: Date.now(), value }
  return value
}

async function rotateDeviceKey() {
  const nextKey = generateDeviceKey()
  config = await writeConfig(mergeConfig(config, { device: { key: nextKey, rotatedAt: new Date().toISOString() } }), CONFIG_FILE)
  for (const type of ['claude', 'codex']) {
    if (processManager.describe(type).running) await processManager.restartAgent(type, config)
  }
  serverCache.at = 0
  processManager.appendLog('warn', `本机设备 key 已重新生成：${fingerprint(nextKey)}；请在服务器控制台替换登记值，并重启 DSH 宿主`, 'security')
  return {
    ok: true,
    fingerprint: fingerprint(nextKey),
    requiresServerRegistration: !!config.server.endpoints[0],
    requiresDshRestart: true,
    state: await getState(true),
  }
}

function sanitizePatch(patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new TypeError('配置更新必须是对象')
  const out = {}
  if (patch.device) out.device = { name: String(patch.device.name || '').trim() }
  if (patch.server) {
    out.server = {
      endpoints: patch.server.endpoints,
      transport: patch.server.transport,
    }
  }
  if (patch.plugins) out.plugins = {
    catalogUrl: String(patch.plugins.catalogUrl || '').trim(),
    installDir: String(patch.plugins.installDir || '').trim(),
  }
  if (patch.agents) {
    out.agents = {}
    for (const type of ['dsh', 'claude', 'codex']) {
      if (!patch.agents[type]) continue
      const value = patch.agents[type]
      out.agents[type] = {
        enabled: value.enabled !== false,
        autoStart: value.autoStart === true,
        locale: ['system', 'zh-CN', 'en-US'].includes(value.locale) ? value.locale : 'system',
        ...(value.defaultCwd !== undefined ? { defaultCwd: String(value.defaultCwd) } : {}),
        ...(value.executable !== undefined ? { executable: String(value.executable) } : {}),
      }
    }
  }
  return out
}

function assertAgent(type) {
  if (!['claude', 'codex', 'dsh'].includes(type)) throw new Error('不支持控制该 Agent')
}

function argumentValue(name) {
  const prefix = `--${name}=`
  const argument = process.argv.find((value) => value.startsWith(prefix))
  return argument ? argument.slice(prefix.length) : ''
}

app.whenReady().then(async () => {
  await initialize()
  createWindow()
  await processManager.startAuto(config)
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
}).catch((error) => {
  console.error(error)
  app.quit()
})

app.on('before-quit', () => { void processManager?.stopAll() })
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
