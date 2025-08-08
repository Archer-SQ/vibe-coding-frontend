import { useRef, useCallback, useEffect, useState } from 'react'
import {
  GestureType,
  type GestureState,
  type HandPosition,
  type CameraState,
  type GestureConfig,
  type GameControl,
  type UseGestureRecognitionReturn,
} from '../types/gesture'
import { cameraManager } from '../utils/cameraManager'

interface LandmarkPoint {
  x: number
  y: number
  z: number
}

interface Results {
  multiHandLandmarks?: LandmarkPoint[][]
}

// 定义 Hands 类型接口
interface Hands {
  setOptions(options: {
    maxNumHands: number
    modelComplexity: number
    minDetectionConfidence: number
    minTrackingConfidence: number
  }): void
  onResults(callback: (results: Results) => void): void
  send(data: { image: HTMLVideoElement }): Promise<void>
  close(): void
}

/**
 * 手势识别与控制系统 Hook
 * 基于MediaPipe Hands实现真实的手势识别
 */
export const useGestureRecognition = (): UseGestureRecognitionReturn => {
  // 摄像头相关引用
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const handsRef = useRef<Hands | null>(null)

  // 监听全局摄像头状态变化
  useEffect(() => {
    const handleCameraStatusChange = () => {
      const { isActive, stream } = cameraManager.getStatus()
      if (!isActive) {
        console.log('📷 全局摄像头已关闭，同步本地状态')
        setCameraState({
          isConnected: false,
          isActive: false,
        })
        streamRef.current = null
      } else if (stream) {
        streamRef.current = stream
      }
    }

    cameraManager.addStatusListener(handleCameraStatusChange)

    return () => {
      cameraManager.removeStatusListener(handleCameraStatusChange)
    }
  }, [])

  // 状态管理
  const [gestureState, setGestureState] = useState<GestureState>({
    type: GestureType.NONE,
    confidence: 0,
    timestamp: Date.now(),
  })

  const [handPosition, setHandPosition] = useState<HandPosition>({
    x: 0.5,
    y: 0.5,
    landmarks: [],
  })

  const [cameraState, setCameraState] = useState<CameraState>({
    isConnected: false,
    isActive: false,
  })

  const [gameControl, setGameControl] = useState<GameControl>({
    move: { x: 0, y: 0 },
    actions: { shoot: false, pause: false },
  })

  const [config, setConfig] = useState<GestureConfig>({
    enableGesture: true,
    confidenceThreshold: 0.7, // 提高置信度阈值，减少误识别
    debounceTime: 150, // 适中的防抖时间
    smoothingFactor: 0.2, // 减少平滑因子以提高响应速度
  })

  // 防抖处理
  const debounceRef = useRef<{ [key: string]: number }>({})

  // 手势稳定性检查（专门用于暂停手势）
  const gestureStabilityRef = useRef<{
    type: GestureType | null
    startTime: number
    count: number
  }>({
    type: null,
    startTime: 0,
    count: 0,
  })

  /**
   * 初始化MediaPipe Hands
   */
  const initializeHands = useCallback(async () => {
    try {
      // 动态加载MediaPipe脚本
      if (!(window as Window & typeof globalThis & { Hands?: () => void }).Hands) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      const HandsConstructor = (window as Window & typeof globalThis & { Hands?: new (options: { locateFile: (file: string) => string }) => Hands }).Hands;
      if (!HandsConstructor) {
        throw new Error('MediaPipe Hands 未加载成功');
      }
      const hands = new HandsConstructor({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        },
      })

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0, // 降低模型复杂度以提高性能
        minDetectionConfidence: 0.7, // 提高检测置信度
        minTrackingConfidence: 0.7, // 提高跟踪置信度
      })

      hands.onResults(onHandsResults)
      handsRef.current = hands

      return hands
    } catch (error) {
      console.error('MediaPipe初始化失败:', error)
      throw error
    }
  }, [])

  /**
   * 处理MediaPipe手势识别结果
   */
  const onHandsResults = useCallback(
    (results: Results) => {
      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        // 没有检测到手部，重置状态
        setGestureState({
          type: GestureType.NONE,
          confidence: 0,
          timestamp: Date.now(),
        })
        setGameControl({
          move: { x: 0, y: 0 },
          actions: { shoot: false, pause: false },
        })
        return
      }

      const landmarks = results.multiHandLandmarks[0]

      // 计算手部中心位置
      const centerX =
        landmarks.reduce((sum: number, point: LandmarkPoint) => sum + point.x, 0) / landmarks.length
      const centerY =
        landmarks.reduce((sum: number, point: LandmarkPoint) => sum + point.y, 0) / landmarks.length

      // 动态平滑更新手部位置
      const deltaX = Math.abs(centerX - handPosition.x)
      const deltaY = Math.abs(centerY - handPosition.y)
      const maxDelta = Math.max(deltaX, deltaY)

      // 快速移动时减少平滑，提高响应速度
      const dynamicSmoothingFactor = maxDelta > 0.1 ? 0.9 : config.smoothingFactor

      setHandPosition(prev => ({
        x: prev.x + (centerX - prev.x) * dynamicSmoothingFactor,
        y: prev.y + (centerY - prev.y) * dynamicSmoothingFactor,
        landmarks: landmarks.map((point: { x: number; y: number; z: number }) => [
          point.x,
          point.y,
          point.z,
        ]),
      }))

      // 识别手势
      const gesture = recognizeGesture(landmarks)
      if (gesture) {
        updateGestureState(gesture, { x: centerX, y: centerY })
      }
    },
    [config.smoothingFactor],
  )

  /**
   * 基于手部关键点识别手势
   */
  const recognizeGesture = (landmarks: Array<{ x: number; y: number; z: number }>) => {
    try {
      // 检查 landmarks 数组长度，MediaPipe 手部模型需要 21 个关键点
      if (!landmarks || landmarks.length < 21) {
        console.warn('手势识别: landmarks 数据不完整，需要 21 个关键点，当前只有', landmarks?.length || 0)
        return {
          type: GestureType.NONE,
          confidence: 0.1,
          timestamp: Date.now(),
        }
      }

      // 获取关键点
      const thumb_tip = landmarks[4]
      const thumb_ip = landmarks[3]
      const thumb_mcp = landmarks[2]
      const index_tip = landmarks[8]
      const index_pip = landmarks[6]
      const index_mcp = landmarks[5]
      const middle_tip = landmarks[12]
      const middle_pip = landmarks[10]
      const middle_mcp = landmarks[9]
      const ring_tip = landmarks[16]
      const ring_pip = landmarks[14]
      const ring_mcp = landmarks[13]
      const pinky_tip = landmarks[20]
      const pinky_pip = landmarks[18]
      const pinky_mcp = landmarks[17]

      // 验证所有关键点都存在且有效
      const requiredPoints = [
        thumb_tip, thumb_ip, thumb_mcp,
        index_tip, index_pip, index_mcp,
        middle_tip, middle_pip, middle_mcp,
        ring_tip, ring_pip, ring_mcp,
        pinky_tip, pinky_pip, pinky_mcp
      ]

      if (requiredPoints.some(point => !point || typeof point.y !== 'number')) {
        console.warn('手势识别: 关键点数据无效')
        return {
          type: GestureType.NONE,
          confidence: 0.1,
          timestamp: Date.now(),
        }
      }

      // 更精确的手指伸直判断（考虑多个关节点）
      const isThumbUp = thumb_tip.y < thumb_ip.y && thumb_tip.y < thumb_mcp.y
      const isIndexUp = index_tip.y < index_pip.y && index_tip.y < index_mcp.y
      const isMiddleUp = middle_tip.y < middle_pip.y && middle_tip.y < middle_mcp.y
      const isRingUp = ring_tip.y < ring_pip.y && ring_tip.y < ring_mcp.y
      const isPinkyUp = pinky_tip.y < pinky_pip.y && pinky_tip.y < pinky_mcp.y

      const upFingers = [isThumbUp, isIndexUp, isMiddleUp, isRingUp, isPinkyUp]
      const upCount = upFingers.filter(Boolean).length

      // 平衡的手势识别逻辑 - 食指比1适度限制

      // 食指比1：食指伸直，但限制其他手指的状态
      if (isIndexUp && upCount === 1) {
        // 严格模式：只有食指伸直
        return {
          type: GestureType.ONE,
          confidence: 0.9,
          timestamp: Date.now(),
        }
      } else if (
        isIndexUp &&
        upCount === 2 &&
        isThumbUp &&
        !isMiddleUp &&
        !isRingUp &&
        !isPinkyUp
      ) {
        // 宽松模式：食指+拇指伸直（常见的比1手势）
        return {
          type: GestureType.ONE,
          confidence: 0.8,
          timestamp: Date.now(),
        }
      } else if (upCount <= 1 && !isIndexUp) {
        // 握拳：最多只有拇指伸直，食指必须弯曲
        return {
          type: GestureType.FIST,
          confidence: 0.9,
          timestamp: Date.now(),
        }
      } else if (upCount >= 3 && isIndexUp && isMiddleUp) {
        // 张开手掌：至少3个手指伸直，包括食指和中指
        return {
          type: GestureType.OPEN_PALM,
          confidence: 0.9,
          timestamp: Date.now(),
        }
      } else if (upCount === 2 && isIndexUp && isMiddleUp) {
        // 两个手指伸直（食指+中指）倾向于识别为张开手掌
        return {
          type: GestureType.OPEN_PALM,
          confidence: 0.8,
          timestamp: Date.now(),
        }
      }

      return {
        type: GestureType.NONE,
        confidence: 0.3,
        timestamp: Date.now(),
      }
    } catch (error) {
      console.error('手势识别错误:', error)
      return null
    }
  }

  /**
   * 启动摄像头
   */
  const startCamera = useCallback(async (): Promise<void> => {
    try {
      // 清理之前的实例
      if (handsRef.current) {
        try {
          handsRef.current.close()
        } catch (error) {
          console.warn('清理旧的MediaPipe实例时出错:', error)
        }
        handsRef.current = null
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      // 使用全局摄像头管理器启动摄像头
      const stream = await cameraManager.startCamera()
      streamRef.current = stream

      // 设置视频元素到全局管理器
      if (videoRef.current) {
        cameraManager.setVideoElement(videoRef.current)
      }

      setCameraState({
        isConnected: true,
        isActive: true,
        deviceId: stream.getVideoTracks()[0]?.getSettings().deviceId,
      })

      // 重新初始化MediaPipe
      await initializeHands()

      // 开始手势识别循环
      startGestureRecognition()
    } catch (error) {
      console.error('摄像头启动失败:', error)

      let errorMessage = '摄像头访问失败'

      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage =
              '摄像头权限被拒绝，请点击地址栏的摄像头图标允许访问，或在浏览器设置中允许此网站使用摄像头'
            break
          case 'NotFoundError':
            errorMessage = '未找到摄像头设备，请确保您的设备有摄像头并且已正确连接'
            break
          case 'NotReadableError':
            errorMessage = '摄像头被其他应用占用，请关闭其他使用摄像头的应用后重试'
            break
          case 'OverconstrainedError':
            errorMessage = '摄像头不支持所需的分辨率，请尝试使用其他摄像头'
            break
          case 'SecurityError':
            errorMessage = '安全限制：请确保网站使用 HTTPS 协议或在本地环境中运行'
            break
          default:
            errorMessage = error.message || '摄像头访问失败'
        }
      }

      setCameraState({
        isConnected: false,
        isActive: false,
        error: errorMessage,
      })
    }
  }, [initializeHands])

  /**
   * 停止摄像头
   */
  const stopCamera = useCallback((): void => {
    console.log('🔴 useGestureRecognition: 停止摄像头')

    // 停止动画帧循环
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // 清理MediaPipe hands实例
    if (handsRef.current) {
      try {
        handsRef.current.close()
      } catch (error) {
        console.warn('MediaPipe hands关闭时出错:', error)
      }
      handsRef.current = null
    }

    // 清理本地视频元素
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.load()
      console.log('🎥 本地视频元素已清理')
    }

    // 使用全局摄像头管理器停止摄像头
    cameraManager.stopCamera()
    streamRef.current = null

    // 更新状态
    setCameraState({
      isConnected: false,
      isActive: false,
    })

    // 重置状态
    setGestureState({
      type: GestureType.NONE,
      confidence: 0,
      timestamp: Date.now(),
    })

    setGameControl({
      move: { x: 0, y: 0 },
      actions: { shoot: false, pause: false },
    })
  }, [])

  /**
   * 开始手势识别循环
   */
  const startGestureRecognition = useCallback((): void => {
    if (!config.enableGesture || !videoRef.current || !cameraState.isActive || !handsRef.current) {
      return
    }

    const processFrame = async () => {
      if (!videoRef.current || !cameraState.isActive || !handsRef.current) {
        return
      }

      try {
        // 发送视频帧到MediaPipe进行处理
        await handsRef.current.send({ image: videoRef.current })
      } catch (error) {
        console.error('手势识别处理错误:', error)
      }

      // 继续下一帧
      animationFrameRef.current = requestAnimationFrame(processFrame)
    }

    processFrame()
  }, [config.enableGesture, cameraState.isActive])

  /**
   * 更新手势状态
   */
  const updateGestureState = useCallback(
    (gesture: GestureState, position: HandPosition): void => {
      // 置信度过滤
      if (gesture.confidence < config.confidenceThreshold) {
        return
      }

      const now = Date.now()

      // 暂停手势处理 - 严格的稳定性检查
      if (gesture.type === GestureType.ONE) {
        // 检查手势稳定性
        if (gestureStabilityRef.current.type === GestureType.ONE) {
          gestureStabilityRef.current.count++
          // 需要连续检测到暂停手势至少3次，且持续时间超过800ms
          if (
            gestureStabilityRef.current.count >= 3 &&
            now - gestureStabilityRef.current.startTime >= 800
          ) {
            // 检查防抖
            const lastTime = debounceRef.current[gesture.type] || 0
            if (now - lastTime >= 1500) {
              // 暂停手势防抖时间增加到1.5秒
              debounceRef.current[gesture.type] = now
              setGestureState(gesture)
              convertToGameControl(gesture, position)
            }
            // 重置稳定性检查
            gestureStabilityRef.current = { type: null, startTime: 0, count: 0 }
          }
        } else {
          // 开始新的稳定性检查
          gestureStabilityRef.current = {
            type: GestureType.ONE,
            startTime: now,
            count: 1,
          }
        }
        return
      } else {
        // 非暂停手势，重置稳定性检查
        gestureStabilityRef.current = { type: null, startTime: 0, count: 0 }
      }

      // 优化的防抖处理 - 不同手势类型使用不同的防抖时间
      const lastTime = debounceRef.current[gesture.type] || 0
      let debounceTime = config.debounceTime

      // 移动手势（张开手掌）使用更短的防抖时间
      if (gesture.type === GestureType.OPEN_PALM) {
        debounceTime = 50 // 50ms防抖，确保流畅移动
      }
      // 射击手势（握拳）使用中等防抖时间
      else if (gesture.type === GestureType.FIST) {
        debounceTime = 100 // 100ms防抖，避免误触但保持响应
      }

      if (now - lastTime < debounceTime) {
        return
      }
      debounceRef.current[gesture.type] = now

      // 更新手势状态
      setGestureState(gesture)

      // 转换为游戏控制指令
      convertToGameControl(gesture, position)
    },
    [config],
  )

  /**
   * 将手势转换为游戏控制指令
   */
  const convertToGameControl = useCallback(
    (gesture: GestureState, position: HandPosition): void => {
      const newControl: GameControl = {
        move: { x: 0, y: 0 },
        actions: { shoot: false, pause: false },
      }

      switch (gesture.type) {
        case GestureType.OPEN_PALM:
          // 张开手掌控制移动
          newControl.move.x = (position.x - 0.5) * 2 // 转换为 -1 到 1
          newControl.move.y = (position.y - 0.5) * 2
          break

        case GestureType.FIST:
          // 握拳射击
          newControl.actions.shoot = true
          break

        case GestureType.ONE:
          // 食指比1暂停
          newControl.actions.pause = true
          break

        default:
          // 无手势或其他手势，保持默认状态
          break
      }

      setGameControl(newControl)
    },
    [],
  )

  /**
   * 切换手势识别开关
   */
  const toggleGesture = useCallback((): void => {
    setConfig(prev => ({
      ...prev,
      enableGesture: !prev.enableGesture,
    }))
  }, [])

  /**
   * 更新配置
   */
  const updateConfig = useCallback((newConfig: Partial<GestureConfig>): void => {
    setConfig(prev => ({ ...prev, ...newConfig }))
  }, [])

  // 清理资源
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  // 当手势识别开关变化时，重新启动识别
  useEffect(() => {
    if (config.enableGesture && cameraState.isActive) {
      startGestureRecognition()
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [config.enableGesture, cameraState.isActive, startGestureRecognition])

  return {
    // 状态
    gestureState,
    handPosition,
    cameraState,
    gameControl,

    // 控制方法
    startCamera,
    stopCamera,
    toggleGesture,
    updateConfig,

    // 配置
    config,

    // 摄像头引用和流
    videoRef,
    stream: streamRef.current,
  }
}
