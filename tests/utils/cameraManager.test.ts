import { cameraManager } from '../../src/utils/cameraManager'

// Mock navigator.mediaDevices
const mockGetUserMedia = jest.fn()
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
})

// Mock MediaStream
const mockTrack = {
  stop: jest.fn(),
  kind: 'video',
  readyState: 'live',
}

const mockStream = {
  getTracks: jest.fn(() => [mockTrack]),
} as unknown as MediaStream

// Mock HTMLVideoElement
const mockVideoElement = {
  srcObject: null,
  load: jest.fn(),
} as unknown as HTMLVideoElement

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
}

describe('CameraManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // 重置摄像头状态
    cameraManager.stopCamera()
    // 重置 mock track 状态
    mockTrack.readyState = 'live'
  })

  afterAll(() => {
    // 恢复 console 方法
    consoleSpy.log.mockRestore()
    consoleSpy.error.mockRestore()
  })

  it('应该是单例模式', () => {
    const instance1 = cameraManager
    const instance2 = cameraManager
    expect(instance1).toBe(instance2)
  })

  it('应该能够启动摄像头', async () => {
    mockGetUserMedia.mockResolvedValue(mockStream)

    const stream = await cameraManager.startCamera()

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user',
      },
    })
    expect(stream).toBe(mockStream)
    expect(cameraManager.getStatus().isActive).toBe(true)
    expect(consoleSpy.log).toHaveBeenCalledWith('📷 全局摄像头已启动')
  })

  it('应该能够停止摄像头', async () => {
    mockGetUserMedia.mockResolvedValue(mockStream)

    await cameraManager.startCamera()
    cameraManager.stopCamera()

    expect(mockTrack.stop).toHaveBeenCalled()
    expect(cameraManager.getStatus().isActive).toBe(false)
    expect(cameraManager.getStatus().stream).toBe(null)
    expect(consoleSpy.log).toHaveBeenCalledWith('✅ 全局摄像头已完全关闭')
  })

  it('应该处理摄像头启动失败', async () => {
    const error = new Error('Camera not available')
    mockGetUserMedia.mockRejectedValue(error)

    await expect(cameraManager.startCamera()).rejects.toThrow('Camera not available')
    expect(cameraManager.getStatus().isActive).toBe(false)
    expect(consoleSpy.error).toHaveBeenCalledWith('❌ 全局摄像头启动失败:', error)
  })

  it('应该返回已存在的stream', async () => {
    mockGetUserMedia.mockResolvedValue(mockStream)

    const stream1 = await cameraManager.startCamera()
    const stream2 = await cameraManager.startCamera()

    expect(stream1).toBe(stream2)
    expect(mockGetUserMedia).toHaveBeenCalledTimes(1)
  })

  it('应该正确设置和清理视频元素', async () => {
    mockGetUserMedia.mockResolvedValue(mockStream)
    
    // 设置视频元素
    cameraManager.setVideoElement(mockVideoElement)
    
    await cameraManager.startCamera()
    cameraManager.stopCamera()

    expect(mockVideoElement.srcObject).toBe(null)
    expect(mockVideoElement.load).toHaveBeenCalled()
    expect(consoleSpy.log).toHaveBeenCalledWith('🎥 视频元素已清理')
  })

  it('应该正确处理状态监听器', async () => {
    const callback1 = jest.fn()
    const callback2 = jest.fn()
    
    // 添加监听器
    cameraManager.addStatusListener(callback1)
    cameraManager.addStatusListener(callback2)
    
    mockGetUserMedia.mockResolvedValue(mockStream)
    await cameraManager.startCamera()
    
    // 停止摄像头应该触发回调
    cameraManager.stopCamera()
    
    expect(callback1).toHaveBeenCalled()
    expect(callback2).toHaveBeenCalled()
  })

  it('应该能够移除状态监听器', async () => {
    const callback = jest.fn()
    
    cameraManager.addStatusListener(callback)
    cameraManager.removeStatusListener(callback)
    
    mockGetUserMedia.mockResolvedValue(mockStream)
    await cameraManager.startCamera()
    cameraManager.stopCamera()
    
    expect(callback).not.toHaveBeenCalled()
  })

  it('应该正确处理强制停止', async () => {
    mockGetUserMedia.mockResolvedValue(mockStream)
    
    await cameraManager.startCamera()
    cameraManager.forceStop()
    
    expect(mockTrack.stop).toHaveBeenCalled()
    expect(cameraManager.getStatus().isActive).toBe(false)
    expect(consoleSpy.log).toHaveBeenCalledWith('🚨 强制关闭摄像头')
  })

  it('应该处理没有摄像头时的停止操作', () => {
    cameraManager.stopCamera()
    
    expect(consoleSpy.log).toHaveBeenCalledWith('ℹ️ 摄像头未启动，无需关闭')
  })

  it('应该正确记录轨道停止过程', async () => {
    mockGetUserMedia.mockResolvedValue(mockStream)
    
    await cameraManager.startCamera()
    cameraManager.stopCamera()
    
    expect(consoleSpy.log).toHaveBeenCalledWith('📷 正在关闭全局摄像头...')
    expect(consoleSpy.log).toHaveBeenCalledWith('🔴 正在停止轨道: video, 状态: live')
    expect(consoleSpy.log).toHaveBeenCalledWith('✅ 轨道已停止: video, 新状态: live')
  })

  it('应该正确返回摄像头状态', async () => {
    // 初始状态
    let status = cameraManager.getStatus()
    expect(status.isActive).toBe(false)
    expect(status.stream).toBe(null)
    
    // 启动后状态
    mockGetUserMedia.mockResolvedValue(mockStream)
    await cameraManager.startCamera()
    
    status = cameraManager.getStatus()
    expect(status.isActive).toBe(true)
    expect(status.stream).toBe(mockStream)
  })

  it('应该能够设置空的视频元素', () => {
    cameraManager.setVideoElement(null)
    
    // 这应该不会抛出错误
    cameraManager.stopCamera()
    
    expect(consoleSpy.log).toHaveBeenCalledWith('ℹ️ 摄像头未启动，无需关闭')
  })

  it('应该处理垃圾回收（如果可用）', async () => {
    // Mock window.gc
    const mockGc = jest.fn()
    Object.defineProperty(window, 'gc', {
      value: mockGc,
      writable: true,
      configurable: true,
    })
    
    mockGetUserMedia.mockResolvedValue(mockStream)
    await cameraManager.startCamera()
    cameraManager.stopCamera()
    
    expect(mockGc).toHaveBeenCalled()
    
    // 清理
    delete (window as typeof window & { gc?: () => void }).gc
  })

  it('应该处理垃圾回收失败', async () => {
    // Mock window.gc 抛出错误
    const mockGc = jest.fn().mockImplementation(() => {
      throw new Error('GC not available')
    })
    Object.defineProperty(window, 'gc', {
      value: mockGc,
      writable: true,
      configurable: true,
    })
    
    mockGetUserMedia.mockResolvedValue(mockStream)
    await cameraManager.startCamera()
    
    // 这应该不会抛出错误
    expect(() => cameraManager.stopCamera()).not.toThrow()
    
    // 清理
    delete (window as typeof window & { gc?: () => void }).gc
  })
})