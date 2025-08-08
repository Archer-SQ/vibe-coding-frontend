import { useCallback, useEffect, useRef, useState } from 'react'
import { useGestureRecognition } from './useGestureRecognition'
import { useBulletSystem, type Bullet, type Enemy } from './useBulletSystem'
import { GestureType } from '../types/gesture'

/**
 * 游戏控制相关类型
 */
interface PlayerPosition {
  x: number
  y: number
}

interface GameActions {
  shoot: boolean
  pause: boolean
}

interface UseGameControlReturn {
  // 玩家状态
  playerPosition: PlayerPosition
  gameActions: GameActions
  
  // 子弹系统
  bullets: Bullet[]
  createBullet: (x: number, y: number) => void
  clearBullets: () => void
  updateBullets: (enemies: Enemy[]) => { hitEnemies: Enemy[]; remainingBullets: Bullet[]; remainingEnemies: Enemy[] }
  
  // 手势状态
  currentGesture: string
  gestureConfidence: number
  isGestureActive: boolean
  handPosition: { x: number; y: number }
  
  // 摄像头状态
  isCameraActive: boolean
  cameraError?: string
  cameraState: {
    isActive: boolean;
    error?: string;
  }
  videoRef: React.RefObject<HTMLVideoElement>
  stream: MediaStream | null
  
  // 控制方法
  startGestureControl: () => Promise<void>
  stopGestureControl: () => void
  toggleGestureControl: () => void
  resetPlayerPosition: () => void
  
  // 配置
  updateSensitivity: (sensitivity: number) => void
  updateMovementBounds: (bounds: { minX: number; maxX: number; minY: number; maxY: number }) => void
  config: {
    enableGesture: boolean;
    smoothingFactor: number;
    debounceTime: number;
  }
}

/**
 * 游戏控制Hook
 * 基于手势识别提供游戏控制功能
 */
