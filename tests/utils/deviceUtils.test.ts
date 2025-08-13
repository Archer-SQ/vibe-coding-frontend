/**
 * 设备ID工具函数测试
 */
import {
  generateDeviceId,
  validateDeviceId,
  getOrCreateDeviceId,
  clearDeviceId,
  regenerateDeviceId
} from '../../src/utils/deviceUtils'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    })
  }
})()

// Mock canvas and WebGL
const mockCanvas = {
  getContext: jest.fn(),
  width: 0,
  height: 0,
  toDataURL: jest.fn(() => 'mock-canvas-data')
}

const mockContext2D = {
  textBaseline: '',
  font: '',
  fillStyle: '',
  fillRect: jest.fn(),
  fillText: jest.fn()
}

const mockWebGLContext = {
  getExtension: jest.fn(() => ({
    UNMASKED_VENDOR_WEBGL: 'mock-vendor',
    UNMASKED_RENDERER_WEBGL: 'mock-renderer'
  })),
  getParameter: jest.fn((param) => {
    if (param === 'mock-vendor') return 'Mock Vendor'
    if (param === 'mock-renderer') return 'Mock Renderer'
    return 'unknown'
  })
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock document.createElement
const originalCreateElement = document.createElement
beforeAll(() => {
  document.createElement = jest.fn((tagName: string) => {
    if (tagName === 'canvas') {
      mockCanvas.getContext = jest.fn((type: string) => {
        if (type === '2d') return mockContext2D
        if (type === 'webgl' || type === 'experimental-webgl') return mockWebGLContext
        return null
      })
      return mockCanvas as any
    }
    return originalCreateElement.call(document, tagName)
  })
})

afterAll(() => {
  document.createElement = originalCreateElement
})

describe('deviceUtils', () => {
  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  describe('generateDeviceId', () => {
    it('应该生成32位十六进制字符串', () => {
      const deviceId = generateDeviceId()
      expect(deviceId).toHaveLength(32)
      expect(deviceId).toMatch(/^[a-f0-9]{32}$/)
    })

    it('相同环境下应该生成相同的设备ID', () => {
      const deviceId1 = generateDeviceId()
      const deviceId2 = generateDeviceId()
      expect(deviceId1).toBe(deviceId2)
    })
  })

  describe('validateDeviceId', () => {
    it('应该验证有效的设备ID', () => {
      const validId = 'abcdef0123456789abcdef0123456789'
      expect(validateDeviceId(validId)).toBe(true)
    })

    it('应该拒绝无效的设备ID', () => {
      expect(validateDeviceId('invalid')).toBe(false)
      expect(validateDeviceId('abcdef0123456789abcdef012345678g')).toBe(false) // 包含非十六进制字符
      expect(validateDeviceId('abcdef0123456789abcdef01234567')).toBe(false) // 长度不足
      expect(validateDeviceId('abcdef0123456789abcdef0123456789a')).toBe(false) // 长度超出
    })
  })

  describe('getOrCreateDeviceId', () => {
    it('应该从localStorage获取现有的设备ID', () => {
      const existingId = 'abcdef0123456789abcdef0123456789'
      localStorageMock.setItem('gesture_game_device_id', existingId)
      
      const deviceId = getOrCreateDeviceId()
      expect(deviceId).toBe(existingId)
      expect(localStorageMock.getItem).toHaveBeenCalledWith('gesture_game_device_id')
    })

    it('应该生成新的设备ID并存储到localStorage', () => {
      const deviceId = getOrCreateDeviceId()
      
      expect(deviceId).toHaveLength(32)
      expect(deviceId).toMatch(/^[a-f0-9]{32}$/)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('gesture_game_device_id', deviceId)
    })

    it('应该替换无效的设备ID', () => {
      localStorageMock.setItem('gesture_game_device_id', 'invalid-id')
      
      const deviceId = getOrCreateDeviceId()
      
      expect(deviceId).toHaveLength(32)
      expect(deviceId).toMatch(/^[a-f0-9]{32}$/)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('gesture_game_device_id', deviceId)
    })
  })

  describe('clearDeviceId', () => {
    it('应该从localStorage移除设备ID', () => {
      clearDeviceId()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('gesture_game_device_id')
    })
  })

  describe('regenerateDeviceId', () => {
    it('应该清除旧的设备ID并生成新的', () => {
      const oldId = 'abcdef0123456789abcdef0123456789'
      localStorageMock.setItem('gesture_game_device_id', oldId)
      
      const newId = regenerateDeviceId()
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('gesture_game_device_id')
      expect(newId).toHaveLength(32)
      expect(newId).toMatch(/^[a-f0-9]{32}$/)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('gesture_game_device_id', newId)
    })
  })
})