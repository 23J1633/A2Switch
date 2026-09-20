[中文](#中文) | [English](#english)

# A2Switch

## 中文

## A2S 生态（同系列开源仓库）

A2S 按组件拆分为以下同系列仓库，所有者均为 `23J1633`。/ A2S is split into the following sibling repositories, all owned by `23J1633`.

| 仓库 / Repository | 作用 / Role | GitHub |
|---|---|---|
| A2Switch | Windows 桌面控制中心 / Windows desktop control center | [23J1633/A2Switch](https://www.github.com/23J1633/A2Switch) |
| cc2server | Claude Code 桥接器 / Claude Code bridge | [23J1633/cc2server](https://www.github.com/23J1633/cc2server) |
| codex2server | Codex 桥接器 / Codex bridge | [23J1633/codex2server](https://www.github.com/23J1633/codex2server) |
| dsh2server | DeepSeek Harness 插件 / DeepSeek Harness plugin | [23J1633/dsh2server](https://www.github.com/23J1633/dsh2server) |
| server-api | 中转服务与 Web 控制台 / relay server and Web console | [23J1633/server-api](https://www.github.com/23J1633/server-api) |
| a2s_app | Flutter Android 客户端 / Flutter Android client | [23J1633/a2s_app](https://www.github.com/23J1633/a2s_app) |
| scripts | 跨仓库验收脚本 / cross-repository acceptance scripts | [23J1633/scripts](https://www.github.com/23J1633/scripts) |
| ICON | A2S 品牌源图 / A2S brand source artwork | [23J1633/ICON](https://www.github.com/23J1633/ICON) |
| artifacts | 脱敏交付验证产物 / sanitized delivery evidence | [23J1633/artifacts](https://www.github.com/23J1633/artifacts) |

A2Switch 是 A2S 的本机桌面控制中心。它使用 Electron 实现，界面布局参考 CC Switch，但数据模型与操作面向 Claude Code、Codex、DeepSeek Harness 三种 Agent。

它负责四件事：

- 创建和维护一份跨桥接器共享的设备配置与设备 key；
- 检测本机 Agent 环境，统一展示本机进程与服务器在线状态；
- 启动、停止、重启 `cc2server` 与 `codex2server`，并在不终止 Harness 宿主的前提下启停/重连 `dsh2server`；
- 从内置或远程插件目录一键安装/更新三个桥接器。

## 运行

要求 Node.js 22+。开发环境：

```powershell
cd D:\Project\A2S\A2Switch
npm install
npm start
```

诊断本机 Agent：

```powershell
npm run doctor
npm run icon
```

生成未安装目录包或 Windows 安装包：

```powershell
npm run pack
npm run dist
```

`pack` 输出可直接运行的目录；`dist` 同时生成 `A2Switch-Setup-<version>-<arch>.exe` 与 `A2Switch-Portable-<version>-<arch>.exe`。
`icon` 校验项目方提供的白底方形 PNG 是否能用于 Windows 打包；它不会重新绘制或覆盖原始素材。

## 页面与操作

### 总览

- 展示服务器健康状态、同设备下三个 Agent 的在线状态、桥接进程 PID 与插件版本。
- 顶部标签可快速聚焦 Claude、Codex 或 DSH。
- 状态同时参考 A2Switch 管理的子进程、桥接器写入的 runtime 文件和 server-api 返回的实例列表。
- 能识别并接管从已安装目录手工启动的 Claude/Codex 桥接进程，避免自动启动时产生重复实例。
- Windows 独立部署会优先识别 `D:\dsh\dsh.cmd` 启动包装器，确保插件注册使用实际 `DSH_HOME`，不会误装进用户目录下的另一个空 profile。
- DSH 卡片提供“重启/停止”；停止只关闭服务器桥接，Harness Web UI 与本机会话继续运行。停止后同一位置变为“启动连接”。

### 外观与语言

- 顶栏太阳/月亮按钮可即时切换浅色与深色主题，选择会保存在 Electron 的本机存储中。
- 页面主题会同步到 Electron 原生窗口主题，因此 Windows 标题栏、最小化/最大化/关闭按钮所在区域也会随深浅色切换，不再出现浅色页面配黑色标题栏。
- 未保存语言偏好时，首次启动会读取操作系统语言：中文环境使用简体中文，其余环境使用 English。
- 顶栏语言按钮可在简体中文与 English 间即时切换，所有主要页面、状态、表单、操作和提示均会同步更新。
- “统一配置”里 Claude、Codex、DSH 各有独立的“插件语言”选项，可设为自动跟随系统、简体中文或 English；这不会强制改变 A2Switch 自身的界面语言。
- Agent 使用 Claude、OpenAI 与 DeepSeek 的真实品牌图形；通用管理图标来自 Lucide。来源与许可记录在 [`assets/brands/README.md`](assets/brands/README.md) 和 [`assets/icons/README.md`](assets/icons/README.md)。
- 品牌 SVG 使用固定方形画布、等比 `contain` 蒙版和不可压缩的 flex 尺寸；窗口变窄或状态文字变长时不会横向挤压变形。UI 冒烟会校验每个品牌图标和 logo 底座的实际宽高。
- A2Switch 自身的窗口/任务栏/安装器图标与应用内品牌标识全部使用项目方放在仓库根目录 `ICON` 下的白底版和透明版素材，映射说明见 [`assets/README.md`](assets/README.md)。

### 统一配置

- 编辑设备名称、服务器端点和传输方式；每个服务器地址使用独立单行输入框，可逐项添加或删除。A2Switch 不接收也不保存服务器管理员 key。
- 编辑每个 Agent 的启用、自动启动、可执行文件、默认工作目录与实例 ID。
- 保存优先使用同目录临时文件 + rename 原子替换；Windows EFS 返回 `EXDEV` 时自动改用带备份、刷盘与回滚的安全复制流程。
- 「复制本机 key」用于交给服务器所有者在云端控制台登记；「轮换 key」只在本机生成新值，随后必须在服务器控制台替换旧登记。Claude/Codex 自动重启，DSH 宿主需要手工重启一次。
- UI 不回显设备 key，只展示指纹；完整设备 key 仅通过受限主进程 IPC 复制，不写入 DOM 或日志。服务器管理员 key 只存在服务器数据目录及所有者的浏览器会话中。

### 插件

- 默认内置 `dsh2server`、`cc2server`、`codex2server` 三项。
- 「一键安装/更新全部」会依次安装三个桥接器；单个插件也仍可独立安装或更新。
- 可配置远程 `catalogUrl`；读取失败时回退内置目录并显示告警。
- 本仓库开发目录存在时优先从本地复制；正式环境直接下载 GitHub 默认分支 ZIP，不要求用户安装 Git。
- 安装使用独立 staging 目录；校验 `package.json` 与桥接器入口后再原子换入目标目录。
- 更新已存在的插件会保留 `.backup-<id>-<time>` 备份。
- 复制时排除 `.git`、`node_modules`、`dist`；运行依赖使用 `npm install --omit=dev --ignore-scripts` 安装。
- `dsh2server` 由 A2Switch 自动执行 `dsh plugin --profile web add <path>` 完成宿主注册；可用 `A2S_DSH_PROFILE` 改为其他 profile。如果 DSH 已在运行，注册新版本后需重启一次 Harness 宿主。

### 日志

主进程保存最近 1000 条 A2Switch/桥接器日志，UI 可查看最近记录。日志只存在于当前应用进程内；桥接器的持久运行状态另写到共享配置目录的 `runtime/*.json`。

DSH 的本地控制使用同一目录中的 `runtime/dsh.json` 与 `runtime/dsh-control.json`。控制文件只包含一次性操作 ID、动作和实例 ID，不含设备 key；`dsh2server` 处理后会写入确认状态。该机制只暂停或重建中继连接，不结束 Harness 进程。

## 共享配置

默认文件：

- Windows：`%APPDATA%\A2S\config.json`
- macOS：`~/Library/Application Support/A2S/config.json`
- Linux：`${XDG_CONFIG_HOME:-~/.config}/a2s/config.json`

环境变量：

| 变量 | 作用 |
|---|---|
| `A2S_CONFIG_PATH` | 指定完整配置文件路径 |
| `A2S_CONFIG_DIR` | 指定配置目录；文件名仍为 `config.json` |

首次运行自动创建：

```json
{
  "version": 1,
  "device": {
    "id": "a2s-0123456789ab",
    "name": "workstation",
    "key": "a2sk_...",
    "createdAt": "2026-09-17T00:00:00.000Z"
  },
  "server": {
    "endpoints": [],
    "transport": "auto"
  },
  "agents": {
    "dsh": { "enabled": true, "autoStart": false, "locale": "system", "instanceId": "a2s-0123456789ab:dsh" },
    "claude": { "enabled": true, "autoStart": true, "locale": "system", "instanceId": "a2s-0123456789ab:claude" },
    "codex": { "enabled": true, "autoStart": true, "locale": "system", "instanceId": "a2s-0123456789ab:codex" }
  },
  "plugins": {
    "catalogUrl": "",
    "installDir": "..."
  }
}
```

不要把真实配置提交到版本控制。`device.key` 可控制该设备上的 Agent；服务器管理员 key 不属于本机共享配置。

## 远程插件目录

目录响应必须是 JSON，并包含 `plugins` 数组：

```json
{
  "plugins": [
    {
      "id": "codex2server",
      "name": "Codex Bridge",
      "agentType": "codex",
      "description": "Connect Codex to A2S",
      "repository": "https://github.com/example/codex2server.git",
      "archive": "https://example.com/codex2server.zip",
      "ref": "main",
      "subdir": ""
    }
  ]
}
```

`id` 只接受字母、数字、点、下划线与短横线。`repository` 必须是 HTTPS GitHub 仓库；如果指定 `archive`，必须是 HTTPS ZIP 地址。安装路径在解析后必须仍位于 `plugins.installDir` 内，避免目录穿越。

## 安全实现

- Electron `contextIsolation` 与 renderer sandbox 已启用，Node API 不暴露给页面。
- preload 只公开白名单 IPC 方法，所有文件路径在主进程校验。
- 页面有内容安全策略，不加载任意远程脚本。
- 打开本机路径前要求目标位于共享配置目录、插件目录或项目允许目录内。
- 远程插件限制为 HTTPS，压缩包上限 50 MB；npm 安装禁用生命周期脚本。
- server-api 的管理请求由云端控制台使用 `x-admin-key`，不会把管理密钥拼进 URL；A2Switch 不发起管理请求。

## 测试

```powershell
npm test
npm run test:install-all
npm run doctor
$env:A2S_ADMIN_KEY = '<仅从服务器本机读取的管理员密钥>'
npm run test:dsh-control
Remove-Item Env:A2S_ADMIN_KEY
```

自动化测试覆盖：共享 key 与三个实例 ID、旧管理字段清理、配置合并、端点归一化、GitHub ZIP 地址校验、插件 staging/校验/原子替换及备份。`npm run test:install-all` 会在当前电脑上真实重装三个插件并调用 DSH 宿主注册，只应在集成验收时手动运行。

Electron UI 冒烟测试可以直接运行：

```powershell
.\node_modules\.bin\electron.cmd . --smoke-test --theme=light --locale=en-US
.\node_modules\.bin\electron.cmd . --smoke-test --theme=dark --locale=zh-CN
```

测试模式会加载真实窗口、等待渲染完成、验证网页与原生窗口主题同步、语言按钮可切换且可恢复、服务器地址可动态添加/删除并检查品牌图标，然后保存截图并自动退出。`npm run test:dsh-control` 会在真实本机安装上依次执行停止、启动和重启，并使用单独的 `A2S_ADMIN_KEY` 确认服务器离线/上线且 Harness PID 始终不变；管理员密钥不会写入工作站配置，该真实环境测试与普通 `npm test` 隔离。

## 目录结构

```text
A2Switch/
├─ main.js                 Electron 主进程与 IPC
├─ preload.cjs             renderer 安全桥
├─ lib/
│  ├─ config-service.js    共享配置与 key
│  ├─ fs-portable.js       Windows EFS/跨卷安全替换
│  ├─ plugin-service.js    插件目录及原子安装
│  ├─ process-manager.js   桥接进程与状态聚合
│  ├─ server-client.js     server-api 管理客户端
│  └─ system-probe.js      Claude/Codex/DSH 环境探测
├─ renderer/               无框架 HTML/CSS/JS 界面
├─ assets/brands/          Agent 品牌图标与来源说明
├─ assets/icons/           Lucide 管理图标与许可说明
├─ scripts/doctor.js       命令行环境诊断
├─ scripts/dsh-control-test.js  DSH 桥接真实启停闭环
└─ test/                   Node 测试
```

## 已知边界

- DSH 的启动模式由 profile 与宿主形态决定，因此 A2Switch 不强行启动/终止 DSH 主进程；安装新版插件并启动一次宿主后，可以独立停止、启动和重启它的服务器桥接连接。
- `launchAtLogin`、`startMinimized`、`closeToTray` 已保留在配置模型中；当前版本尚未注册系统开机项或托盘菜单。
- 当前打包配置以 Windows 为主要交付目标；在 macOS/Linux 打包前应补对应图标、签名与发行配置。

## 许可证

代码采用 MIT License，见 `LICENSE`。当前 Windows 发行文件未配置商业代码签名证书，发布者应在分发前完成签名；第三方智能体名称与品牌图标属于各自权利人，仅用于兼容性标识。

---

## English

A2Switch is the Electron desktop control center for A2S. It maintains one workstation identity and device key, discovers Claude Code/Codex/DeepSeek Harness, manages bridge processes and connection status, and installs all bridge plugins without asking users to install them inside each Agent.

### Run and package

Node.js 22+ is required.

```powershell
npm install
npm start
npm test
npm run doctor
npm run dist
```

`npm run dist` produces Windows installer and portable executables. `npm run test:install-all` is a destructive integration acceptance command: it really reinstalls all three local plugins and registers the DSH plugin, so run it manually only on a testable workstation.

### Interface

- **Overview:** server health, local Agent discovery, bridge process/runtime state, instance IDs, and installed versions.
- **Agent pages:** bridge start/stop/restart, connection transport, last activity, and source location.
- **Unified settings:** device name, multiple server endpoints, transport, per-Agent enable/auto-start/locale, and plugin catalog/install directory.
- **Plugins:** install/update one bridge or all three in one action.
- **Logs:** the latest in-memory process and bridge output, with credentials excluded.

The UI follows the operating-system language on first launch and can switch between Simplified Chinese and English. Light/dark selection also updates the native Electron window theme. The administrator key is intentionally absent from workstation settings; A2Switch only exposes the local device key through a restricted clipboard action.

### One-click plugin installation

Built-in repositories are:

- `https://github.com/23J1633/cc2server`
- `https://github.com/23J1633/codex2server`
- `https://github.com/23J1633/dsh2server`

The packaged application downloads the default-branch GitHub ZIP, enforces HTTPS and a 50 MiB limit, extracts into a staging directory, validates `package.json` and bridge entry points, installs production dependencies with lifecycle scripts disabled when needed, and atomically replaces the target while preserving a recoverable backup. Git is not required. A source checkout uses sibling workspace projects for development acceptance.

Claude/Codex bridges are stopped and restarted around an update when necessary. A2Switch registers DSH with `dsh plugin --profile web add <path>`; set `A2S_DSH_PROFILE` to use another profile. A running Harness host must be restarted once to load newly registered code.

Remote catalogs return a `plugins` array. IDs are restricted to safe filename characters. `repository` must be an HTTPS GitHub URL; an optional `archive` must be HTTPS. Resolved install paths must remain inside `plugins.installDir`.

### Shared configuration and security

Default configuration locations are `%APPDATA%\A2S\config.json`, `~/Library/Application Support/A2S/config.json`, and `${XDG_CONFIG_HOME:-~/.config}/a2s/config.json`. Writes use an atomic replace with a Windows-safe backup/copy fallback. Electron context isolation, renderer sandboxing, CSP, an IPC allowlist, path containment checks, HTTPS-only remote packages, archive size limits, and disabled npm lifecycle scripts reduce the local attack surface.

### Known limits

A2Switch controls the DSH relay connection but does not terminate the Harness host. Login-start, minimized-start, and tray configuration fields are reserved but not yet wired to operating-system integration. Current packaging is Windows-first; macOS/Linux releases still need platform icons, signing, and distribution configuration.

### License

MIT. Windows binaries are not yet commercially code-signed. Third-party Agent names and marks are used only to identify compatible integrations and remain owned by their respective rights holders.
