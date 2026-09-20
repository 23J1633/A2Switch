const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]

const AGENTS = {
  claude: { name: 'Claude Code', plugin: 'cc2server', brand: 'claude' },
  codex: { name: 'Codex', plugin: 'codex2server', brand: 'codex' },
  dsh: { name: 'DeepSeek Harness', plugin: 'dsh2server', brand: 'dsh' },
}

const MESSAGES = {
  'zh-CN': {
    overview: '总览', config: '统一配置', plugins: '插件目录', logs: '运行日志', refreshStatus: '刷新状态', backOverview: '返回总览',
    switchLight: '切换到浅色主题', switchDark: '切换到深色主题', switchLanguage: 'Switch to English', languageChanged: '界面语言已切换为中文',
    serverNotConfigured: '服务器未配置', serverUnreachable: '服务器不可达', serverOnline: '服务器在线 · {count} 个实例',
    overviewTitle: 'Agent 连接总览', overviewSubtitle: '统一查看本机 Agent、桥接插件与服务器连接状态', configureServer: '配置服务器',
    serverNone: '尚未配置服务器', serverReady: '统一服务器连接正常', serverFailed: '无法连接统一服务器', serverHint: '前往统一配置填写 https://host:50443/a2s-api',
    testConnection: '测试连接', serverConnectionOk: '服务器连接正常', serverRegistrationHint: '请在服务器控制台使用管理员 key 登录，再登记这台电脑的本机 key。',
    connected: '已连接', bridgeRunning: '桥接器运行中', disconnected: '未连接', disabled: '已禁用',
    restart: '重启', stop: '停止', startConnection: '启动连接', viewConfig: '查看配置', details: '详情',
    client: '客户端', installed: '已安装', notFound: '未找到', bridgePlugin: '桥接插件', developmentAvailable: '开发版可用', notInstalled: '未安装', instanceId: '实例 ID', localClientMissing: '未检测到本机客户端',
    installUpdatePlugin: '安装/更新插件', restartBridge: '重启桥接器', startBridge: '启动桥接器', runtimeStatus: '运行状态', serverStatus: '服务器状态', online: '在线', offline: '离线', localClient: '本机客户端', bridgeProcess: '桥接进程', hostManaged: '由 DeepSeek Harness 宿主加载', notRunning: '未运行', pluginSource: '插件来源', workspaceDevelopment: '当前工作区开发版', notYetInstalled: '尚未安装', transport: '连接载体', lastActive: '上次活跃',
    unifiedIdentity: '统一身份', unifiedAvatar: '统一头像', device: '设备', deviceId: '设备 ID', sharedKey: '本机设备 key', autoStart: '自动启动', on: '开启', off: '关闭', copyDeviceKey: '复制本机 key', openConfig: '打开统一配置', keyCopied: '本机 key 已复制，请到服务器控制台登记',
    configSubtitle: '三个 Agent 共用服务器地址与本机设备 key；保存后，正在运行的桥接器会自动重启', identitySection: '本机身份', identityHelp: '这台电脑只有一把设备 key，三个 Agent 共用；复制后由服务器所有者在云端控制台登记。', deviceName: '设备名称', keyFingerprint: '本机 key 指纹', keyActions: '密钥操作', copyFullKey: '复制本机 key', rotateTogether: '重新生成本机 key',
    serverSection: '服务器', serverHelp: '本机只配置服务器 API endpoint，例如 http://127.0.0.1:50443/a2s-api。服务器管理员 key 仅保存在服务器及所有者的浏览器中，不应填入 A2Switch。', endpoints: '服务器地址', endpointPlaceholder: 'http://127.0.0.1:50443/a2s-api', addEndpoint: '＋ 添加服务器地址', removeEndpoint: '删除', transportMode: '传输模式', autoRecommended: '自动（推荐）', websocketOnly: '仅 WebSocket', httpOnly: '仅 HTTP 长轮询',
    agentStartup: 'Agent 与启动', agentStartupHelp: '关闭 Agent 不会卸载客户端或插件。DSH 由 Harness 宿主加载，A2Switch 可独立停止、启动或重启它的服务器桥接连接。', enable: '启用', bridgeSuspended: '桥接已停止', pluginLanguage: '插件语言', systemLanguage: '自动（跟随系统）', chineseLanguage: '简体中文', englishLanguage: 'English',
    pluginCatalogSection: '插件目录', pluginCatalogHelp: '目录地址留空时使用应用内置目录；安装目录用于保存一键下载的插件。', onlineCatalogUrl: '在线目录 URL', installDirectory: '安装目录', testServer: '测试服务器', saveConfig: '保存配置', connectionSucceeded: '连接成功', connectionFailed: '连接失败', configSaved: '统一配置已保存',
    pluginsTitle: '插件目录', pluginsSubtitle: '由 A2Switch 直接从 GitHub 安装或更新三个 Agent 桥接插件，无需进入 Agent 手工安装。', installAll: '一键安装/更新全部', installAllComplete: '三个插件均已安装完成', installAllCompleteRestartDsh: '三个插件均已安装；请重启 DeepSeek Harness 宿主以加载新版本', installAllPartial: '已安装 {ok}/3；失败：{failures}', refreshCatalog: '刷新目录', openInstallDirectory: '打开安装目录', catalogRefreshed: '插件目录已刷新', workspaceVersion: '工作区开发版 {version}', installedVersion: '已安装 {version}', source: '源码', reinstall: '重新安装', oneClickInstall: '一键安装', installComplete: '{id} 安装完成', installCompleteRestartDsh: '{id} 安装完成；请重启 DeepSeek Harness 宿主以加载新版本',
    pluginClaude: '通过 Claude Code stream-json 协议提供远程会话、提示词与中断控制。', pluginCodex: '基于 Codex app-server JSON-RPC 接口提供完整远程控制。', pluginDsh: '将 DeepSeek Harness 的会话、工具、审批、工作区与插件能力接入 A2S。',
    logsTitle: '运行日志', logsSubtitle: '显示由 A2Switch 启动的桥接器输出；敏感 key 不会写入日志。', noLogs: '暂时没有日志。', recentLogs: '最近 {count} 条', refresh: '刷新', statusRefreshed: '状态已刷新',
    operationComplete: '操作完成', agentOperationComplete: '{name} 操作完成', rotateConfirm: '确定重新生成本机设备 key？旧连接将失效；之后必须把新 key 重新登记到服务器，DeepSeek Harness 也需要重启宿主。', newKey: '新本机 key：{fingerprint}；请立即到服务器控制台替换登记值',
  },
  'en-US': {
    overview: 'Overview', config: 'Unified settings', plugins: 'Plugin catalog', logs: 'Runtime logs', refreshStatus: 'Refresh status', backOverview: 'Back to overview',
    switchLight: 'Switch to light theme', switchDark: 'Switch to dark theme', switchLanguage: '切换到中文', languageChanged: 'Interface language changed to English',
    serverNotConfigured: 'Server not configured', serverUnreachable: 'Server unreachable', serverOnline: 'Server online · {count} instances',
    overviewTitle: 'Agent connections', overviewSubtitle: 'Manage local Agents, bridge plugins, and server connectivity in one place', configureServer: 'Configure server',
    serverNone: 'No server configured', serverReady: 'Unified server connection is healthy', serverFailed: 'Unable to reach the unified server', serverHint: 'Enter https://host:50443/a2s-api in Unified settings',
    testConnection: 'Test connection', serverConnectionOk: 'Server connection is healthy', serverRegistrationHint: 'Sign in to the server console with its admin key, then register this computer\'s local key there.',
    connected: 'Connected', bridgeRunning: 'Bridge running', disconnected: 'Disconnected', disabled: 'Disabled',
    restart: 'Restart', stop: 'Stop', startConnection: 'Start connection', viewConfig: 'View settings', details: 'Details',
    client: 'Client', installed: 'Installed', notFound: 'Not found', bridgePlugin: 'Bridge plugin', developmentAvailable: 'Development build available', notInstalled: 'Not installed', instanceId: 'Instance ID', localClientMissing: 'Local client not detected',
    installUpdatePlugin: 'Install / update plugin', restartBridge: 'Restart bridge', startBridge: 'Start bridge', runtimeStatus: 'Runtime status', serverStatus: 'Server status', online: 'Online', offline: 'Offline', localClient: 'Local client', bridgeProcess: 'Bridge process', hostManaged: 'Loaded by the DeepSeek Harness host', notRunning: 'Not running', pluginSource: 'Plugin source', workspaceDevelopment: 'Current workspace development build', notYetInstalled: 'Not installed', transport: 'Transport', lastActive: 'Last active',
    unifiedIdentity: 'Unified identity', unifiedAvatar: 'Shared avatar', device: 'Device', deviceId: 'Device ID', sharedKey: 'Local device key', autoStart: 'Auto start', on: 'On', off: 'Off', copyDeviceKey: 'Copy local key', openConfig: 'Open unified settings', keyCopied: 'Local key copied; register it in the server console',
    configSubtitle: 'All three Agents share one server address and local device key; running bridges restart after saving', identitySection: 'Local identity', identityHelp: 'This computer owns one device key shared by all three Agents. Copy it and have the server owner register it in the cloud console.', deviceName: 'Device name', keyFingerprint: 'Local key fingerprint', keyActions: 'Key actions', copyFullKey: 'Copy local key', rotateTogether: 'Regenerate local key',
    serverSection: 'Server', serverHelp: 'This computer only stores the server API endpoint, for example http://127.0.0.1:50443/a2s-api. The server admin key stays on the server and in the owner\'s browser; never enter it in A2Switch.', endpoints: 'Server addresses', endpointPlaceholder: 'http://127.0.0.1:50443/a2s-api', addEndpoint: '+ Add server address', removeEndpoint: 'Remove', transportMode: 'Transport mode', autoRecommended: 'Automatic (recommended)', websocketOnly: 'WebSocket only', httpOnly: 'HTTP long polling only',
    agentStartup: 'Agents and startup', agentStartupHelp: 'Disabling an Agent does not uninstall its client or plugin. DSH is loaded by Harness; A2Switch can independently stop, start, or restart its server bridge.', enable: 'Enabled', bridgeSuspended: 'Bridge stopped', pluginLanguage: 'Plugin language', systemLanguage: 'Automatic (system)', chineseLanguage: 'Simplified Chinese', englishLanguage: 'English',
    pluginCatalogSection: 'Plugin catalog', pluginCatalogHelp: 'Leave the catalog URL empty to use the built-in catalog. Installed plugins are stored in the install directory.', onlineCatalogUrl: 'Online catalog URL', installDirectory: 'Install directory', testServer: 'Test server', saveConfig: 'Save settings', connectionSucceeded: 'Connection succeeded', connectionFailed: 'Connection failed', configSaved: 'Unified settings saved',
    pluginsTitle: 'Plugin catalog', pluginsSubtitle: 'Install or update all three Agent bridges directly from GitHub in A2Switch, without installing them inside each Agent.', installAll: 'Install / update all', installAllComplete: 'All three plugins are installed', installAllCompleteRestartDsh: 'All three plugins are installed; restart the DeepSeek Harness host to load the new version', installAllPartial: 'Installed {ok}/3; failed: {failures}', refreshCatalog: 'Refresh catalog', openInstallDirectory: 'Open install directory', catalogRefreshed: 'Plugin catalog refreshed', workspaceVersion: 'Workspace build {version}', installedVersion: 'Installed {version}', source: 'Source', reinstall: 'Reinstall', oneClickInstall: 'Install', installComplete: '{id} installed', installCompleteRestartDsh: '{id} installed; restart the DeepSeek Harness host to load the new version',
    pluginClaude: 'Remote sessions, prompts, and interrupts through the Claude Code stream-json protocol.', pluginCodex: 'Full remote control through the Codex app-server JSON-RPC interface.', pluginDsh: 'Connects DeepSeek Harness sessions, tools, approvals, workspaces, and plugins to A2S.',
    logsTitle: 'Runtime logs', logsSubtitle: 'Output from bridges started by A2Switch; sensitive keys are never written to logs.', noLogs: 'No logs yet.', recentLogs: 'Latest {count}', refresh: 'Refresh', statusRefreshed: 'Status refreshed',
    operationComplete: 'Operation complete', agentOperationComplete: '{name} operation complete', rotateConfirm: 'Regenerate this computer\'s device key? Existing connections will stop. You must register the new key in the server console, and restart the DeepSeek Harness host.', newKey: 'New local key: {fingerprint}; replace the registered key in the server console now',
  },
}