export const useGameControl = (gameState: { isPlaying: boolean; isPaused: boolean } = { isPlaying: false, isPaused: false }): UseGameControlReturn => {
  const { isPlaying: isGamePlaying, isPaused: isGamePaused } = gameState
  // 使用手势识别Hook
  const {
    gestureState,
    handPosition,
    cameraState,
    startCamera,
    stopCamera,
    toggleGesture,
    updateConfig,
    config,
    videoRef,
    stream
  } = useGestureRecognition()

  // 使用子弹系统Hook
  const {
    bullets,
    createBullet,
    clearBullets,
    updateBullets
  } = useBulletSystem()

  // 玩家位置状态
  const [playerPosition, setPlayerPosition] = useState<PlayerPosition>({
    x: 50, // 百分比位置
    y: 80
  })

  // 游戏动作状态
  const [gameActions, setGameActions] = useState<GameActions>({
    shoot: false,
    pause: false
  })

  // 移动边界配置
  const [movementBounds] = useState({
    minX: 5,
    maxX: 95,
    minY: 10,
    maxY: 90
  })

  // 灵敏度配置
  const [sensitivity, setSensitivity] = useState(1.0)
  
  // 位置平滑处理
  const lastPositionRef = useRef<PlayerPosition>({ x: 50, y: 80 })
  const smoothingFactor = 0.3 // 平滑因子，值越小越平滑

  // 动作防抖
  const actionDebounceRef = useRef<{ [key: string]: number }>({})
  const ACTION_DEBOUNCE_TIME = 100 // 动作防抖时间（毫秒）- 减少延迟以提高响应速度

  /**
   * 启动手势控制
   */
  const startGestureControl = useCallback(async (): Promise<void> => {
    try {
      await startCamera()
    } catch (error) {
      console.error('启动手势控制失败:', error)
      throw error
    }
  }, [startCamera])

  /**
   * 停止手势控制
   */
  const stopGestureControl = useCallback((): void => {
    stopCamera()
    // 重置游戏状态
    setGameActions({
      shoot: false,
      pause: false
    })
    // 清空子弹
    clearBullets()
  }, [stopCamera, clearBullets])

  /**
   * 切换手势控制
   */
  const toggleGestureControl = useCallback((): void => {
    toggleGesture()
  }, [toggleGesture])

  /**
   * 重置玩家位置
   */
  const resetPlayerPosition = useCallback((): void => {
    const initialPosition = {
      x: 50,
      y: 80
    }
    setPlayerPosition(initialPosition)
    lastPositionRef.current = initialPosition
  }, [])

  /**
   * 更新灵敏度
   */
  const updateSensitivity = useCallback((newSensitivity: number): void => {
    setSensitivity(Math.max(0.1, Math.min(3.0, newSensitivity)))
  }, [])

  /**
   * 更新移动边界
   */
  const updateMovementBounds = useCallback((bounds: { minX: number; maxX: number; minY: number; maxY: number }): void => {
    // 这里可以添加边界更新逻辑
    console.log('更新移动边界:', bounds)
  }, [])

  /**
   * 处理玩家移动
   */
  const handlePlayerMovement = useCallback(() => {
    // 优化：允许在张开手掌或握拳时都能移动，提高手势切换的流畅性
    if ((gestureState.type === GestureType.OPEN_PALM || gestureState.type === GestureType.FIST) && 
        config.enableGesture && isGamePlaying && !isGamePaused) {
      // 将手部位置转换为玩家位置
      // 坐标转换逻辑
      // 直接使用MediaPipe的原始坐标，不进行镜像转换
      // 因为CSS镜像只影响视频显示，不影响坐标系统
      const normalizedX = 1-handPosition.x
      const normalizedY = handPosition.y
      
      // 转换为百分比位置并应用灵敏度
      const targetX = normalizedX * 100 * sensitivity
      const targetY = normalizedY * 100 * sensitivity

      // 应用边界限制
      const boundedX = Math.max(movementBounds.minX, Math.min(movementBounds.maxX, targetX))
      const boundedY = Math.max(movementBounds.minY, Math.min(movementBounds.maxY, targetY))

      // 动态平滑处理：根据移动距离调整平滑因子
      const deltaX = Math.abs(boundedX - lastPositionRef.current.x)
      const deltaY = Math.abs(boundedY - lastPositionRef.current.y)
      const maxDelta = Math.max(deltaX, deltaY)
      
      // 握拳时使用更高的平滑因子，确保射击时位置稳定
      let dynamicSmoothingFactor
      if (gestureState.type === GestureType.FIST) {
        dynamicSmoothingFactor = maxDelta > 15 ? 0.6 : 0.3 // 握拳时更平滑
      } else {
        dynamicSmoothingFactor = maxDelta > 10 ? 0.8 : smoothingFactor // 张开手掌时更敏感
      }
      
      const smoothedX = lastPositionRef.current.x + (boundedX - lastPositionRef.current.x) * dynamicSmoothingFactor
      const smoothedY = lastPositionRef.current.y + (boundedY - lastPositionRef.current.y) * dynamicSmoothingFactor

      const newPosition = {
        x: smoothedX,
        y: smoothedY
      }

      // 更新位置
      setPlayerPosition(newPosition)
      lastPositionRef.current = newPosition
    }
  }, [gestureState.type, handPosition, config.enableGesture, sensitivity, movementBounds, smoothingFactor, isGamePlaying, isGamePaused])

  /**
   * 处理游戏动作
   */
  const handleGameActions = useCallback(() => {
    if (!config.enableGesture || !isGamePlaying) {
      return
    }

    const now = Date.now()
    const newActions: GameActions = {
      shoot: false,
      pause: false
    }

    // 处理射击动作 - 只在游戏未暂停时处理
    if (gestureState.type === GestureType.FIST && !isGamePaused) {
      const lastShoot = actionDebounceRef.current.shoot || 0
      if (now - lastShoot > ACTION_DEBOUNCE_TIME) {
        newActions.shoot = true
        actionDebounceRef.current.shoot = now
        // 使用ref中的最新位置创建子弹，从飞机前端发射
        createBullet(lastPositionRef.current.x, lastPositionRef.current.y - 8)
      }
    }

    // 处理暂停动作 - 无论是否暂停都能识别
    if (gestureState.type === GestureType.ONE) {
      const lastPause = actionDebounceRef.current.pause || 0
      if (now - lastPause > ACTION_DEBOUNCE_TIME) {
        newActions.pause = true
        actionDebounceRef.current.pause = now
      }
    }

    setGameActions(newActions)
  }, [gestureState.type, config.enableGesture, createBullet, isGamePlaying, isGamePaused])

  // 监听手势变化，更新玩家位置
  useEffect(() => {
    handlePlayerMovement()
  }, [handlePlayerMovement])

  // 监听手势变化，处理游戏动作（在位置更新之后）
  useEffect(() => {
    handleGameActions()
  }, [handleGameActions])

  // 自动清除动作状态
  useEffect(() => {
    if (gameActions.shoot || gameActions.pause) {
      const timer = setTimeout(() => {
        setGameActions({
          shoot: false,
          pause: false
        })
      }, 100) // 100ms后清除动作状态

      return () => clearTimeout(timer)
    }
  }, [gameActions])

  // 更新手势识别配置
  useEffect(() => {
    updateConfig({
      smoothingFactor: 0.15, // 减少平滑以提高响应速度
      debounceTime: 30,      // 进一步减少防抖时间
    })
  }, [updateConfig])

  return {
    // 玩家状态
    playerPosition,
    gameActions,
    
    // 子弹系统
    bullets,
    createBullet,
    clearBullets,
    updateBullets,
    
    // 手势状态
    currentGesture: gestureState.type,
    gestureConfidence: gestureState.confidence,
    isGestureActive: config.enableGesture,
    handPosition,
    
    // 摄像头状态
    isCameraActive: cameraState.isActive,
    cameraError: cameraState.error,
    cameraState,
    videoRef,
    stream,
    
    // 控制方法
    startGestureControl,
    stopGestureControl,
    toggleGestureControl,
    resetPlayerPosition,
    
    // 配置
    updateSensitivity,
    updateMovementBounds,
    config
  }
}