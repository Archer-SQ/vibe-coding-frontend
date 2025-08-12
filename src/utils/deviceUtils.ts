/**
 * 设备ID相关工具函数
 */

/**
 * 生成32位十六进制设备ID
 * 格式: [a-f0-9]{32}
 * 示例: abc123def456ghi789jkl012mno345pq
 */
export const generateDeviceId = (): string => {
  const chars = 'abcdef0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
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