const query = new URLSearchParams(window.location.search)
let theme = validTheme(query.get('theme')) || validTheme(readPreference('a2s-theme')) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
let locale = validLocale(query.get('locale')) || validLocale(readPreference('a2s-locale')) || (navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US')
document.documentElement.dataset.theme = theme
document.documentElement.lang = locale
const nativeThemeReady = window.a2s.setNativeTheme(theme).catch((error) => console.error('Failed to sync native theme', error))

let state = null
let view = 'overview'
let refreshTimer = null
let busy = false

document.addEventListener('DOMContentLoaded', async () => {
  await nativeThemeReady
  bindNavigation()
  updateShell()
  window.a2s.onLog((item) => {
    if (state) {
      state.logs.push(item)
      if (state.logs.length > 300) state.logs.shift()
      if (view === 'logs') render()
    }
  })
  window.a2s.onStatus(() => void refresh(false))
  await refresh(true)
  refreshTimer = setInterval(() => void refresh(false, true), 4000)
})

window.addEventListener('beforeunload', () => clearInterval(refreshTimer))

function bindNavigation() {
  $$('[data-view]').forEach((button) => button.addEventListener('click', () => { view = button.dataset.view; render() }))
  $('#refreshBtn').addEventListener('click', () => refresh(true))
  $('#themeBtn').addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = theme
    writePreference('a2s-theme', theme)
    void window.a2s.setNativeTheme(theme).catch((error) => console.error('Failed to sync native theme', error))
    updateShell()
  })
  $('#languageBtn').addEventListener('click', () => {
    locale = locale === 'zh-CN' ? 'en-US' : 'zh-CN'
    document.documentElement.lang = locale
    writePreference('a2s-locale', locale)
    render()
    toast(t('languageChanged'), 'ok')
  })
}

