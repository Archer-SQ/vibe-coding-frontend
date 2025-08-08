import { renderHook, act } from '@testing-library/react'
import { useGameControl } from '../../src/hooks/useGameControl'
import { GestureType } from '../../src/types/gesture'

// Mock useGestureRecognition hook
const mockStartCamera = jest.fn()
const mockStopCamera = jest.fn()
const mockToggleGesture = jest.fn()
const mockUpdateConfig = jest.fn()

jest.mock('../../src/hooks/useGestureRecognition', () => ({
  useGestureRecognition: jest.fn(() => ({
    gestureState: {
      type: GestureType.NONE,
      confidence: 0
    },
    handPosition: { x: 0.5, y: 0.5 },
    cameraState: {
      isActive: false,
      error: undefined
    },
    startCamera: mockStartCamera,
    stopCamera: mockStopCamera,
    toggleGesture: mockToggleGesture,
    updateConfig: mockUpdateConfig,
    config: {
      enableGesture: true,
      smoothingFactor: 0.3,
      debounceTime: 100
    },
    videoRef: { current: null },
    stream: null
  }))
}))

// Mock useBulletSystem hook
const mockCreateBullet = jest.fn()
const mockClearBullets = jest.fn()
const mockUpdateBullets = jest.fn(() => ({
  hitEnemies: [],
  remainingBullets: [],
  remainingEnemies: []
}))

jest.mock('../../src/hooks/useBulletSystem', () => ({
  useBulletSystem: jest.fn(() => ({
    bullets: [],
    createBullet: mockCreateBullet,
    clearBullets: mockClearBullets,
    updateBullets: mockUpdateBullets
  }))
}))

describe('useGameControl', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockStartCamera.mockClear()
    mockStopCamera.mockClear()
    mockToggleGesture.mockClear()
    mockUpdateConfig.mockClear()
    mockCreateBullet.mockClear()
    mockClearBullets.mockClear()
    mockUpdateBullets.mockClear()
  })

  it('应该初始化默认状态', () => {
    const { result } = renderHook(() => useGameControl())

    expect(result.current.playerPosition).toEqual({ x: 50, y: 80 })
    expect(result.current.gameActions).toEqual({ shoot: false, pause: false })
    expect(result.current.bullets).toEqual([])
    expect(result.current.currentGesture).toBe(GestureType.NONE)
    expect(result.current.gestureConfidence).toBe(0)
    expect(result.current.isGestureActive).toBe(true)
    expect(result.current.isCameraActive).toBe(false)
  })

  it('应该能够启动手势控制', async () => {
    const { result } = renderHook(() => useGameControl())

    await act(async () => {
      await result.current.startGestureControl()
    })

    expect(mockStartCamera).toHaveBeenCalled()
  })

  it('应该能够停止手势控制', () => {
    const { result } = renderHook(() => useGameControl())

    act(() => {
      result.current.stopGestureControl()
    })

    expect(mockStopCamera).toHaveBeenCalled()
    expect(mockClearBullets).toHaveBeenCalled()
  })

  it('应该能够切换手势控制', () => {
    const { result } = renderHook(() => useGameControl())

    act(() => {
      result.current.toggleGestureControl()
    })

    expect(mockToggleGesture).toHaveBeenCalled()
  })

  it('应该能够重置玩家位置', () => {
    const { result } = renderHook(() => useGameControl())

    act(() => {
      result.current.resetPlayerPosition()
    })

    expect(result.current.playerPosition).toEqual({ x: 50, y: 80 })
  })

  it('应该能够创建子弹', () => {
    const { result } = renderHook(() => useGameControl())

    act(() => {
      result.current.createBullet(50, 70)
    })

    expect(mockCreateBullet).toHaveBeenCalledWith(50, 70)
  })

  it('应该能够清除子弹', () => {
    const { result } = renderHook(() => useGameControl())

    act(() => {
      result.current.clearBullets()
    })

    expect(mockClearBullets).toHaveBeenCalled()
  })

  it('应该正确返回手势状态', () => {
    const { result } = renderHook(() => useGameControl())

    expect(result.current.currentGesture).toBe(GestureType.NONE)
    expect(result.current.gestureConfidence).toBe(0)
    expect(result.current.handPosition).toEqual({ x: 0.5, y: 0.5 })
  })

  it('应该正确返回摄像头状态', () => {
    const { result } = renderHook(() => useGameControl())

    expect(result.current.isCameraActive).toBe(false)
    expect(result.current.cameraError).toBeUndefined()
    expect(result.current.cameraState).toEqual({
      isActive: false,
      error: undefined
    })
    expect(result.current.videoRef).toBeDefined()
    expect(result.current.stream).toBeNull()
  })

  it('应该正确返回配置信息', () => {
    const { result } = renderHook(() => useGameControl())

    expect(result.current.config).toEqual({
      enableGesture: true,
      smoothingFactor: 0.3,
      debounceTime: 100
    })
  })
})
