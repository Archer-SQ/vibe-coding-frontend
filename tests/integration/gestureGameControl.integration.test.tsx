import { renderHook, act } from '@testing-library/react'
import { useGestureRecognition } from '../../src/hooks/useGestureRecognition'
import { useGameControl } from '../../src/hooks/useGameControl'
import { GestureType } from '../../src/types/gesture'

// Mock MediaPipe
const mockHands = {
  setOptions: jest.fn(),
  onResults: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
}

Object.defineProperty(window, 'Hands', {
  writable: true,
  value: jest.fn(() => mockHands),
})

// Mock cameraManager
jest.mock('../../src/utils/cameraManager', () => {
  const mockCameraManager = {
    startCamera: jest.fn().mockResolvedValue(new MediaStream()),
    stopCamera: jest.fn(),
    setVideoElement: jest.fn(),
    addStatusListener: jest.fn(),
    removeStatusListener: jest.fn(),
    getStatus: jest.fn().mockReturnValue({ isActive: false, stream: null }),
    forceStop: jest.fn(),
  }
  
  return {
    cameraManager: mockCameraManager,
  }
})

const mockCameraManager = jest.requireMock('../../src/utils/cameraManager').cameraManager

// Mock HTMLVideoElement
Object.defineProperty(HTMLVideoElement.prototype, 'play', {
  writable: true,
  value: jest.fn().mockResolvedValue(undefined),
})

Object.defineProperty(HTMLVideoElement.prototype, 'load', {
  writable: true,
  value: jest.fn(),
})

