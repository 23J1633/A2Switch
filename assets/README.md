[中文](#中文) | [English](#english)

# A2Switch application artwork

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

- `icon.png`：Windows 窗口、任务栏、安装器与可执行文件图标，来自仓库根目录 `ICON/icon（白色背景）`。
- `logo-transparent.png`：应用内左上角品牌标识，来自仓库根目录 `ICON/icon（透明背景）`；深色主题仅通过 CSS 反色保证可读性，不改变原始资产。
- `brands/`：Claude、OpenAI 与 DeepSeek 第三方 Agent 标识。
- `icons/`：Lucide 通用界面图标。

两张 A2S 原始 PNG 由项目方提供，不由构建脚本重新绘制。`npm run icon` 只校验 `icon.png` 是否为可用的方形应用图标，避免覆盖项目方素材。

## English

- `icon.png`: icon used by the Windows window, taskbar, installer, and executables. It is copied from the white-background source under the root `ICON` directory.
- `logo-transparent.png`: in-app A2S mark copied from the transparent source. Dark mode only applies a CSS filter for contrast; the source image is not modified.
- `brands/`: third-party Claude, OpenAI, and DeepSeek marks.
- `icons/`: general-purpose Lucide interface icons.

The two original A2S PNG files were supplied by the project owner. Build scripts do not redraw them. `npm run icon` only verifies that `icon.png` is a usable square application icon and never overwrites the supplied artwork.
