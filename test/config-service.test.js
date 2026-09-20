import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { ensureConfig, fingerprint, mergeConfig, publicConfig, writeConfig } from '../lib/config-service.js'

test('shared config persists one key and distinct agent instance ids', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'a2switch-config-'))
  const file = join(directory, 'config.json')
  try {
    const first = await ensureConfig(file)
    assert.match(first.device.key, /^a2sk_/)
    assert.equal(new Set(Object.values(first.agents).map((item) => item.instanceId)).size, 3)
    assert.deepEqual(Object.values(first.agents).map((item) => item.locale), ['system', 'system', 'system'])
    const second = await ensureConfig(file)
    assert.equal(second.device.key, first.device.key)
    assert.equal(second.device.id, first.device.id)

    const changed = mergeConfig(second, { server: { endpoints: 'http://127.0.0.1:50443/a2s-api' } })
    const saved = await writeConfig(changed, file)
    assert.deepEqual(saved.server.endpoints, ['http://127.0.0.1:50443/a2s-api'])
    assert.equal(saved.device.key, first.device.key)
    assert.doesNotMatch(await readFile(file, 'utf8'), /undefined/)
    assert.match(fingerprint(saved.device.key), /^a2sk_/)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('mergeConfig changes only supplied agent fields', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'a2switch-merge-'))
  const file = join(directory, 'config.json')
  try {
    const current = await ensureConfig(file)
    const next = mergeConfig(current, { agents: { claude: { enabled: false } } })
    assert.equal(next.agents.claude.enabled, false)
    assert.equal(next.agents.codex.enabled, true)
    assert.equal(next.device.key, current.device.key)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('legacy server admin key is removed from workstation config', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'a2switch-auth-migration-'))
  const file = join(directory, 'config.json')
  try {
    const created = await ensureConfig(file)
    const legacy = structuredClone(created)
    legacy.server.adminKey = 'a2sadm_server-owner-only'
    await writeFile(file, `${JSON.stringify(legacy, null, 2)}\n`, 'utf8')

    const migrated = await ensureConfig(file)
    assert.equal(Object.hasOwn(migrated.server, 'adminKey'), false)
    assert.equal(Object.hasOwn(publicConfig(migrated, file).server, 'adminKey'), false)
    assert.doesNotMatch(await readFile(file, 'utf8'), /a2sadm_server-owner-only/)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
