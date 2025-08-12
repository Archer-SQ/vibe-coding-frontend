import { renderHook, act } from '@testing-library/react'
import { useGestureRecognition } from '../../src/hooks/useGestureRecognition'
import { GestureType } from '../../src/types/gesture'

// Mock MediaPipe
const mockHands = {
  setOptions: jest.fn(),
  onResults: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
}

// Mock window.Hands
Object.defineProperty(window, 'Hands', {
  writable: true,
  value: jest.fn(() => mockHands),
})

// Mock cameraManager
jest.mock('../../src/utils/cameraManager', () => ({
  cameraManager: {
    startCamera: jest.fn().mockResolvedValue(new MediaStream()),
    stopCamera: jest.fn(),
    setVideoElement: jest.fn(),
    addStatusListener: jest.fn(),
    removeStatusListener: jest.fn(),
    getStatus: jest.fn().mockReturnValue({ isActive: false, stream: null }),
    forceStop: jest.fn(),
  },
}))

// Get the mocked cameraManager for test manipulation
const { cameraManager: mockCameraManager } = jest.requireMock('../../src/utils/cameraManager')

describe('useGestureRecognition', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset DOM
    document.head.innerHTML = ''
    // Reset mock implementations
    mockCameraManager.startCamera.mockResolvedValue(new MediaStream())
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  it('应该初始化默认状态', () => {
    const { result } = renderHook(() => useGestureRecognition())

    expect(result.current.gestureState.type).toBe(GestureType.NONE)
    expect(result.current.gestureState.confidence).toBe(0)
    expect(result.current.cameraState.isConnected).toBe(false)
    expect(result.current.cameraState.isActive).toBe(false)
    expect(result.current.handPosition.x).toBe(0.5)
    expect(result.current.handPosition.y).toBe(0.5)
  })

  it('应该正确更新手势配置', () => {
    const { result } = renderHook(() => useGestureRecognition())

    act(() => {
      result.current.updateConfig({
        enableGesture: false,
        confidenceThreshold: 0.9,
        debounceTime: 2000,
        smoothingFactor: 0.3,
      })
    })

    expect(result.current.config.enableGesture).toBe(false)
    expect(result.current.config.confidenceThreshold).toBe(0.9)
    expect(result.current.config.debounceTime).toBe(2000)
    expect(result.current.config.smoothingFactor).toBe(0.3)
  })

  it('应该能够启动摄像头', async () => {
    const { result } = renderHook(() => useGestureRecognition())

    await act(async () => {
      await result.current.startCamera()
    })

    expect(result.current.cameraState.isConnected).toBe(true)
    expect(result.current.cameraState.isActive).toBe(true)
  })

  it('应该能够停止摄像头', () => {
    const { result } = renderHook(() => useGestureRecognition())

    act(() => {
      result.current.stopCamera()
    })

    expect(result.current.cameraState.isConnected).toBe(false)
    expect(result.current.cameraState.isActive).toBe(false)
  })

  it('应该能够切换手势识别状态', () => {
    const { result } = renderHook(() => useGestureRecognition())

    // 初始状态应该是启用的
    expect(result.current.config.enableGesture).toBe(true)

    act(() => {
      result.current.toggleGesture()
    })

    expect(result.current.config.enableGesture).toBe(false)

    act(() => {
      result.current.toggleGesture()
    })

    expect(result.current.config.enableGesture).toBe(true)
  })

  it('应该正确处理摄像头权限错误', async () => {
    // Mock cameraManager.startCamera 抛出权限错误
    const error = new Error('摄像头权限被拒绝，请在浏览器设置中允许访问摄像头')
    error.name = 'NotAllowedError'
    mockCameraManager.startCamera.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useGestureRecognition())

    await act(async () => {
      try {
        await result.current.startCamera()
      } catch (e) {
        // 捕获错误，测试应该处理这个错误
      }
    })

    expect(result.current.cameraState.isConnected).toBe(false)
    expect(result.current.cameraState.error).toContain('摄像头权限被拒绝')
  })

  it('应该正确处理设备不存在错误', async () => {
    // Mock cameraManager.startCamera 抛出设备不存在错误
    const error = new Error('未找到摄像头设备，请检查摄像头是否正确连接')
    error.name = 'NotFoundError'
    mockCameraManager.startCamera.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useGestureRecognition())

    await act(async () => {
      try {
        await result.current.startCamera()
      } catch (e) {
        // 捕获错误，测试应该处理这个错误
      }
    })

    expect(result.current.cameraState.isConnected).toBe(false)
    expect(result.current.cameraState.error).toContain('未找到摄像头设备')
  })

  it('应该在组件卸载时清理资源', async () => {
    const { result, unmount } = renderHook(() => useGestureRecognition())

    // 模拟启动摄像头
    await act(async () => {
      await result.current.startCamera()
    })

    // 验证摄像头已启动
    expect(result.current.cameraState.isActive).toBe(true)

    // 卸载组件，这会触发 useEffect 的清理函数
    unmount()

    // 验证 cameraManager.stopCamera 被调用
    expect(mockCameraManager.stopCamera).toHaveBeenCalled()
  })
})
