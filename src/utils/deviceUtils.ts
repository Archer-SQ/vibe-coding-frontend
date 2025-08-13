/**
 * 设备ID相关工具函数
 */

/**
 * 生成基于浏览器指纹的设备ID
 * 使用浏览器特征信息生成稳定的设备标识
 * 格式: [a-f0-9]{32}
 */
export const generateDeviceId = (): string => {
  // 收集浏览器指纹信息
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    navigator.hardwareConcurrency || 0,
    navigator.maxTouchPoints || 0,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.cookieEnabled,
    navigator.doNotTrack || 'unknown',
    // 添加canvas指纹
    getCanvasFingerprint(),
    // 添加WebGL指纹
    getWebGLFingerprint()
  ].join('|')
  
  // 使用简单的哈希算法生成32位十六进制ID
  return hashToHex(fingerprint)
}

/**
 * 获取Canvas指纹
 */
const getCanvasFingerprint = (): string => {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return 'no-canvas'
    
    canvas.width = 200
    canvas.height = 50
    
    // 绘制文本和图形
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('Device ID Generator', 2, 15)
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
    ctx.fillText('Canvas Fingerprint', 4, 35)
    
    return canvas.toDataURL()
  } catch {
    return 'canvas-error'
  }
}

/**
 * 获取WebGL指纹
 */
const getWebGLFingerprint = (): string => {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null
    if (!gl) return 'no-webgl'
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown'
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown'
    
    return `${vendor}|${renderer}`
  } catch {
    return 'webgl-error'
  }
}

/**
 * 将字符串哈希为32位十六进制
 */
const hashToHex = (str: string): string => {
  // 使用多个哈希值确保32位长度
  let hash1 = 0
  let hash2 = 0
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash1 = ((hash1 << 5) - hash1) + char
    hash1 = hash1 & hash1 // 转换为32位整数
    
    hash2 = ((hash2 << 3) - hash2) + char * (i + 1)
    hash2 = hash2 & hash2 // 转换为32位整数
  }
  
  // 生成32位十六进制字符串
  const hex1 = Math.abs(hash1).toString(16).padStart(8, '0')
  const hex2 = Math.abs(hash2).toString(16).padStart(8, '0')
  
  // 组合两个哈希值，确保32位
  let result = (hex1 + hex2).substring(0, 32)
  
  // 如果长度不足32位，用确定性方式填充
  const chars = 'abcdef0123456789'
  while (result.length < 32) {
    const index = (hash1 + hash2 + result.length) % chars.length
    result += chars[Math.abs(index)]
  }
  
  return result.substring(0, 32)
}

/**
 * 验证设备ID格式是否正确
 * @param deviceId 设备ID
 * @returns 是否为有效的32位十六进制字符串
 */
export const validateDeviceId = (deviceId: string): boolean => {
  const regex = /^[a-f0-9]{32}$/
  return regex.test(deviceId)
}

/**
 * 获取或生成设备ID
 * 优先从localStorage获取，如果不存在则生成新的并存储
 */
export const getOrCreateDeviceId = (): string => {
  const STORAGE_KEY = 'gesture_game_device_id'
  
  // 尝试从localStorage获取
  let deviceId = localStorage.getItem(STORAGE_KEY)
  
  // 如果不存在或格式不正确，则生成新的
  if (!deviceId || !validateDeviceId(deviceId)) {
    deviceId = generateDeviceId()
    localStorage.setItem(STORAGE_KEY, deviceId)
  }
  
  return deviceId
}

/**
 * 清除设备ID（用于测试或重置）
 */
export const clearDeviceId = (): void => {
  const STORAGE_KEY = 'gesture_game_device_id'
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * 强制重新生成设备ID
 * 用于从随机ID迁移到指纹ID
 */
export const regenerateDeviceId = (): string => {
  clearDeviceId()
  return getOrCreateDeviceId()
}