async function refresh(manual = false, silent = false) {
  if (busy && !manual) return
  const button = $('#refreshBtn')
  if (manual) button.classList.add('spin')
  try {
    state = await window.a2s.getState()
    render()
    if (manual && !silent) toast(t('statusRefreshed'), 'ok')
  } catch (error) {
    if (!silent) toast(error.message || String(error), 'error')
  } finally {
    button.classList.remove('spin')
  }
}

function render() {
  updateShell()
  if (!state) return
  updateNavigation()
  updateFooter()
  const content = $('#content')
  content.replaceChildren()
  if (view === 'overview') content.append(renderOverview())
  else if (AGENTS[view]) content.append(renderAgentDetail(view))
  else if (view === 'config') content.append(renderConfig())
  else if (view === 'plugins') content.append(renderPlugins())
  else if (view === 'logs') content.append(renderLogs())
}

function updateShell() {
  document.documentElement.lang = locale
  $('#overviewLabel').textContent = t('overview')
  setTitle($('#brandButton'), t('backOverview'))
  setTitle($('#configNav'), t('config'))
  setTitle($('#pluginsNav'), t('plugins'))
  setTitle($('#logsNav'), t('logs'))
  setTitle($('#refreshBtn'), t('refreshStatus'))
  setTitle($('#themeBtn'), t(theme === 'dark' ? 'switchLight' : 'switchDark'))
  $('#themeIcon').className = `uiIcon icon-${theme === 'dark' ? 'sun' : 'moon'}`
  setTitle($('#languageBtn'), t('switchLanguage'))
  $('#languageLabel').textContent = locale === 'zh-CN' ? 'EN' : '中'
  const avatar = $('#profileAvatar')
  if (avatar) {
    avatar.src = state?.server?.avatar?.dataUrl || '../assets/logo-transparent.png'
    avatar.alt = t('unifiedAvatar')
    avatar.title = t('unifiedAvatar')
  }
}

