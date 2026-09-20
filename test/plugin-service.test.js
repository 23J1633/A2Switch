import assert from 'node:assert/strict'
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { PluginService, repositoryArchiveUrl } from '../lib/plugin-service.js'

test('GitHub repository URLs resolve to default-branch ZIP archives without Git', () => {
  assert.equal(
    repositoryArchiveUrl('https://github.com/23J1633/cc2server.git'),
    'https://api.github.com/repos/23J1633/cc2server/zipball',
  )
  assert.equal(
    repositoryArchiveUrl('https://github.com/23J1633/codex2server', 'release/v1'),
    'https://api.github.com/repos/23J1633/codex2server/zipball/release%2Fv1',
  )
  assert.throws(() => repositoryArchiveUrl('git@github.com:23J1633/cc2server.git'), /GitHub|URL/)
  assert.throws(() => repositoryArchiveUrl('https://example.com/cc2server.git'), /GitHub/)
})

test('one-click install stages, validates and atomically replaces a local bridge', async () => {
  const root = await mkdtemp(join(tmpdir(), 'a2switch-plugin-'))
  const workspaceRoot = join(root, 'workspace')
  const source = join(workspaceRoot, 'cc2server')
  const installDir = join(root, 'installed')
  const config = { plugins: { catalogUrl: '', installDir } }
  await mkdir(join(source, 'bin'), { recursive: true })
  await writeFile(join(source, 'package.json'), JSON.stringify({ name: '@a2s/cc2server', version: '9.9.9', type: 'module' }))
  await writeFile(join(source, 'bin', 'cc2server.js'), '#!/usr/bin/env node\n')
  await mkdir(join(source, 'node_modules', 'ignored'), { recursive: true })
  await writeFile(join(source, 'node_modules', 'ignored', 'sentinel.txt'), 'must not be copied')

  try {
    const service = new PluginService({ configFile: join(root, 'config.json'), workspaceRoot })
    const first = await service.install('cc2server', config)
    assert.equal(first.ok, true)
    assert.equal(JSON.parse(await readFile(join(first.path, 'package.json'), 'utf8')).version, '9.9.9')
    await assert.rejects(access(join(first.path, 'node_modules', 'ignored', 'sentinel.txt')))

    await writeFile(join(source, 'package.json'), JSON.stringify({ name: '@a2s/cc2server', version: '10.0.0', type: 'module' }))
    const second = await service.install('cc2server', config)
    assert.ok(second.backup, 'reinstall keeps a recoverable backup')
    assert.equal(JSON.parse(await readFile(join(second.path, 'package.json'), 'utf8')).version, '10.0.0')
    assert.equal(JSON.parse(await readFile(join(second.backup, 'package.json'), 'utf8')).version, '9.9.9')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
