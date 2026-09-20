const { spawnSync } = require('node:child_process')
const { join, resolve } = require('node:path')

const project = resolve(__dirname, '..')
const executable = join(project, 'node_modules', '.bin', process.platform === 'win32' ? 'electron-builder.cmd' : 'electron-builder')
const result = spawnSync(executable, process.argv.slice(2), {
  cwd: project,
  stdio: 'inherit',
  windowsHide: true,
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    // Keep the downloaded icon converter outside this ESM package and on the
    // workspace drive. This avoids both Node package-scope leakage and EXDEV
    // rename failures on Windows installations whose global cache is a link.
    ELECTRON_BUILDER_CACHE: join(project, '..', '.electron-builder-cache'),
  },
})

if (result.error) throw result.error
process.exit(result.status ?? 1)
