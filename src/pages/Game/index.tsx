import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Tooltip } from 'antd'
import {
  PlayCircleOutlined,
  TrophyOutlined,
  HomeOutlined,
  PauseCircleOutlined,
  StopOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { formatTime } from '../../utils/timeUtils'
import { useGameControl } from '../../hooks/useGameControl'
import request from '../../services/request'
import GestureVisualization from '../../components/GestureVisualization'
import PauseModal from '../../components/PauseModal'
import GameOverModal from '../../components/GameOverModal'
import ConfirmModal from '../../components/ConfirmModal'
import playerShipImage from '@/assets/image-removebg-preview.png'
import bulletRocketImage from '@/assets/bullet-rocket.png'
import enemyShip from '@/assets/enemy-ship.png'
import './index.less'

interface GameState {
  time: number
  score: number
  lives: number
  isPaused: boolean
  isPlaying: boolean
  combo: number
}

interface Enemy {
  id: number
  x: number
  y: number
  speed: number
  type: 'normal' | 'boss'
  imageType: 1 | 2 // 图片类型，1或2对应不同的敌机图片
  scale: number // 敌机大小倍数（1-3倍）
  health: number // 敌机生命值（需要多少发子弹击败）
  maxHealth: number // 最大生命值（用于显示血条）
}

// 生成敌机的辅助函数
const createEnemy = (
  id: number,
  x: number,
  y: number,
  type: 'normal' | 'boss' = 'normal',
  difficultyLevel: number = 0,
): Enemy => {
  const scale = 1 + Math.random() * 2 // 1-3倍大小
  const baseHealth = type === 'boss' ? 3 : 1 // boss基础生命值更高
  const health = Math.ceil(baseHealth * scale) // 根据大小调整生命值
  
  // 根据难度级别增加速度 - 将初始速度减慢一半
  const baseSpeed = 0.25 + Math.random() * 0.25 // 从0.5-1.0调整为0.25-0.5
  const speed = baseSpeed + difficultyLevel * 0.5 // 每个难度级别增加0.5的速度（原来是1）

  return {
    id,
    x,
    y,
    speed,
    type,
    imageType: Math.random() < 0.5 ? 1 : 2,
    scale,
    health,
    maxHealth: health,
  }
}

// 碰撞检测函数
const checkPlayerEnemyCollision = (
  playerX: number,
  playerY: number,
  enemies: Enemy[]
): Enemy[] => {
  const playerSize = 4 // 玩家飞机的碰撞半径
  const collisionEnemies: Enemy[] = []

  enemies.forEach(enemy => {
    const enemySize = 3 * enemy.scale // 敌机的碰撞半径，根据缩放调整
    const distance = Math.sqrt(
      Math.pow(playerX - enemy.x, 2) + Math.pow(playerY - enemy.y, 2)
    )

    // 如果距离小于两个物体的半径之和，则发生碰撞
    if (distance < playerSize + enemySize) {
      collisionEnemies.push(enemy)
    }
  })

  return collisionEnemies
}

const Game: React.FC = () => {
  const navigate = useNavigate()
  const gameAreaRef = useRef<HTMLDivElement>(null)

  // 游戏状态
  const [gameState, setGameState] = useState<GameState>({
    time: 0, // 游戏时间从0开始
    score: 0,
    lives: 3, // 玩家初始有3条命
    isPaused: false,
    isPlaying: false, // 初始状态为未开始
    combo: 0, // 连击数从0开始
  })

  // 难度级别状态
  const [difficultyLevel, setDifficultyLevel] = useState(0)

  // 游戏控制系统，传入游戏状态 - 只要游戏开始过就保持摄像头活跃
  const {
    playerPosition,
    gameActions,
    bullets,
    createBullet,
    clearBullets,
    updateBullets,
    currentGesture,
    gestureConfidence,
    isCameraActive,
    cameraError,
    handPosition,
    cameraState,
    gestureStatus,
    startGestureControl,
    stopGestureControl,
    resetPlayerPosition,
    videoRef,
    stream,
  } = useGameControl({ isPlaying: gameState.isPlaying, isPaused: gameState.isPaused })

  // 设置摄像头视频流
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    }
  }, [stream, videoRef])

  const [showPauseModal, setShowPauseModal] = useState(false)
  const [showGameOverModal, setShowGameOverModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmType, setConfirmType] = useState<'ranking' | 'home'>('ranking')

  // 敌机状态管理 - 所有敌机都放在屏幕上方
  const [enemies, setEnemies] = useState<Enemy[]>([
    createEnemy(1, 20, 5, 'normal', difficultyLevel),
    createEnemy(2, 40, 8, 'normal', difficultyLevel),
    createEnemy(3, 60, 12, 'boss', difficultyLevel),
    createEnemy(4, 80, 15, 'normal', difficultyLevel),
    createEnemy(5, 15, 18, 'boss', difficultyLevel),
    createEnemy(6, 35, 3, 'normal', difficultyLevel),
    createEnemy(7, 55, 10, 'normal', difficultyLevel),
    createEnemy(8, 75, 6, 'normal', difficultyLevel),
  ])

  // 启动摄像头
  useEffect(() => {
    const initCamera = async () => {
      await startGestureControl()
    }
    initCamera()

    // 组件卸载时停止摄像头和清理资源
    return () => {
      stopGestureControl()
      // 清理防抖定时器
      if (pauseDebounceRef.current) {
        clearTimeout(pauseDebounceRef.current)
      }
      // 清理射击定时器
      if (shootIntervalRef.current) {
        clearInterval(shootIntervalRef.current)
      }
    }
  }, [startGestureControl, stopGestureControl])

  // 玩家位置控制已由useGameControl hook处理

  // 手势暂停防抖
  const pauseDebounceRef = useRef<number | null>(null)
  const lastPauseTimeRef = useRef<number>(0)

  // 连续射击相关
  const shootIntervalRef = useRef<number | null>(null)
  const isShootingRef = useRef<boolean>(false)

  // 游戏开始时间跟踪
  const gameStartTimeRef = useRef<number>(0)
  // 暂停时间累计
  const pausedTimeRef = useRef<number>(0)
  // 暂停开始时间
  const pauseStartTimeRef = useRef<number>(0)
  // 游戏结束标志，防止重复调用endGame
  const gameEndedRef = useRef<boolean>(false)

  // 游戏循环
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) return

    // 记录游戏开始时间
    if (gameStartTimeRef.current === 0) {
      gameStartTimeRef.current = Date.now()
    }

    const gameLoop = setInterval(() => {
      // 计算精确的游戏时间（毫秒），排除暂停时间
      const currentTime = Date.now()
      const gameTime = currentTime - gameStartTimeRef.current - pausedTimeRef.current

      setGameState(prev => ({
        ...prev,
        time: Math.max(0, gameTime), // 确保时间不为负数
      }))

      // 移动敌机并处理子弹碰撞
      setEnemies((prevEnemies: Enemy[]): Enemy[] => {
        const movedEnemies = prevEnemies
          .map(enemy => ({
            ...enemy,
            y: enemy.y + enemy.speed,
          }))
          .filter(enemy => enemy.y < 100) // 移除超出屏幕的敌机

        // 检测玩家与敌机碰撞
        const collisionEnemies = checkPlayerEnemyCollision(
          playerPosition.x,
          playerPosition.y,
          movedEnemies
        )

        // 如果发生碰撞，扣除生命值并移除碰撞的敌机
        if (collisionEnemies.length > 0) {
          setGameState(prev => {
            const newLives = prev.lives - collisionEnemies.length
            
            // 如果生命值归零且游戏尚未结束，触发游戏结束
            if (newLives <= 0 && !gameEndedRef.current) {
              // 延迟一帧触发游戏结束，确保状态更新完成
              setTimeout(() => {
                endGame()
              }, 0)
            }
            
            return {
              ...prev,
              lives: Math.max(0, newLives), // 确保生命值不会小于0
              combo: 0, // 玩家掉命时连击归零
            }
          })
        }

        // 移除与玩家碰撞的敌机
        const enemiesAfterPlayerCollision = movedEnemies.filter(
          enemy => !collisionEnemies.some(collisionEnemy => collisionEnemy.id === enemy.id)
        )

        // 更新子弹并处理碰撞
        const collisionResult = updateBullets(enemiesAfterPlayerCollision)
        const { hitEnemies, remainingEnemies } = collisionResult

        // 更新分数和连击
        if (hitEnemies.length > 0) {
          setGameState(prev => ({
            ...prev,
            score: prev.score + hitEnemies.length * 10,
            combo: prev.combo + hitEnemies.length,
          }))
        }

        // 确保返回的敌机数组中的每个敌机都有明确的imageType值
        return remainingEnemies.map(enemy => ({
          ...enemy,
          imageType: enemy.imageType || 1, // 如果imageType未定义则默认为1
        }))
      })

      // 生成新敌机 - 根据难度级别调整生成概率和数量
      const baseSpawnRate = 0.02 // 基础2%概率
      const spawnRate = baseSpawnRate + (difficultyLevel * 0.03) // 每个难度级别增加3%概率
      
      if (Math.random() < spawnRate) {
        const enemyType = Math.random() < 0.1 ? 'boss' : 'normal'
        const newEnemy = createEnemy(Date.now(), Math.random() * 90, -5, enemyType, difficultyLevel)
        setEnemies(prev => [...prev, newEnemy])
      }
    }, 16) // 60FPS更新频率，确保流畅的手势响应和时间显示

    return () => clearInterval(gameLoop)
  }, [gameState.isPlaying, gameState.isPaused, updateBullets, difficultyLevel])

  // 难度递增系统 - 每20秒增加难度
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) return

    const difficultyTimer = setInterval(() => {
      setDifficultyLevel(prev => prev + 1)
    }, 20000) // 每20秒增加难度

    return () => clearInterval(difficultyTimer)
  }, [gameState.isPlaying, gameState.isPaused, difficultyLevel])

  // 处理连续射击
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) {
      // 游戏未进行时停止射击
      if (shootIntervalRef.current) {
        clearInterval(shootIntervalRef.current)
        shootIntervalRef.current = null
      }
      isShootingRef.current = false
      return
    }

    // 处理射击动作 - 握拳时连续发射
    if (gameActions.shoot && !isShootingRef.current) {
      isShootingRef.current = true

      // 立即发射第一颗子弹
      createBullet(playerPosition.x, playerPosition.y - 5)

      // 设置定时器，每500毫秒发射一颗子弹
      shootIntervalRef.current = window.setInterval(() => {
        createBullet(playerPosition.x, playerPosition.y - 5)
      }, 500)
    } else if (!gameActions.shoot && isShootingRef.current) {
      // 停止射击
      if (shootIntervalRef.current) {
        clearInterval(shootIntervalRef.current)
        shootIntervalRef.current = null
      }
      isShootingRef.current = false
    }

    // 处理暂停动作 - 增加防抖机制
    if (gameActions.pause) {
      const now = Date.now()
      const timeSinceLastPause = now - lastPauseTimeRef.current

      // 防抖：至少间隔1秒才能再次暂停
      if (timeSinceLastPause > 1000) {
        lastPauseTimeRef.current = now

        // 清除之前的防抖定时器
        if (pauseDebounceRef.current) {
          clearTimeout(pauseDebounceRef.current)
        }

        // 延迟执行暂停，避免误触
        pauseDebounceRef.current = window.setTimeout(() => {
          pauseGame()
        }, 200)
      }
    }
  }, [
    gameActions,
    gameState.isPlaying,
    gameState.isPaused,
    createBullet,
    playerPosition.x,
    playerPosition.y,
  ])

  // 游戏控制函数
  const startGame = async () => {
    // 开始游戏时确保摄像头已启动
    if (!isCameraActive) {
      await startGestureControl()
    }

    // 重置游戏开始时间和暂停时间
    gameStartTimeRef.current = Date.now()
    pausedTimeRef.current = 0
    pauseStartTimeRef.current = 0
    setGameState(prev => ({ ...prev, isPlaying: true, isPaused: false, time: 0 }))
  }

  const pauseGame = () => {
    // 清除防抖定时器
    if (pauseDebounceRef.current) {
      clearTimeout(pauseDebounceRef.current)
      pauseDebounceRef.current = null
    }

    // 清除射击定时器
    if (shootIntervalRef.current) {
      clearInterval(shootIntervalRef.current)
      shootIntervalRef.current = null
    }
    isShootingRef.current = false

    // 记录暂停开始时间
    pauseStartTimeRef.current = Date.now()

    setGameState(prev => ({ ...prev, isPaused: true }))
    setShowPauseModal(true)
  }

  const resumeGame = async () => {
    // 计算暂停时长并累加到总暂停时间
    if (pauseStartTimeRef.current > 0) {
      const pauseDuration = Date.now() - pauseStartTimeRef.current
      pausedTimeRef.current += pauseDuration
      pauseStartTimeRef.current = 0
    }

    setGameState(prev => ({ ...prev, isPaused: false }))
    setShowPauseModal(false)
  }

  const endGame = async () => {
    // 防止重复提交，如果游戏结束模态框已经显示则直接返回
    if (showGameOverModal) {
      return
    }

    // 设置游戏状态为结束
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
    }))

    // 清除防抖定时器
    if (pauseDebounceRef.current) {
      clearTimeout(pauseDebounceRef.current)
      pauseDebounceRef.current = null
    }

    // 清除射击定时器
    if (shootIntervalRef.current) {
      clearInterval(shootIntervalRef.current)
      shootIntervalRef.current = null
    }
    isShootingRef.current = false

    // 提交游戏成绩（只提交一次）
    if (!gameEndedRef.current) {
      gameEndedRef.current = true // 设置游戏结束标志，防止重复提交
      
      try {
        const { getOrCreateDeviceId } = await import('../../utils/deviceUtils')
        const deviceId = getOrCreateDeviceId()
        
        const gameResult = {
          deviceId,
          score: gameState.score
        }
        
        const result = await request<{
          success: boolean
          data: {
            recordId: string
            isNewBest: boolean
            currentBest: number
            message: string
          }
          timestamp: number
        }>({
          url: '/api/game/submit',
          method: 'post',
          data: gameResult
        })
        
        if (result.success && result.data.isNewBest) {
          console.log('新纪录！', result.data.message)
        }
      } catch (error) {
        // 错误已经在request服务中通过message.error显示给用户了
        console.error('提交游戏成绩失败:', error)
      }
    }

    // 关闭模态框并显示游戏结束模态框
    setShowPauseModal(false)
    setShowGameOverModal(true)

    // 关闭摄像头
    stopGestureControl()
  }

  // 通用游戏重置函数
  const resetGame = () => {
    // 清除防抖定时器
    if (pauseDebounceRef.current) {
      clearTimeout(pauseDebounceRef.current)
      pauseDebounceRef.current = null
    }

    // 清除射击定时器
    if (shootIntervalRef.current) {
      clearInterval(shootIntervalRef.current)
      shootIntervalRef.current = null
    }
    isShootingRef.current = false

    // 重置暂停时间记录
    lastPauseTimeRef.current = 0

    // 重置游戏开始时间
    gameStartTimeRef.current = 0
    // 重置暂停时间
    pausedTimeRef.current = 0
    pauseStartTimeRef.current = 0
    // 重置游戏结束标志
    gameEndedRef.current = false

    // 清空子弹
    clearBullets()

    // 重置玩家位置到初始位置
    resetPlayerPosition()

    // 重置难度级别
    setDifficultyLevel(0)

    // 重置敌机（使用初始难度级别0）- 所有敌机都放在屏幕上方
    setEnemies([
      createEnemy(1, 20, 5, 'normal', 0),
      createEnemy(2, 40, 8, 'normal', 0),
      createEnemy(3, 60, 12, 'boss', 0),
      createEnemy(4, 80, 15, 'normal', 0),
      createEnemy(5, 15, 18, 'boss', 0),
      createEnemy(6, 35, 3, 'normal', 0),
      createEnemy(7, 55, 10, 'normal', 0),
      createEnemy(8, 75, 6, 'normal', 0),
    ])

    setGameState({
      time: 0, // 重置时间为0
      score: 0,
      lives: 3, // 重置生命值为3
      isPaused: false,
      isPlaying: false, // 重置后回到未开始状态
      combo: 0,
    })
  }

  const handleGameOverRestart = async () => {
    // 关闭游戏结束模态框
    setShowGameOverModal(false)

    // 调用通用重置函数
    resetGame()

    // 重新启动摄像头
    try {
      await startGestureControl()
    } catch (error) {
      // 错误处理已在startGestureControl中完成
    }
  }

  const handleGameOverRanking = () => {
    setShowGameOverModal(false)
    navigate('/rank')
  }

  const handleGameOverHome = () => {
    setShowGameOverModal(false)
    navigate('/')
  }

  const restartGame = async () => {
    // 关闭暂停模态框
    setShowPauseModal(false)

    // 调用通用重置函数
    resetGame()

    // 重置游戏开始时间和暂停时间并直接开始游戏
    gameStartTimeRef.current = Date.now()
    pausedTimeRef.current = 0
    pauseStartTimeRef.current = 0
    setGameState(prev => ({ ...prev, isPlaying: true, time: 0 }))

    // 确保摄像头处于活跃状态
    if (!isCameraActive) {
      await startGestureControl()
    }
  }

  // 处理排行榜点击
  const handleRankingClick = () => {
    if (gameState.isPlaying && !gameState.isPaused) {
      setConfirmType('ranking')
      setShowConfirmModal(true)
    } else {
      navigate('/rank')
    }
  }

  // 处理返回首页点击
  const handleHomeClick = () => {
    if (gameState.isPlaying && !gameState.isPaused) {
      setConfirmType('home')
      setShowConfirmModal(true)
    } else {
      navigate('/')
    }
  }

  // 确认离开游戏
  const handleConfirmLeave = () => {
    // 清零游戏数据，不做记录
    resetGame()
    setShowConfirmModal(false)

    if (confirmType === 'ranking') {
      navigate('/rank')
    } else {
      navigate('/')
    }
  }

  // 取消离开，继续游戏
  const handleCancelLeave = () => {
    setShowConfirmModal(false)
  }

  return (
    <div className="game-container">
      {/* 顶部状态栏 */}
      <div className="game-header">
        <div className="game-info">
          <span className="time">时间 {formatTime(gameState.time)}</span>
          <span className="score">得分 {gameState.score}</span>
          <span className={`lives ${gameState.lives <= 1 ? 'low-health' : ''}`}>生命 {gameState.lives}</span>
          <span className="difficulty">难度 {difficultyLevel}</span>
        </div>
      </div>

      <div className="game-content">
        {/* 左侧面板 */}
        <div className="left-panel">
          {/* 摄像头预览 */}
          <div className="camera-section">
            <h3>摄像头预览</h3>
            <div className="camera-preview">
              {isCameraActive && stream ? (
                <video
                  ref={videoRef}
                  className="camera-video camera-video-mirrored"
                  autoPlay
                  playsInline
                  muted
                />
              ) : (
                <div className="camera-placeholder">
                  {cameraError ? (
                    <div className="camera-status error">
                      <div className="status-icon">📷</div>
                      <div className="status-text">摄像头访问失败</div>
                    </div>
                  ) : cameraState.isActive ? (
                    <div className="camera-status connecting">
                      <div className="loading-spinner"></div>
                      <div className="status-text">连接中...</div>
                    </div>
                  ) : (
                    <div className="camera-status inactive">
                      <div className="status-icon">📹</div>
                      <div className="status-text">摄像头未启动</div>
                    </div>
                  )}
                </div>
              )}

              {/* 摄像头控制按钮 */}
              <Tooltip
                title={
                  cameraError ? (
                    <div className="camera-tooltip">
                      <div className="tooltip-title">摄像头访问失败</div>
                      <div className="tooltip-content">
                        <p>
                          <strong>错误信息：</strong>
                          {cameraError}
                        </p>
                        {cameraError.includes('权限被拒绝') && (
                          <div className="permission-steps">
                            <p>
                              <strong>解决步骤：</strong>
                            </p>
                            <ol>
                              <li>点击地址栏左侧的 🔒 或 📷 图标</li>
                              <li>选择"允许"摄像头访问</li>
                              <li>刷新页面或点击重试</li>
                            </ol>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : isCameraActive ? (
                    '点击停止摄像头'
                  ) : (
                    <div className="camera-tooltip">
                      <div className="tooltip-title">启动摄像头</div>
                      <div className="tooltip-content">
                        <p>需要允许浏览器访问摄像头权限</p>
                        <p>用于手势识别控制游戏</p>
                      </div>
                    </div>
                  )
                }
                placement="top"
                overlayClassName="camera-control-tooltip"
              >
                <button
                  onClick={isCameraActive ? stopGestureControl : startGestureControl}
                  className={`camera-btn ${isCameraActive ? 'stop' : 'start'}`}
                  disabled={cameraState.isActive && !isCameraActive}
                >
                  {isCameraActive ? '停止摄像头' : cameraError ? '重试启动' : '启动摄像头'}
                </button>
              </Tooltip>
            </div>
          </div>

          {/* 手势识别状态框 */}
          <div className="gesture-recognition-panel">
            <div className="panel-header">
              <span className="panel-title">手势识别</span>
            </div>

            <div className="panel-content">
              {/* 手势可视化区域 */}
              <div className="gesture-visualization-area">
                <GestureVisualization 
                  handPosition={handPosition} 
                  gestureStatus={gestureStatus}
                  width={200} 
                  height={150} 
                />
              </div>

              {/* 状态信息区域 */}
              <div className="gesture-status-area">
                <div className="status-row">
                  <span className="status-label">识别状态</span>
                  <span className={`status-value ${isCameraActive ? 'active' : 'inactive'}`}>
                    {isCameraActive ? (currentGesture !== 'none' ? '正常' : '待检测') : '未启动'}
                  </span>
                </div>

                <div className="status-row">
                  <span className="status-label">关键点</span>
                  <span className="status-value">{handPosition ? '21/21' : '0/21'}</span>
                </div>

                <div className="status-row">
                  <span className="status-label">置信度</span>
                  <span className="status-value confidence">
                    {(gestureConfidence * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="status-row">
                  <span className="status-label">手势类型</span>
                  <span
                    className={`status-value gesture-type ${currentGesture === 'one' ? 'pause-gesture' : ''}`}
                  >
                    {currentGesture === 'none'
                      ? '无手势'
                      : currentGesture === 'open_palm'
                        ? '张开手掌'
                        : currentGesture === 'fist'
                          ? '握拳'
                          : currentGesture === 'one'
                            ? '食指比1 ⏸️'
                            : currentGesture === 'peace'
                              ? '比V'
                              : currentGesture}
                  </span>
                </div>

                {/* 暂停手势特殊提示 */}
                {currentGesture === 'one' && gameState.isPlaying && !gameState.isPaused && (
                  <div className="pause-gesture-hint">
                    <span className="hint-icon">⏸️</span>
                    <span className="hint-text">检测到暂停手势</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 手势控制说明 */}
          <div className="control-section">
            <h3>手势控制</h3>
            <div className="control-list">
              <div className="control-item">
                <span className="control-dot" style={{ backgroundColor: '#4CAF50' }}></span>
                <span>张开手掌 - 移动</span>
              </div>
              <div className="control-item">
                <span className="control-dot" style={{ backgroundColor: '#2196F3' }}></span>
                <span>握拳 - 射击</span>
              </div>
              <div className="control-item">
                <span className="control-dot" style={{ backgroundColor: '#FF9800' }}></span>
                <span>食指比1 - 暂停</span>
              </div>
            </div>
          </div>
        </div>

        {/* 中央游戏区域 */}
        <div className="game-area" ref={gameAreaRef}>
          <div className="game-background">
            {/* 玩家飞机 */}
            <div
              className="player-ship"
              style={{
                left: `${playerPosition.x}%`,
                top: `${playerPosition.y}%`,
              }}
            >
              <img src={playerShipImage} alt="玩家飞机" className="player-ship-image" />
            </div>

            {/* 敌机 */}
            {enemies.map(enemy => (
              <div
                key={enemy.id}
                className={`enemy-ship ${enemy.type}`}
                style={{
                  left: `${enemy.x}%`,
                  top: `${enemy.y}%`,
                }}
              >
                <img
                  src={enemyShip}
                  alt="敌机"
                  className={`enemy-ship-image ${enemy.imageType === 1 ? 'enemy-type-1' : 'enemy-type-2'}`}
                  style={{
                    transform: `scale(${enemy.scale})`,
                  }}
                />
                {/* 生命值显示 */}
                {enemy.health < enemy.maxHealth && (
                  <div className="enemy-health-bar">
                    <div
                      className="enemy-health-fill"
                      style={{
                        width: `${(enemy.health / enemy.maxHealth) * 100}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            ))}

            {/* 子弹效果 */}
            <div className="bullets">
              {bullets.map(bullet => (
                <div
                  key={bullet.id}
                  className="bullet"
                  style={{
                    left: `${bullet.x}%`,
                    top: `${bullet.y}%`,
                  }}
                >
                  <img src={bulletRocketImage} alt="子弹" className="bullet-image" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧面板 */}
        <div className="right-panel">
          {/* 战场雷达 */}
          <div className="radar-section">
            <h3>战场雷达</h3>
            <div className="radar-display">
              <div className="radar-grid">
                {/* 玩家位置 */}
                <div 
                  className="radar-dot player" 
                  style={{ 
                    left: `${playerPosition.x}%`, 
                    top: `${playerPosition.y}%`,
                    backgroundColor: '#00ff00',
                    border: '2px solid #ffffff',
                    zIndex: 10
                  }}
                ></div>
                
                {/* 当前敌机位置 */}
                {enemies.map(enemy => (
                  <div
                    key={`current-${enemy.id}`}
                    className="radar-dot enemy-current"
                    style={{
                      left: `${enemy.x}%`,
                      top: `${enemy.y}%`,
                      backgroundColor: enemy.type === 'boss' ? '#ff0000' : '#ff6600',
                      transform: `scale(${enemy.type === 'boss' ? 1.2 : 1})`,
                      zIndex: 5
                    }}
                  ></div>
                ))}
                
                {/* 预判敌机位置（1秒后） */}
                {enemies.map(enemy => {
                  // 计算1秒后的位置（60帧 * 1秒 = 60帧）
                  const predictedY = enemy.y + (enemy.speed * 60);
                  // 只显示仍在屏幕内的预判位置
                  if (predictedY < 100) {
                    return (
                      <div
                        key={`predicted-${enemy.id}`}
                        className="radar-dot enemy-predicted"
                        style={{
                          left: `${enemy.x}%`,
                          top: `${predictedY}%`,
                          backgroundColor: enemy.type === 'boss' ? '#ff9999' : '#ffcc99',
                          opacity: 0.6,
                          border: '1px dashed #ffffff',
                          transform: `scale(${enemy.type === 'boss' ? 1.1 : 0.9})`,
                          zIndex: 3
                        }}
                      ></div>
                    );
                  }
                  return null;
                })}
                
                {/* 雷达扫描线 */}
                <div className="radar-scan-line"></div>
              </div>
            </div>
          </div>

          {/* 连击数 */}
          <div className="combo-section">
            <div className="combo-container">
              <div className="combo-number">{gameState.combo}</div>
              <div className="combo-label">连击</div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="action-buttons">
            <Button
              icon={<TrophyOutlined />}
              onClick={handleRankingClick}
              className="action-btn ranking-btn"
            >
              排行榜
            </Button>
            <Button
              icon={<HomeOutlined />}
              onClick={handleHomeClick}
              className="action-btn home-btn"
            >
              返回首页
            </Button>
          </div>

          {/* 底部按钮 */}
          <div className="bottom-buttons">
            {!gameState.isPlaying ? (
              // 游戏未开始时显示开始游戏按钮
              <Button
                type="primary"
                onClick={startGame}
                className="start-game-btn"
                icon={<PlayCircleOutlined />}
                size="large"
              >
                开始游戏
              </Button>
            ) : (
              // 游戏进行中显示三个控制按钮
              <div className="game-control-buttons">
                <Button
                  onClick={pauseGame}
                  className="control-btn pause-btn"
                  icon={<PauseCircleOutlined />}
                  size="large"
                >
                  暂停游戏
                </Button>
                <Button
                  onClick={endGame}
                  className="control-btn end-btn"
                  icon={<StopOutlined />}
                  size="large"
                >
                  结束游戏
                </Button>
                <Button
                  onClick={restartGame}
                  className="control-btn restart-btn"
                  icon={<ReloadOutlined />}
                  size="large"
                >
                  重新开始
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 暂停游戏弹窗 */}
      <PauseModal
        visible={showPauseModal}
        onResume={resumeGame}
        onRestart={restartGame}
        gameStats={{
          score: gameState.score,
          time: gameState.time,
        }}
      />

      {/* 游戏结束弹窗 */}
      <GameOverModal
        visible={showGameOverModal}
        onRestart={handleGameOverRestart}
        onViewRanking={handleGameOverRanking}
        onBackHome={handleGameOverHome}
        gameStats={{
          score: gameState.score,
          time: gameState.time,
        }}
      />

      {/* 确认离开弹窗 */}
      <ConfirmModal
        visible={showConfirmModal}
        type={confirmType}
        onConfirm={handleConfirmLeave}
        onCancel={handleCancelLeave}
      />
    </div>
  )
}

export default Game