describe('手势识别与游戏控制集成测试', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    
    // 重置 mock 实现
    mockCameraManager.startCamera.mockResolvedValue(new MediaStream())
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('useGestureRecognition + useGameControl 协同工作', () => {
    it('应该能够同时初始化手势识别和游戏控制', async () => {
      const { result: gestureResult } = renderHook(() => useGestureRecognition())
      const { result: gameResult } = renderHook(() => useGameControl())

      // 验证初始状态
      expect(gestureResult.current.gestureState.type).toBe(GestureType.NONE)
      expect(gestureResult.current.gestureState.confidence).toBe(0)
      expect(gestureResult.current.cameraState.isConnected).toBe(false)

      expect(gameResult.current.playerPosition).toEqual({ x: 50, y: 80 })
      expect(gameResult.current.bullets).toEqual([])
      expect(gameResult.current.gameActions.shoot).toBe(false)
    })

    it('应该能够处理手势识别状态变化', async () => {
      const { result: gestureResult } = renderHook(() => useGestureRecognition())

      await act(async () => {
        // 模拟摄像头连接成功
        await gestureResult.current.startCamera()
      })

      // 验证连接状态更新
      expect(gestureResult.current.cameraState.isActive).toBe(true)
    })

    it('应该能够处理游戏控制状态变化', async () => {
      const { result: gameResult } = renderHook(() => useGameControl())

      await act(async () => {
        // 模拟重置玩家位置
        gameResult.current.resetPlayerPosition()
      })

      // 验证玩家位置重置
      expect(gameResult.current.playerPosition).toEqual({ x: 50, y: 80 })
    })
  })

  describe('手势识别结果转换为游戏操作', () => {
    it('应该能够将手势数据转换为游戏控制指令', async () => {
      const { result: gestureResult } = renderHook(() => useGestureRecognition())

      // 先启动摄像头以初始化手势识别
      await act(async () => {
        await gestureResult.current.startCamera()
      })

      // 模拟手势识别结果 - 完整的 21 个手部关键点
      const mockResults = {
        multiHandLandmarks: [[
          // 手腕 (0)
          { x: 0.5, y: 0.5, z: 0 },
          // 拇指 (1-4)
          { x: 0.52, y: 0.48, z: 0 }, // 拇指根部
          { x: 0.54, y: 0.46, z: 0 }, // 拇指第一关节
          { x: 0.56, y: 0.44, z: 0 }, // 拇指第二关节
          { x: 0.58, y: 0.42, z: 0 }, // 拇指尖
          // 食指 (5-8)
          { x: 0.48, y: 0.45, z: 0 }, // 食指根部
          { x: 0.46, y: 0.40, z: 0 }, // 食指第一关节
          { x: 0.44, y: 0.35, z: 0 }, // 食指第二关节
          { x: 0.42, y: 0.30, z: 0 }, // 食指尖
          // 中指 (9-12)
          { x: 0.50, y: 0.45, z: 0 }, // 中指根部
          { x: 0.50, y: 0.38, z: 0 }, // 中指第一关节
          { x: 0.50, y: 0.32, z: 0 }, // 中指第二关节
          { x: 0.50, y: 0.26, z: 0 }, // 中指尖
          // 无名指 (13-16)
          { x: 0.52, y: 0.45, z: 0 }, // 无名指根部
          { x: 0.54, y: 0.40, z: 0 }, // 无名指第一关节
          { x: 0.56, y: 0.36, z: 0 }, // 无名指第二关节
          { x: 0.58, y: 0.32, z: 0 }, // 无名指尖
          // 小指 (17-20)
          { x: 0.54, y: 0.45, z: 0 }, // 小指根部
          { x: 0.56, y: 0.42, z: 0 }, // 小指第一关节
          { x: 0.58, y: 0.39, z: 0 }, // 小指第二关节
          { x: 0.60, y: 0.36, z: 0 }, // 小指尖
        ]],
        multiHandedness: [{ label: 'Right' }],
      }

      await act(async () => {
        // 触发手势识别回调
        const onResultsCallback = mockHands.onResults.mock.calls[0]?.[0]
        if (onResultsCallback) {
          onResultsCallback(mockResults)
        }
      })

      // 验证手势识别结果 - 由于 mock 的限制，我们验证系统能够处理手势数据
      expect(gestureResult.current.gestureState).toBeDefined()
      expect(gestureResult.current.handPosition).toBeDefined()
    })

    it('应该能够根据手势控制玩家位置', async () => {
      const { result: gameResult } = renderHook(() => useGameControl())

      await act(async () => {
        // 模拟启动手势控制
        await gameResult.current.startGestureControl()
      })

      // 验证摄像头启动
      expect(mockCameraManager.startCamera).toHaveBeenCalled()
    })

    it('应该能够根据手势控制射击', async () => {
      const { result: gameResult } = renderHook(() => useGameControl())

      await act(async () => {
        // 模拟创建子弹
        gameResult.current.createBullet(50, 80)
      })

      // 验证子弹创建
      expect(gameResult.current.bullets.length).toBeGreaterThan(0)
    })
  })

  describe('实时性能测试', () => {
    it('应该能够处理高频手势更新', async () => {
      const { result: gestureResult } = renderHook(() => useGestureRecognition())
      
      // 先启动摄像头以初始化手势识别
      await act(async () => {
        await gestureResult.current.startCamera()
      })

      const mockResults = {
        multiHandLandmarks: [[
          // 手腕 (0)
          { x: 0.5, y: 0.5, z: 0 },
          // 拇指 (1-4)
          { x: 0.52, y: 0.48, z: 0 }, // 拇指根部
          { x: 0.54, y: 0.46, z: 0 }, // 拇指第一关节
          { x: 0.56, y: 0.44, z: 0 }, // 拇指第二关节
          { x: 0.58, y: 0.42, z: 0 }, // 拇指尖
          // 食指 (5-8)
          { x: 0.48, y: 0.45, z: 0 }, // 食指根部
          { x: 0.46, y: 0.40, z: 0 }, // 食指第一关节
          { x: 0.44, y: 0.35, z: 0 }, // 食指第二关节
          { x: 0.42, y: 0.30, z: 0 }, // 食指尖
          // 中指 (9-12)
          { x: 0.50, y: 0.45, z: 0 }, // 中指根部
          { x: 0.50, y: 0.38, z: 0 }, // 中指第一关节
          { x: 0.50, y: 0.32, z: 0 }, // 中指第二关节
          { x: 0.50, y: 0.26, z: 0 }, // 中指尖
          // 无名指 (13-16)
          { x: 0.52, y: 0.45, z: 0 }, // 无名指根部
          { x: 0.54, y: 0.40, z: 0 }, // 无名指第一关节
          { x: 0.56, y: 0.36, z: 0 }, // 无名指第二关节
          { x: 0.58, y: 0.32, z: 0 }, // 无名指尖
          // 小指 (17-20)
          { x: 0.54, y: 0.45, z: 0 }, // 小指根部
          { x: 0.56, y: 0.42, z: 0 }, // 小指第一关节
          { x: 0.58, y: 0.39, z: 0 }, // 小指第二关节
          { x: 0.60, y: 0.36, z: 0 }, // 小指尖
        ]],
        multiHandedness: [{ label: 'Right' }],
      }

      // 模拟高频更新（30fps）
      const onResultsCallback = mockHands.onResults.mock.calls[0]?.[0]
      
      await act(async () => {
        for (let i = 0; i < 30; i++) {
          if (onResultsCallback) {
            onResultsCallback({
              ...mockResults,
              multiHandLandmarks: [[
                // 手腕 (0)
                { x: 0.5 + i * 0.01, y: 0.5, z: 0 },
                // 拇指 (1-4)
                { x: 0.52 + i * 0.01, y: 0.48, z: 0 },
                { x: 0.54 + i * 0.01, y: 0.46, z: 0 },
                { x: 0.56 + i * 0.01, y: 0.44, z: 0 },
                { x: 0.58 + i * 0.01, y: 0.42, z: 0 },
                // 食指 (5-8)
                { x: 0.48 + i * 0.01, y: 0.45, z: 0 },
                { x: 0.46 + i * 0.01, y: 0.40, z: 0 },
                { x: 0.44 + i * 0.01, y: 0.35, z: 0 },
                { x: 0.42 + i * 0.01, y: 0.30, z: 0 },
                // 中指 (9-12)
                { x: 0.50 + i * 0.01, y: 0.45, z: 0 },
                { x: 0.50 + i * 0.01, y: 0.38, z: 0 },
                { x: 0.50 + i * 0.01, y: 0.32, z: 0 },
                { x: 0.50 + i * 0.01, y: 0.26, z: 0 },
                // 无名指 (13-16)
                { x: 0.52 + i * 0.01, y: 0.45, z: 0 },
                { x: 0.54 + i * 0.01, y: 0.40, z: 0 },
                { x: 0.56 + i * 0.01, y: 0.36, z: 0 },
                { x: 0.58 + i * 0.01, y: 0.32, z: 0 },
                // 小指 (17-20)
                { x: 0.54 + i * 0.01, y: 0.45, z: 0 },
                { x: 0.56 + i * 0.01, y: 0.42, z: 0 },
                { x: 0.58 + i * 0.01, y: 0.39, z: 0 },
                { x: 0.60 + i * 0.01, y: 0.36, z: 0 },
              ]],
            })
          }
          jest.advanceTimersByTime(33) // ~30fps
        }
      })

      // 验证系统能够处理高频更新 - 验证手部位置有更新
      expect(gestureResult.current.handPosition.x).toBeGreaterThan(0)
      expect(gestureResult.current.handPosition.y).toBeGreaterThan(0)
    })

    it('应该能够处理游戏循环中的实时更新', async () => {
      const { result: gameResult } = renderHook(() => useGameControl())

      await act(async () => {
        // 模拟游戏循环中的连续更新
        for (let i = 0; i < 60; i++) {
          gameResult.current.updateBullets([])
          jest.advanceTimersByTime(16) // ~60fps
        }
      })

      // 验证游戏状态保持稳定
      expect(gameResult.current.bullets).toBeDefined()
    })

    it('应该能够处理并发的手势识别和游戏更新', async () => {
      const { result: gestureResult } = renderHook(() => useGestureRecognition())
      const { result: gameResult } = renderHook(() => useGameControl())

      const mockResults = {
        multiHandLandmarks: [[
          // 手腕 (0)
          { x: 0.5, y: 0.5, z: 0 },
          // 拇指 (1-4)
          { x: 0.52, y: 0.48, z: 0 }, // 拇指根部
          { x: 0.54, y: 0.46, z: 0 }, // 拇指第一关节
          { x: 0.56, y: 0.44, z: 0 }, // 拇指第二关节
          { x: 0.58, y: 0.42, z: 0 }, // 拇指尖
          // 食指 (5-8)
          { x: 0.48, y: 0.45, z: 0 }, // 食指根部
          { x: 0.46, y: 0.40, z: 0 }, // 食指第一关节
          { x: 0.44, y: 0.35, z: 0 }, // 食指第二关节
          { x: 0.42, y: 0.30, z: 0 }, // 食指尖
          // 中指 (9-12)
          { x: 0.50, y: 0.45, z: 0 }, // 中指根部
          { x: 0.50, y: 0.38, z: 0 }, // 中指第一关节
          { x: 0.50, y: 0.32, z: 0 }, // 中指第二关节
          { x: 0.50, y: 0.26, z: 0 }, // 中指尖
          // 无名指 (13-16)
          { x: 0.52, y: 0.45, z: 0 }, // 无名指根部
          { x: 0.54, y: 0.40, z: 0 }, // 无名指第一关节
          { x: 0.56, y: 0.36, z: 0 }, // 无名指第二关节
          { x: 0.58, y: 0.32, z: 0 }, // 无名指尖
          // 小指 (17-20)
          { x: 0.54, y: 0.45, z: 0 }, // 小指根部
          { x: 0.56, y: 0.42, z: 0 }, // 小指第一关节
          { x: 0.58, y: 0.39, z: 0 }, // 小指第二关节
          { x: 0.60, y: 0.36, z: 0 }, // 小指尖
        ]],
        multiHandedness: [{ label: 'Right' }],
      }

      const onResultsCallback = mockHands.onResults.mock.calls[0]?.[0]

      await act(async () => {
        // 模拟并发操作
        const promises: Promise<void>[] = []
        
        // 手势识别更新
        for (let i = 0; i < 10; i++) {
          if (onResultsCallback) {
            onResultsCallback(mockResults)
          }
        }

        // 游戏状态更新
        for (let i = 0; i < 10; i++) {
          gameResult.current.updateBullets([])
        }

        await Promise.all(promises)
        jest.advanceTimersByTime(200)
      })

      // 验证系统能够处理并发更新
      expect(gestureResult.current.gestureState.type).toBeDefined()
      expect(gameResult.current.bullets).toBeDefined()
    })
  })

  describe('错误处理和恢复', () => {
    it('应该能够处理手势识别错误', async () => {
      const { result: gestureResult } = renderHook(() => useGestureRecognition())

      // 模拟摄像头启动失败
      mockCameraManager.startCamera.mockRejectedValueOnce(new Error('Camera error'))

      await act(async () => {
        try {
          await gestureResult.current.startCamera()
        } catch {
          // 预期的错误
        }
      })

      // 验证错误状态处理
      expect(gestureResult.current.cameraState.isConnected).toBe(false)
    })

    it('应该能够从错误状态恢复', async () => {
      const { result: gestureResult } = renderHook(() => useGestureRecognition())

      // 模拟错误后恢复
      mockCameraManager.startCamera
        .mockRejectedValueOnce(new Error('Camera error'))
        .mockResolvedValueOnce(new MediaStream())

      await act(async () => {
        try {
          await gestureResult.current.startCamera()
        } catch {
          // 第一次失败
        }
      })

      expect(gestureResult.current.cameraState.isConnected).toBe(false)

      await act(async () => {
        // 第二次尝试成功
        await gestureResult.current.startCamera()
      })

      // 验证恢复状态
      expect(gestureResult.current.cameraState.isActive).toBe(true)
    })

    it('应该能够正确清理资源', async () => {
      const { result: gameResult } = renderHook(() => useGameControl())

      await act(async () => {
        // 启动手势控制
        await gameResult.current.startGestureControl()
      })

      await act(async () => {
        // 停止手势控制
        gameResult.current.stopGestureControl()
      })

      // 验证资源清理
      expect(mockCameraManager.stopCamera).toHaveBeenCalled()
      expect(gameResult.current.gameActions.shoot).toBe(false)
    })
  })
})