function updateNavigation() {
  $$('.agentTab').forEach((button) => button.classList.toggle('active', button.dataset.view === view))
  $$('.iconBtn[data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === view))
}

function updateFooter() {
  const pill = $('#serverIndicator')
  pill.className = 'statusPill'
  if (!state.server.configured) { pill.textContent = t('serverNotConfigured'); pill.classList.add('muted') }
  else if (!state.server.reachable) { pill.textContent = t('serverUnreachable'); pill.classList.add('bad') }
  else pill.textContent = t('serverOnline', { count: state.server.health?.stats?.online ?? 0 })
  $('#configPath').textContent = state.config.configFile
  $('#configPath').title = state.config.configFile
  $('#appVersion').textContent = `A2Switch ${state.app.version}`
}

function renderOverview() {
  const wrap = el('div')
  wrap.append(pageHead(t('overviewTitle'), t('overviewSubtitle'), [actionButton(t('configureServer'), () => { view = 'config'; render() })]))
  wrap.append(serverCard())
  const grid = el('div', { className: 'grid overviewGrid' })
  for (const type of ['claude', 'codex', 'dsh']) grid.append(agentCard(type))
  wrap.append(grid)
  return wrap
}

function serverCard() {
  const server = state.server
  const status = !server.configured ? t('serverNone') : server.reachable ? t('serverReady') : t('serverFailed')
  const endpoint = server.endpoint || t('serverHint')
  return el('section', { className: 'card serverCard' }, [
    el('div', { className: 'serverMain' }, [el('div', { className: 'serverIcon' }, [uiIcon('server')]), el('div', {}, [el('div', { className: 'serverTitle', textContent: status }), el('div', { className: 'serverEndpoint', textContent: endpoint, title: endpoint }), el('div', { className: 'serverEndpoint', textContent: t('serverRegistrationHint') })])]),
    el('div', { className: 'serverActions' }, [
      actionButton(t('testConnection'), () => perform(async () => { state.server = await window.a2s.testServer(); render(); toast(state.server.reachable ? t('serverConnectionOk') : state.server.error, state.server.reachable ? 'ok' : 'error') })),
      actionButton(t('copyDeviceKey'), () => perform(async () => { await window.a2s.copyKey(); toast(t('keyCopied'), 'ok') }), 'primary'),
    ].filter(Boolean)),
  ])
}

function agentCard(type) {
  const meta = AGENTS[type]
  const item = state.agents[type]
  const probe = state.probes[type]
  const plugin = state.plugins.find((entry) => entry.id === meta.plugin)
  const processRunning = type === 'dsh' ? item.runtime?.running && !item.runtime?.suspended : item.process?.running
  const badgeClass = item.connected ? 'online' : processRunning ? 'running' : ''
  const badgeText = item.connected ? t('connected') : processRunning ? t('bridgeRunning') : item.enabled ? t('disconnected') : t('disabled')
  const controls = []
  if (type !== 'dsh') {
    if (processRunning) {
      controls.push(actionButton(t('restart'), () => agentAction('restart', type)))
      controls.push(actionButton(t('stop'), () => agentAction('stop', type), 'danger'))
    } else if (!item.connected) {
      controls.push(actionButton(t('startConnection'), () => agentAction('start', type), 'primary', !item.enabled || (!plugin?.developmentAvailable && !plugin?.installed)))
    }
  } else if (item.runtime?.running && !item.runtime?.suspended) {
    controls.push(actionButton(t('restart'), () => agentAction('restart', type)))
    controls.push(actionButton(t('stop'), () => agentAction('stop', type), 'danger'))
  } else if (item.runtime?.running) {
    controls.push(actionButton(t('startConnection'), () => agentAction('start', type), 'primary'))
  } else controls.push(actionButton(t('viewConfig'), () => { view = 'dsh'; render() }))
  controls.push(actionButton(t('details'), () => { view = type; render() }, 'ghost'))
  return el('article', { className: 'card agentCard' }, [
    el('div', { className: 'agentCardHead' }, [
      el('div', { className: `agentLogo ${type}` }, [brandIcon(type)]),
      el('div', { className: 'spacer' }, [el('div', { className: 'agentTitle', textContent: meta.name }), el('div', { className: 'agentVersion', textContent: probe?.installed ? probe.version : t('localClientMissing') })]),
      el('span', { className: `badge ${badgeClass}`, textContent: badgeText }),
    ]),
    el('div', { className: 'agentMeta' }, [
      metaRow(t('client'), probe?.installed ? t('installed') : t('notFound')),
      metaRow(t('bridgePlugin'), plugin?.installed ? t('installedVersion', { version: plugin.installedVersion || '' }) : plugin?.developmentAvailable ? t('developmentAvailable') : t('notInstalled')),
      metaRow(t('instanceId'), item.instanceId),
    ]),
    el('div', { className: 'cardActions' }, controls),
  ])
}

function renderAgentDetail(type) {
  const meta = AGENTS[type]
  const item = state.agents[type]
  const probe = state.probes[type]
  const plugin = state.plugins.find((entry) => entry.id === meta.plugin)
  const wrap = el('div')
  wrap.append(pageHead(meta.name, `${meta.plugin} · ${item.instanceId}`, [actionButton(t('backOverview'), () => { view = 'overview'; render() })]))
  const controls = type === 'dsh'
    ? [
        ...(item.runtime?.running && !item.runtime?.suspended
          ? [actionButton(t('restartBridge'), () => agentAction('restart', type), 'primary'), actionButton(t('stop'), () => agentAction('stop', type), 'danger')]
          : item.runtime?.running
            ? [actionButton(t('startBridge'), () => agentAction('start', type), 'primary')]
            : []),
        actionButton(t('installUpdatePlugin'), () => installPlugin(meta.plugin)),
      ]
    : item.process?.running
      ? [actionButton(t('restartBridge'), () => agentAction('restart', type), 'primary'), actionButton(t('stop'), () => agentAction('stop', type), 'danger')]
      : item.connected ? [] : [actionButton(t('startBridge'), () => agentAction('start', type), 'primary')]
  wrap.append(el('div', { className: 'detailLayout' }, [
    el('section', { className: 'card panel' }, [
      el('h2', { textContent: t('runtimeStatus') }),
      el('div', { className: 'facts' }, [
        fact(t('serverStatus'), item.connected ? t('online') : t('offline')),
        fact(t('localClient'), probe?.installed ? probe.version : probe?.error || t('notFound')),
        fact(t('bridgeProcess'), type === 'dsh' ? item.runtime?.running ? `${item.runtime.suspended ? `${t('bridgeSuspended')} · ` : ''}PID ${item.runtime.pid} · ${t('hostManaged')}` : t('notRunning') : item.process?.running ? `PID ${item.process.pid}` : item.runtime?.running ? `PID ${item.runtime.pid}` : t('notRunning')),
        fact(t('pluginSource'), plugin?.installedPath || (plugin?.developmentAvailable ? t('workspaceDevelopment') : t('notYetInstalled'))),
        fact(t('transport'), item.server?.transport || item.runtime?.endpoints?.find((entry) => entry.state === 'connected')?.transport || '—'),
        fact(t('lastActive'), item.server?.lastSeenAt ? formatDate(item.server.lastSeenAt) : item.runtime?.updatedAt ? formatDate(item.runtime.updatedAt) : '—'),
      ]),
      controls.length ? el('div', { className: 'cardActions' }, controls) : null,
    ]),
    el('section', { className: 'card panel' }, [
      el('h2', { textContent: t('unifiedIdentity') }),
      el('div', { className: 'facts' }, [fact(t('device'), state.config.device.name), fact(t('deviceId'), state.config.device.id, true), fact(t('instanceId'), item.instanceId, true), fact(t('sharedKey'), state.config.device.keyFingerprint, true), fact(t('autoStart'), item.autoStart ? t('on') : t('off'))]),
      el('div', { className: 'cardActions' }, [actionButton(t('copyDeviceKey'), () => perform(async () => { await window.a2s.copyKey(); toast(t('keyCopied'), 'ok') })), actionButton(t('openConfig'), () => { view = 'config'; render() })]),
    ]),
  ]))
  return wrap
}

function renderConfig() {
  const cfg = state.config
  const wrap = el('div')
  wrap.append(pageHead(t('config'), t('configSubtitle')))
  const form = el('form', { className: 'card formCard', id: 'configForm' })
  form.append(formSection(t('identitySection'), t('identityHelp'), [
    field(t('deviceName'), input('deviceName', cfg.device.name)), field(t('deviceId'), input('deviceId', cfg.device.id, { disabled: true })), field(t('keyFingerprint'), input('keyFingerprint', cfg.device.keyFingerprint, { disabled: true })),
    el('div', { className: 'field' }, [el('span', { textContent: t('keyActions') }), el('div', { className: 'cardActions' }, [actionButton(t('copyFullKey'), () => perform(async () => { await window.a2s.copyKey(); toast(t('keyCopied'), 'ok') })), actionButton(t('rotateTogether'), () => confirmRotate(), 'danger')])]),
  ]))
  form.append(formSection(t('serverSection'), t('serverHelp'), [fieldGroup(t('endpoints'), endpointEditor(cfg.server.endpoints), true), field(t('transportMode'), select('transport', [['auto', t('autoRecommended')], ['ws', t('websocketOnly')], ['http', t('httpOnly')]], cfg.server.transport))]))
  form.append(formSection(t('agentStartup'), t('agentStartupHelp'), ['claude', 'codex', 'dsh'].map((type) => {
    const agent = cfg.agents[type]
    return el('div', { className: 'switchRow' }, [
      el('label', { textContent: `${AGENTS[type].name} · ${agent.instanceId}` }),
      el('div', { className: 'cardActions' }, [
        el('label', { className: 'inlineSelectLabel' }, [
          el('span', { textContent: t('pluginLanguage') }),
          select(`${type}Locale`, [['system', t('systemLanguage')], ['zh-CN', t('chineseLanguage')], ['en-US', t('englishLanguage')]], agent.locale || 'system'),
        ]),
        checkbox(`${type}Enabled`, agent.enabled, t('enable')),
        checkbox(`${type}AutoStart`, agent.autoStart, t('autoStart'), type === 'dsh'),
      ]),
    ])
  }), true))
  form.append(formSection(t('pluginCatalogSection'), t('pluginCatalogHelp'), [field(t('onlineCatalogUrl'), input('catalogUrl', cfg.plugins.catalogUrl, { placeholder: 'https://…/catalog.json' }), true), field(t('installDirectory'), input('installDir', cfg.plugins.installDir), true)]))
  form.append(el('div', { className: 'formFooter' }, [actionButton(t('testServer'), () => perform(async () => { const out = await window.a2s.testServer(); toast(out.reachable ? t('connectionSucceeded') : out.error || t('connectionFailed'), out.reachable ? 'ok' : 'error') })), actionButton(t('saveConfig'), () => saveConfig(form), 'primary')]))
  form.addEventListener('submit', (event) => event.preventDefault())
  wrap.append(form)
  return wrap
}

function renderPlugins() {
  const wrap = el('div')
  const installAllButton = actionButton(t('installAll'), installAllPlugins, 'primary')
  installAllButton.id = 'installAllPluginsButton'
  wrap.append(pageHead(t('pluginsTitle'), t('pluginsSubtitle'), [installAllButton, actionButton(t('refreshCatalog'), () => perform(async () => { state.plugins = await window.a2s.plugins(true); render(); toast(t('catalogRefreshed'), 'ok') })), actionButton(t('openInstallDirectory'), () => window.a2s.openPath(state.config.plugins.installDir))]))
  const list = el('div', { className: 'pluginList' })
  for (const plugin of state.plugins) {
    const meta = AGENTS[plugin.agentType]
    const status = plugin.installed ? t('installedVersion', { version: plugin.installedVersion || '' }) : plugin.developmentAvailable ? t('workspaceVersion', { version: plugin.developmentVersion || '' }) : t('notYetInstalled')
    list.append(el('article', { className: 'card pluginCard' }, [
      el('div', { className: `pluginIcon ${plugin.agentType || ''}` }, meta ? [brandIcon(plugin.agentType)] : []),
      el('div', {}, [el('div', { className: 'pluginName', textContent: plugin.name || plugin.id }), el('div', { className: 'pluginDesc', textContent: pluginDescription(plugin) }), el('div', { className: 'pluginMeta', textContent: `${plugin.id} · ${status}` })]),
      el('div', { className: 'pluginActions' }, [plugin.repository ? actionButton(t('source'), () => window.a2s.openExternal(plugin.repository), 'ghost') : null, actionButton(plugin.installed ? t('reinstall') : t('oneClickInstall'), () => installPlugin(plugin.id), 'primary')].filter(Boolean)),
    ]))
  }
  wrap.append(list)
  return wrap
}

function renderLogs() {
  const wrap = el('div')
  wrap.append(pageHead(t('logsTitle'), t('logsSubtitle')))
  const output = el('pre', { className: 'logOutput' })
  if (!state.logs.length) output.textContent = t('noLogs')
  for (const item of state.logs) output.append(el('span', { className: `logLine ${item.level || ''}`, textContent: `${new Date(item.at).toLocaleTimeString(locale)} [${item.source}] ${item.message}\n` }))
  wrap.append(el('section', { className: 'card logCard' }, [el('div', { className: 'logToolbar' }, [el('strong', { textContent: t('recentLogs', { count: state.logs.length }) }), actionButton(t('refresh'), () => refresh(true))]), output]))
  queueMicrotask(() => { output.scrollTop = output.scrollHeight })
  return wrap
}

async function saveConfig(form) {
  const value = (name) => form.elements.namedItem(name)?.value ?? ''
  const checked = (name) => !!form.elements.namedItem(name)?.checked
  const endpoints = [...form.querySelectorAll('[name="endpoint"]')].map((control) => control.value.trim()).filter(Boolean)
  const server = { endpoints, transport: value('transport') }
  const patch = { device: { name: value('deviceName') }, server, agents: Object.fromEntries(['claude', 'codex', 'dsh'].map((type) => [type, { enabled: checked(`${type}Enabled`), autoStart: checked(`${type}AutoStart`), locale: value(`${type}Locale`) || 'system' }])), plugins: { catalogUrl: value('catalogUrl'), installDir: value('installDir') } }
  await perform(async () => { state = await window.a2s.saveConfig(patch); render(); toast(t('configSaved'), 'ok') })
}

async function agentAction(action, type) {
  await perform(async () => { const fn = action === 'start' ? window.a2s.startAgent : action === 'stop' ? window.a2s.stopAgent : window.a2s.restartAgent; state = await fn(type); render(); toast(t('agentOperationComplete', { name: AGENTS[type].name }), 'ok') })
}

async function installPlugin(id) {
  await perform(async () => { const out = await window.a2s.installPlugin(id); state.plugins = out.plugins; render(); toast(t(out.result?.restartRequired ? 'installCompleteRestartDsh' : 'installComplete', { id }), 'ok') })
}

async function installAllPlugins() {
  await perform(async () => {
    const out = await window.a2s.installAllPlugins()
    state.plugins = out.plugins
    render()
    if (out.failures.length) {
      const failures = out.failures.map((item) => `${item.id}: ${item.message}`).join('; ')
      toast(t('installAllPartial', { ok: out.results.length, failures }), 'error')
      return
    }
    toast(t(out.results.some((item) => item.restartRequired) ? 'installAllCompleteRestartDsh' : 'installAllComplete'), 'ok')
  })
}

async function confirmRotate() {
  if (!window.confirm(t('rotateConfirm'))) return
  await perform(async () => { const out = await window.a2s.rotateKey(); state = out.state; render(); toast(t('newKey', { fingerprint: out.fingerprint }), 'ok') })
}

async function perform(operation) {
  if (busy) return
  busy = true
  document.body.classList.add('busy')
  try { await operation() } catch (error) { toast(error.message || String(error), 'error') } finally { busy = false; document.body.classList.remove('busy') }
}

function pageHead(title, subtitle, actions = []) { return el('div', { className: 'pageHead' }, [el('div', {}, [el('h1', { textContent: title }), el('p', { textContent: subtitle })]), actions.length ? el('div', { className: 'headActions' }, actions) : null].filter(Boolean)) }
function metaRow(label, value) { return el('div', { className: 'metaRow' }, [el('span', { textContent: label }), el('strong', { textContent: value || '—', title: value || '' })]) }
function fact(label, value, code = false) { return el('div', { className: 'fact' }, [el('span', { textContent: label }), el(code ? 'code' : 'strong', { textContent: value || '—' })]) }
function actionButton(label, onClick, variant = '', disabled = false) { const button = el('button', { type: 'button', className: `btn ${variant}`, textContent: label, disabled }); button.addEventListener('click', onClick); return button }
function formSection(title, description, children, full = false) { return el('section', { className: 'formSection' }, [el('h2', { textContent: title }), el('p', { textContent: description }), el('div', { className: `formGrid ${full ? 'full' : ''}` }, children)]) }
function field(label, control, full = false) { return el('label', { className: `field ${full ? 'full' : ''}` }, [el('span', { textContent: label }), control]) }
function fieldGroup(label, control, full = false) { return el('div', { className: `field ${full ? 'full' : ''}` }, [el('span', { textContent: label }), control]) }
function input(name, value, options = {}) { return el('input', { className: 'input', name, value: value ?? '', ...options }) }
function select(name, choices, selected) { const control = el('select', { className: 'select', name }); for (const [value, label] of choices) control.append(el('option', { value, textContent: label, selected: value === selected })); return control }
function checkbox(name, checked, label, disabled = false) { return el('label', { className: 'cardActions' }, [el('input', { type: 'checkbox', name, checked, disabled }), el('span', { textContent: label })]) }
function brandIcon(type) { return el('span', { className: `brandIcon brand-${AGENTS[type]?.brand || type}`, role: 'img', 'aria-label': AGENTS[type]?.name || type }) }
function uiIcon(name) { return el('span', { className: `uiIcon icon-${name}`, 'aria-hidden': 'true' }) }

function endpointEditor(values) {
  const list = el('div', { className: 'endpointList' })
  const addRow = (value = '') => {
    const control = input('endpoint', value, { placeholder: t('endpointPlaceholder'), autocomplete: 'url', spellcheck: 'false', 'aria-label': t('endpoints') })
    const remove = actionButton(t('removeEndpoint'), () => {
      row.remove()
      if (!list.children.length) addRow().focus()
    }, 'danger endpointRemove')
    const row = el('div', { className: 'endpointRow' }, [control, remove])
    list.append(row)
    return control
  }
  for (const value of values?.length ? values : ['']) addRow(value)
  const add = actionButton(t('addEndpoint'), () => addRow().focus(), 'endpointAdd')
  add.id = 'addEndpointButton'
  return el('div', { className: 'endpointEditor' }, [list, el('div', { className: 'endpointActions' }, [add])])
}

function pluginDescription(plugin) {
  const key = { cc2server: 'pluginClaude', codex2server: 'pluginCodex', dsh2server: 'pluginDsh' }[plugin.id]
  return key ? t(key) : plugin.description || ''
}

function toast(message, tone = '') { const item = el('div', { className: `toast ${tone}`, textContent: message || t('operationComplete') }); $('#toastHost').append(item); setTimeout(() => item.remove(), 3500) }
function t(key, values = {}) { const template = MESSAGES[locale]?.[key] ?? MESSAGES['zh-CN'][key] ?? key; return String(template).replace(/\{(\w+)\}/g, (_match, name) => values[name] ?? '') }
function formatDate(value) { const date = typeof value === 'number' ? new Date(value) : new Date(String(value)); return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString(locale) }
function setTitle(node, value) { node.title = value; node.setAttribute('aria-label', value) }
function readPreference(key) { try { return localStorage.getItem(key) } catch { return null } }
function writePreference(key, value) { try { localStorage.setItem(key, value) } catch { /* Preferences remain active for this window. */ } }
function validTheme(value) { return ['light', 'dark'].includes(value) ? value : null }
function validLocale(value) { return ['zh-CN', 'en-US'].includes(value) ? value : null }

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(props)) {
    if (key === 'className') node.className = value
    else if (key === 'textContent') node.textContent = value
    else if (key === 'value') node.value = value
    else if (key === 'checked') node.checked = value
    else if (key === 'selected') node.selected = value
    else if (key === 'disabled') node.disabled = value
    else if (value != null) node.setAttribute(key, value)
  }
  const list = Array.isArray(children) ? children : [children]
  for (const child of list) if (child) node.append(child)
  return node
}
