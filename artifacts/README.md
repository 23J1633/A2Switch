[中文](#中文) | [English](#english)

# A2Switch artifacts

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

- `ui-overview-0.3.3.png`：源码模式总览，包含 DSH 的真实“重启/停止”控制。
- `ui-config-0.3.3.png`：源码模式统一配置，包含独立服务器地址输入框及添加/删除操作。
- `native-titlebar-light-0.3.3.png`：通过 Windows 原生窗口句柄抓取，验证浅色模式的原生标题栏不再为黑色。
- `ui-unpacked-final-0.3.3.png`、`ui-unpacked-config-final-0.3.3.png`：直接运行 `dist/win-unpacked/A2Switch.exe --smoke-test` 生成的 0.3.3 成品验收图。
- `ui-portable-final-0.3.3.png`、`ui-portable-config-final-0.3.3.png`：直接运行 0.3.3 portable 发行文件生成的成品验收图。
- `native-icon-{app,setup,portable}-0.3.3.png`：分别从主程序、安装器和 portable 提取的 Windows 原生图标；三者像素哈希一致，均为项目方提供的白底素材。
- `ui-en-light-real.png`、`ui-zh-dark-real.png`：上一轮连接本机真实服务时的界面记录。
- `ui-smoke.png`、`ui-packaged-smoke.png`、`ui-portable-smoke.png`：上一轮基础界面冒烟产物，仅用于历史对照。

冒烟配置必须通过 `A2S_CONFIG_PATH` 指向系统临时目录，不要把真实设备 key 写入测试配置。测试会验证页面不存在管理员 key 输入框或复制接口，避免服务器所有者凭据进入本机共享配置。

## English

- `ui-overview-0.3.3.png`: source-mode overview with real DSH restart/stop controls.
- `ui-config-0.3.3.png`: unified settings with independent endpoint rows and add/remove actions.
- `native-titlebar-light-0.3.3.png`: native Windows capture proving that the title bar follows light mode.
- `ui-unpacked-final-*` and `ui-portable-final-*`: acceptance screenshots from packaged builds.
- `native-icon-{app,setup,portable}-*`: icons extracted from the application, installer, and portable binary; matching hashes prove that all use the supplied white-background source.
- `ui-en-light-real.png` and `ui-zh-dark-real.png`: earlier captures against the live local service.
- `ui-smoke.png`, `ui-packaged-smoke.png`, and `ui-portable-smoke.png`: historical baseline smoke artifacts.

Smoke-test configuration must point `A2S_CONFIG_PATH` at a system temporary directory. Never place a real device key in test configuration. Tests also verify that the UI exposes neither an administrator-key field nor a copy API, keeping server-owner credentials out of workstation configuration.
