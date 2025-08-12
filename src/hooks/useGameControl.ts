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

  // 快速跟踪模式（用于手势重新进入时）
  const fastTrackingRef = useRef<{ active: boolean; startTime: number }>({ active: false, startTime: 0 })
  const FAST_TRACKING_DURATION = 500 // 快速跟踪模式持续时间（毫秒）

  // 动作防抖
  const actionDebounceRef = useRef<{ [key: string]: number }>({})
  const ACTION_DEBOUNCE_TIME = 100 // 动作防抖时间（毫秒）- 减少延迟以提高响应速度

  /**
   * 启动手势控制
   */
  const startGestureControl = useCallback(async (): Promise<void> => {
    await startCamera()
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
  }, [])

  /**
   * 处理玩家移动
   */
  const handlePlayerMovement = useCallback(() => {
    // 检查手势状态和手部位置是否有效
    // 修改检查逻辑：只有在检测到有效手势且有关键点数据时才移动飞机
    if (!handPosition || 
        typeof handPosition.x !== 'number' || 
        typeof handPosition.y !== 'number' ||
        !handPosition.landmarks || 
        handPosition.landmarks.length === 0) {
      // 没有有效的手势检测数据，飞机保持在当前位置不动
      return
    }

    // 允许在任何手势状态下都能移动（除了暂停手势）
    if (gestureState.type !== GestureType.ONE && 
        config.enableGesture && isGamePlaying && !isGamePaused) {
      
      // 坐标转换逻辑 - 修复镜像问题
      // MediaPipe 返回的坐标是相对于摄像头视图的，需要进行镜像转换
      const normalizedX = 1 - handPosition.x  // 水平镜像
      const normalizedY = handPosition.y      // 垂直方向保持不变
      
      // 转换为游戏区域的百分比位置
      // 添加边界检查，确保坐标在有效范围内
      const clampedX = Math.max(0, Math.min(1, normalizedX))
      const clampedY = Math.max(0, Math.min(1, normalizedY))
      
      // 转换为游戏区域坐标（0-100%）
      const targetX = clampedX * 100
      const targetY = clampedY * 100

      // 应用移动边界限制
      const boundedX = Math.max(movementBounds.minX, Math.min(movementBounds.maxX, targetX))
      const boundedY = Math.max(movementBounds.minY, Math.min(movementBounds.maxY, targetY))

      // 动态平滑处理
      const deltaX = Math.abs(boundedX - lastPositionRef.current.x)
      const deltaY = Math.abs(boundedY - lastPositionRef.current.y)
      const maxDelta = Math.max(deltaX, deltaY)
      
      // 检测是否是手势重新进入（位置差距很大）
      const isLargeJump = maxDelta > 30 // 位置差距超过30%认为是重新进入
      const currentTime = Date.now()
      
      // 管理快速跟踪模式
      if (isLargeJump && !fastTrackingRef.current.active) {
        // 启动快速跟踪模式
        fastTrackingRef.current = { active: true, startTime: currentTime }
      } else if (fastTrackingRef.current.active && 
                 currentTime - fastTrackingRef.current.startTime > FAST_TRACKING_DURATION) {
        // 快速跟踪模式超时，关闭
        fastTrackingRef.current.active = false
      }
      
      // 根据手势类型、位置差距和快速跟踪模式调整平滑因子
      let dynamicSmoothingFactor
      if (fastTrackingRef.current.active) {
        // 快速跟踪模式：极高响应速度
        dynamicSmoothingFactor = 0.98
      } else if (isLargeJump) {
        // 大幅位置跳跃时（通常是重新进入），快速响应
        dynamicSmoothingFactor = 0.95
      } else if (gestureState.type === GestureType.FIST) {
        // 握拳时稍微平滑一些，保持射击稳定性
        dynamicSmoothingFactor = maxDelta > 15 ? 0.7 : 0.4
      } else {
        // 张开手掌时更敏感，提高移动响应速度
        dynamicSmoothingFactor = maxDelta > 10 ? 0.9 : 0.6
      }
      
      // 应用灵敏度调整
      const sensitivityAdjustedX = lastPositionRef.current.x + (boundedX - lastPositionRef.current.x) * dynamicSmoothingFactor * sensitivity
      const sensitivityAdjustedY = lastPositionRef.current.y + (boundedY - lastPositionRef.current.y) * dynamicSmoothingFactor * sensitivity

      const newPosition = {
        x: sensitivityAdjustedX,
        y: sensitivityAdjustedY
      }

      // 更新位置
      setPlayerPosition(newPosition)
      lastPositionRef.current = newPosition
    }
  }, [gestureState.type, handPosition, config.enableGesture, sensitivity, movementBounds, isGamePlaying, isGamePaused])

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