import { access, copyFile, cp, open, rename, rm, writeFile } from 'node:fs/promises'

export async function replaceFilePortable(source, target) {
  try {
    await rename(source, target)
    return
  } catch (error) {
    if (error?.code !== 'EXDEV') throw error
  }

  const backup = `${target}.${process.pid}.${process.hrtime.bigint()}.bak`
  const lockFile = `${target}.lock`
  let hasBackup = false
  try {
    await writeFile(lockFile, `${process.pid} ${Date.now()}\n`, { encoding: 'utf8', mode: 0o600 })
    try {
      await copyFile(target, backup)
      hasBackup = true
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }

    try {
      await copyFile(source, target)
      await syncFile(target)
    } catch (error) {
      if (hasBackup) {
        await copyFile(backup, target)
        await syncFile(target)
      } else {
        await rm(target, { force: true }).catch(() => undefined)
      }
      throw error
    }
  } finally {
    await rm(source, { force: true }).catch(() => undefined)
    if (hasBackup) await rm(backup, { force: true }).catch(() => undefined)
    await rm(lockFile, { force: true }).catch(() => undefined)
  }
}

export async function moveDirectoryPortable(source, target, { filter } = {}) {
  try {
    await rename(source, target)
    return
  } catch (error) {
    if (error?.code !== 'EXDEV') throw error
  }

  if (await exists(target)) throw new Error(`目标目录已存在，无法移动：${target}`)
  try {
    await cp(source, target, { recursive: true, force: false, errorOnExist: true, ...(filter ? { filter } : {}) })
    await rm(source, { recursive: true, force: true })
  } catch (error) {
    await rm(target, { recursive: true, force: true }).catch(() => undefined)
    throw error
  }
}

async function syncFile(file) {
  const handle = await open(file, 'r+')
  try { await handle.sync() } finally { await handle.close() }
}

async function exists(path) {
  try { await access(path); return true } catch { return false }
}
