function httpEndpoint(endpoint) {
  const url = new URL(endpoint)
  if (url.protocol === 'ws:') url.protocol = 'http:'
  if (url.protocol === 'wss:') url.protocol = 'https:'
  url.pathname = url.pathname.replace(/\/(ws|events|inbox)\/?$/, '')
  return url.toString().replace(/\/+$/, '')
}

async function jsonRequest(endpoint, path, { method = 'GET', body, timeoutMs = 8000 } = {}) {
  const url = `${httpEndpoint(endpoint)}${path}`
  const response = await fetch(url, {
    method,
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  let data
  try { data = text ? JSON.parse(text) : null } catch { data = { raw: text } }
  if (!response.ok) {
    const error = new Error(data?.error?.message || `HTTP ${response.status}`)
    error.code = data?.error?.code || `http_${response.status}`
    error.status = response.status
    throw error
  }
  return data
}

export async function inspectServer(config) {
  const endpoint = config.server.endpoints[0]
  if (!endpoint) return { configured: false, reachable: false, endpoint: '' }
  try {
    const health = await jsonRequest(endpoint, '/health')
    const avatarResponse = await jsonRequest(endpoint, '/avatar').catch(() => ({ avatar: null }))
    // A2Switch deliberately uses only the public health endpoint. The server
    // administrator credential must never be copied into workstation config.
    // Per-agent connection state comes from each local bridge runtime file.
    return { configured: true, reachable: true, endpoint, health, avatar: avatarResponse?.avatar || null, instances: [], devices: [] }
  } catch (error) {
    return { configured: true, reachable: false, endpoint, error: error.message, code: error.code }
  }
}

export { httpEndpoint, jsonRequest }
