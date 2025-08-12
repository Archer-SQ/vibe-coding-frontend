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
  const isMediaPipeInitializedRef = useRef<boolean>(false)

  // 监听全局摄像头状态变化
  useEffect(() => {
    const handleCameraStatusChange = () => {
      const { isActive, stream } = cameraManager.getStatus()
      if (!isActive) {
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

  // 添加一个稳定的手部位置引用，避免状态更新丢失
  const stableHandPositionRef = useRef<HandPosition>({
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
      let HandsConstructor: new (options: { locateFile: (file: string) => string }) => Hands;

      // 优先尝试使用本地安装的MediaPipe包
      try {
        console.log('🔄 尝试加载本地MediaPipe包...');
        const { Hands } = await import('@mediapipe/hands');
        HandsConstructor = Hands as any;
        console.log('✅ 成功使用本地MediaPipe包');
      } catch (localError) {
        console.warn('❌ 本地MediaPipe包加载失败，尝试CDN加载:', localError);
        
        // 回退到CDN加载
        console.log('🔄 检查CDN MediaPipe是否已加载...');
        if (!(window as Window & typeof globalThis & { Hands?: () => void }).Hands) {
          console.log('🔄 从CDN加载MediaPipe脚本...');
          await new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
            script.onload = () => {
              console.log('✅ CDN脚本加载成功');
              resolve(undefined);
            }
            script.onerror = (error) => {
              console.error('❌ CDN脚本加载失败:', error);
              reject(error);
            }
            document.head.appendChild(script)
          })
        }

        const WindowHands = (window as Window & typeof globalThis & { Hands?: new (options: { locateFile: (file: string) => string }) => Hands }).Hands;
         if (!WindowHands) {
           throw new Error('MediaPipe Hands CDN加载失败 - window.Hands未定义');
         }
         HandsConstructor = WindowHands;
        console.log('✅ 成功使用CDN MediaPipe包');
      }

      console.log('🔄 创建MediaPipe Hands实例...');
      const hands = new HandsConstructor({
        locateFile: (file: string) => {
          const url = `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          // 只在首次加载时打印文件信息，避免重复打印
          if (file === 'hands_solution_simd_wasm_bin.js') {
            console.log(`📁 加载MediaPipe核心文件: ${file}`);
          }
          return url;
        },
      })

      console.log('⚙️ 配置MediaPipe选项...');
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0, // 降低模型复杂度以提高性能
        minDetectionConfidence: 0.6, // 适当降低检测置信度，提高稳定性
        minTrackingConfidence: 0.6, // 适当降低跟踪置信度，提高稳定性
      })

      console.log('🎯 设置结果回调函数...');
      hands.onResults(onHandsResults)
      
      handsRef.current = hands
      isMediaPipeInitializedRef.current = true

      console.log('✅ MediaPipe初始化完成');
      return hands
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'MediaPipe初始化失败'
      console.error('MediaPipe初始化失败:', error)
      console.error('当前环境信息:', {
        userAgent: navigator.userAgent,
        protocol: location.protocol,
        hostname: location.hostname,
        hasMediaDevices: !!navigator.mediaDevices,
        hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      })
      
      setCameraState(prev => ({
        ...prev,
        error: `${errorMessage}\n\n环境检查:\n- 协议: ${location.protocol}\n- 域名: ${location.hostname}\n- MediaDevices支持: ${navigator.mediaDevices ? '是' : '否'}`
      }))
      throw error
    }
  }, [])

  /**
   * 处理MediaPipe手势识别结果
   */
  const onHandsResults = useCallback(
    (results: Results) => {
      // 确保MediaPipe已完全初始化
      if (!isMediaPipeInitializedRef.current) {
        return
      }
      
      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        // 没有检测到手部，重置手势状态但保持最后的手部位置
        setGestureState({
          type: GestureType.NONE,
          confidence: 0,
          timestamp: Date.now(),
        })
        setGameControl({
          move: { x: 0, y: 0 },
          actions: { shoot: false, pause: false },
        })
        
        // 保持最后有效的手部位置，只清空关键点数据
        // 这样飞机就不会自动回到中心，而是停留在失去检测时的位置
        const preservedPosition = {
          x: stableHandPositionRef.current.x, // 保持最后的x位置
          y: stableHandPositionRef.current.y, // 保持最后的y位置
          landmarks: [], // 清空关键点数据，用于手势连线图的隐藏
        }
        stableHandPositionRef.current = preservedPosition
        setHandPosition(preservedPosition)
        return
      }

      const landmarks = results.multiHandLandmarks[0]

      // 计算手部中心位置
      const centerX =
        landmarks.reduce((sum: number, point: LandmarkPoint) => sum + point.x, 0) / landmarks.length
      const centerY =
        landmarks.reduce((sum: number, point: LandmarkPoint) => sum + point.y, 0) / landmarks.length

      // 转换关键点数据格式
      const landmarksArray = landmarks.map((point: { x: number; y: number; z: number }) => [
        point.x,
        point.y,
        point.z,
      ])

      // 动态平滑更新手部位置
      const deltaX = Math.abs(centerX - handPosition.x)
      const deltaY = Math.abs(centerY - handPosition.y)
      const maxDelta = Math.max(deltaX, deltaY)

      // 检测是否是手势重新进入（关键点从空变为有数据）
      const isReEntering = (!stableHandPositionRef.current.landmarks || stableHandPositionRef.current.landmarks.length === 0) && landmarksArray.length > 0

      // 优化平滑因子计算
      let dynamicSmoothingFactor
      if (isReEntering) {
        // 手势重新进入时，根据位置差距动态调整
        if (maxDelta > 0.3) {
          // 位置差距很大，快速跟上
          dynamicSmoothingFactor = 0.95
        } else if (maxDelta > 0.15) {
          // 位置差距中等，中等速度跟上
          dynamicSmoothingFactor = 0.8
        } else {
          // 位置差距较小，正常跟上
          dynamicSmoothingFactor = 0.6
        }
      } else {
        // 正常跟踪时的平滑处理
        dynamicSmoothingFactor = maxDelta > 0.1 ? 0.9 : config.smoothingFactor
      }

      // 对关键点数据也进行平滑处理
      let smoothedLandmarks = landmarksArray
      if (!isReEntering && stableHandPositionRef.current.landmarks && stableHandPositionRef.current.landmarks.length === landmarksArray.length) {
        // 正常跟踪时进行平滑处理
        smoothedLandmarks = landmarksArray.map((newPoint, index) => {
          const oldPoint = stableHandPositionRef.current.landmarks![index]
          return [
            oldPoint[0] + (newPoint[0] - oldPoint[0]) * dynamicSmoothingFactor,
            oldPoint[1] + (newPoint[1] - oldPoint[1]) * dynamicSmoothingFactor,
            oldPoint[2] + (newPoint[2] - oldPoint[2]) * dynamicSmoothingFactor,
          ]
        })
      }
      // 重新进入时直接使用新的关键点数据，不进行平滑处理

      // 更新手部位置状态，确保包含平滑处理后的关键点数据
      const updatedPosition = {
        x: isReEntering ? centerX : stableHandPositionRef.current.x + (centerX - stableHandPositionRef.current.x) * dynamicSmoothingFactor,
        y: isReEntering ? centerY : stableHandPositionRef.current.y + (centerY - stableHandPositionRef.current.y) * dynamicSmoothingFactor,
        landmarks: smoothedLandmarks,
      }

      // 同时更新引用和状态
      stableHandPositionRef.current = updatedPosition
      setHandPosition(updatedPosition)

      // 手势识别
      if (landmarks.length >= 21) {
        const gesture = recognizeGesture(landmarks)
        if (gesture) {
          // 使用更新后的位置数据进行手势识别
          updateGestureState(gesture, updatedPosition)
        }
      }
    },
    [config.smoothingFactor, handPosition.x, handPosition.y, handPosition.landmarks],
  )

  /**
   * 识别手势类型
   */
  const recognizeGesture = useCallback((landmarks: LandmarkPoint[]): GestureState | null => {
    try {
      if (!landmarks || landmarks.length < 21) {
        return null
      }

      // 获取关键点
      const thumbTip = landmarks[4] // 拇指尖
      const thumbIp = landmarks[3] // 拇指第二关节
      const indexTip = landmarks[8] // 食指尖
      const indexPip = landmarks[6] // 食指第二关节
      const middleTip = landmarks[12] // 中指尖
      const middlePip = landmarks[10] // 中指第二关节
      const ringTip = landmarks[16] // 无名指尖
      const ringPip = landmarks[14] // 无名指第二关节
      const pinkyTip = landmarks[20] // 小指尖
      const pinkyPip = landmarks[18] // 小指第二关节

      // 获取手指关节点（MCP - 掌指关节）
      const indexMcp = landmarks[5] // 食指掌指关节
      const middleMcp = landmarks[9] // 中指掌指关节
      const ringMcp = landmarks[13] // 无名指掌指关节
      const pinkyMcp = landmarks[17] // 小指掌指关节

      // 计算每个手指是否伸直 - 改进判断逻辑
      // 拇指特殊处理：使用水平距离判断
      const thumbDistance = Math.abs(thumbTip.x - thumbIp.x)
      const isThumbUp = thumbDistance > 0.04 // 拇指张开的阈值

      // 其他手指使用垂直距离判断，增加容错性
      const isIndexUp = (indexTip.y < indexPip.y) && (indexPip.y < indexMcp.y)
      const isMiddleUp = (middleTip.y < middlePip.y) && (middlePip.y < middleMcp.y)
      const isRingUp = (ringTip.y < ringPip.y) && (ringPip.y < ringMcp.y)
      const isPinkyUp = (pinkyTip.y < pinkyPip.y) && (pinkyPip.y < pinkyMcp.y)

      const upFingers = [isThumbUp, isIndexUp, isMiddleUp, isRingUp, isPinkyUp]
      const upCount = upFingers.filter(Boolean).length

      // 计算手指弯曲程度，用于更准确的握拳识别
      const fingerCurvatures = [
        Math.abs(indexTip.y - indexMcp.y) / Math.abs(indexPip.y - indexMcp.y),
        Math.abs(middleTip.y - middleMcp.y) / Math.abs(middlePip.y - middleMcp.y),
        Math.abs(ringTip.y - ringMcp.y) / Math.abs(ringPip.y - ringMcp.y),
        Math.abs(pinkyTip.y - pinkyMcp.y) / Math.abs(pinkyPip.y - pinkyMcp.y)
      ]
      
      const avgCurvature = fingerCurvatures.reduce((sum, cur) => sum + cur, 0) / fingerCurvatures.length

      // 手势识别逻辑 - 改进判断条件
      if (upCount >= 4) {
        // 张开手掌 - 移动控制（4个或5个手指伸直）
        return {
          type: GestureType.OPEN_PALM,
          confidence: upCount === 5 ? 0.95 : 0.85,
          timestamp: Date.now(),
        }
      } else if (upCount === 0 || (upCount <= 1 && avgCurvature < 0.7)) {
        // 握拳 - 射击（所有手指弯曲或弯曲程度很高）
        return {
          type: GestureType.FIST,
          confidence: upCount === 0 ? 0.95 : 0.8,
          timestamp: Date.now(),
        }
      } else if (upCount === 1 && isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
        // 食指比1 - 暂停（只有食指伸直）
        return {
          type: GestureType.ONE,
          confidence: 0.9,
          timestamp: Date.now(),
        }
      } else if (upCount === 2 && isIndexUp && isMiddleUp && !isRingUp && !isPinkyUp) {
        // 比V手势 - 备用
        return {
          type: GestureType.PEACE,
          confidence: 0.85,
          timestamp: Date.now(),
        }
      }

      return null
    } catch (error) {
      return null
    }
  }, [])

  /**
   * 启动摄像头
   */
  const startCamera = useCallback(async (): Promise<void> => {
    try {
      // 检查是否已经启动，避免重复初始化
      const globalStatus = cameraManager.getStatus()
      if (globalStatus.isActive && handsRef.current && isMediaPipeInitializedRef.current) {
        console.log('📹 摄像头和MediaPipe已经启动，跳过重复初始化');
        setCameraState({
          isConnected: true,
          isActive: true,
        })
        // 确保手势识别也在运行
        setTimeout(() => {
          startGestureRecognition()
        }, 100)
        return
      }

      console.log('🚀 开始启动摄像头和手势识别...');
      
      // 只有在需要时才清理旧的MediaPipe实例
      if (handsRef.current && !isMediaPipeInitializedRef.current) {
        console.log('🧹 清理旧的MediaPipe实例...');
        try {
          handsRef.current.close()
        } catch (error) {
          console.warn('清理MediaPipe实例时出错:', error);
        }
        handsRef.current = null
        isMediaPipeInitializedRef.current = false
      }

      // 启动全局摄像头（如果尚未启动）
      if (!globalStatus.isActive) {
        console.log('📹 启动摄像头...');
        await cameraManager.startCamera()
        console.log('✅ 摄像头启动成功');
      } else {
        console.log('📹 摄像头已经启动');
      }

      // 设置视频元素
      if (videoRef.current) {
        console.log('🎥 配置视频元素...');
        const { stream } = cameraManager.getStatus()
        if (stream) {
          videoRef.current.srcObject = stream
          cameraManager.setVideoElement(videoRef.current)
          streamRef.current = stream
          console.log('✅ 视频流绑定成功');

          // 等待视频元素准备好
          console.log('⏳ 等待视频数据加载...');
          await new Promise<void>((resolve) => {
            const video = videoRef.current!
            
            const onLoadedData = () => {
              console.log('✅ 视频数据加载完成');
              video.removeEventListener('loadeddata', onLoadedData)
              resolve()
            }
            
            if (video.readyState >= 2) {
              console.log('✅ 视频已经准备就绪');
              resolve()
            } else {
              video.addEventListener('loadeddata', onLoadedData)
            }
          })
        } else {
          console.error('❌ 未获取到视频流');
        }
      } else {
        console.error('❌ 视频元素引用不存在');
      }

      // 更新摄像头状态
      console.log('📊 更新摄像头状态...');
      setCameraState({
        isConnected: true,
        isActive: true,
      })

      // 只有在MediaPipe未初始化时才初始化
      if (!handsRef.current || !isMediaPipeInitializedRef.current) {
        console.log('🤖 初始化MediaPipe...');
        await initializeHands()
      } else {
        console.log('🤖 MediaPipe已经初始化');
      }

      // 延迟启动手势识别，确保摄像头和MediaPipe完全就绪
      console.log('⏰ 延迟启动手势识别...');
      setTimeout(() => {
        console.log('🎯 启动手势识别处理...');
        startGestureRecognition()
      }, 500)
      
      console.log('🎉 摄像头和手势识别启动完成!');
    } catch (error) {
        console.error('❌ 摄像头启动失败:', error);
        setCameraState(prev => ({
          ...prev,
          isActive: false,
          error: error instanceof Error ? error.message : '摄像头启动失败'
        }))
        throw error
    }
  }, [initializeHands])

  /**
   * 停止摄像头
   */
  const stopCamera = useCallback(async (): Promise<void> => {
    console.log('🛑 停止摄像头和手势识别...');
    
    // 停止动画帧
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // 关闭MediaPipe
    if (handsRef.current) {
      try {
        handsRef.current.close()
      } catch (error) {
        // 忽略关闭错误
      }
      handsRef.current = null
    }

    // 重置MediaPipe初始化状态
    isMediaPipeInitializedRef.current = false

    // 清理视频元素
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    // 关闭全局摄像头
    await cameraManager.stopCamera()

    // 更新状态
    setCameraState({
      isConnected: false,
      isActive: false,
    })
    streamRef.current = null
    
    console.log('✅ 摄像头和手势识别已停止');
  }, [])

  /**
   * 启动手势识别
   */
  const startGestureRecognition = useCallback(() => {
    // 强制检查全局摄像头状态
    const globalStatus = cameraManager.getStatus()
    
    // 如果本地状态与全局状态不一致，强制同步
    if (cameraState.isActive !== globalStatus.isActive) {
      setCameraState({
        isConnected: globalStatus.isActive,
        isActive: globalStatus.isActive,
      })
    }

    if (!config.enableGesture) {
      console.log('🚫 手势识别已禁用，跳过启动');
      return
    }

    if (!globalStatus.isActive) {
      console.log('🚫 摄像头未激活，跳过手势识别启动');
      return
    }
    
    if (!handsRef.current) {
      console.log('🚫 MediaPipe未初始化，跳过手势识别启动');
      return
    }

    // 确保清理之前的动画帧
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    console.log('🎯 启动手势识别处理循环...');

    // 添加处理标志，防止并发处理
    let isProcessing = false

    const processFrame = async () => {
      // 防止并发处理
      if (isProcessing) {
        animationFrameRef.current = requestAnimationFrame(processFrame)
        return
      }

      // 使用全局状态检查，确保状态一致性
      const globalStatus = cameraManager.getStatus()
      
      if (!videoRef.current || !globalStatus.isActive || !handsRef.current || !isMediaPipeInitializedRef.current) {
        console.log('🚫 手势识别循环条件不满足，停止处理');
        return
      }

      // 检查视频元素是否已准备好
      const video = videoRef.current
      if (!video.srcObject || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        // 视频还没有准备好，跳过这一帧
        animationFrameRef.current = requestAnimationFrame(processFrame)
        return
      }

      // 额外的安全检查：确保视频数据有效
      try {
        // 检查视频是否暂停或结束
        if (video.paused || video.ended) {
          animationFrameRef.current = requestAnimationFrame(processFrame)
          return
        }

        // 检查视频时间戳是否有效
        if (video.currentTime <= 0) {
          animationFrameRef.current = requestAnimationFrame(processFrame)
          return
        }

        isProcessing = true

        // 创建一个安全的视频帧副本
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          isProcessing = false
          animationFrameRef.current = requestAnimationFrame(processFrame)
          return
        }

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // 绘制当前帧到canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // 发送canvas图像到MediaPipe进行处理
        await handsRef.current.send({ image: canvas as any })
        
      } catch (error) {
        // 处理各种可能的错误
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase()
          
          // 内存访问错误 - 重新初始化MediaPipe
          if (errorMessage.includes('memory access') || errorMessage.includes('out of bounds')) {
            console.warn('🔄 检测到内存访问错误，重新初始化MediaPipe...');
            isMediaPipeInitializedRef.current = false
            handsRef.current = null
            
            // 延迟重新初始化
            setTimeout(async () => {
              try {
                await initializeHands()
                console.log('✅ MediaPipe重新初始化完成');
              } catch (initError) {
                console.error('❌ MediaPipe重新初始化失败:', initError);
                setCameraState(prev => ({
                  ...prev,
                  error: '手势识别初始化失败，请刷新页面重试'
                }))
              }
            }, 1000)
            
            isProcessing = false
            return
          }
          
          // 其他非关键错误，静默处理
          if (!errorMessage.includes('buffer') && !errorMessage.includes('canvas')) {
            console.error('❌ MediaPipe处理帧时出错:', error.message);
            setCameraState(prev => ({
              ...prev,
              error: error.message
            }))
          }
        }
      } finally {
        isProcessing = false
      }

      // 继续下一帧
      animationFrameRef.current = requestAnimationFrame(processFrame)
    }

    processFrame()
  }, [config.enableGesture, cameraState.isActive, initializeHands])

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
    // 使用全局状态检查，确保状态一致性
    const globalStatus = cameraManager.getStatus()
    
    if (config.enableGesture && globalStatus.isActive) {
      // 确保清理之前的动画帧
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      // 延迟启动手势识别，确保状态同步
      setTimeout(() => {
        startGestureRecognition()
      }, 100)
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
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
