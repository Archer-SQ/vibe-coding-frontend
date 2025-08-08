/**
 * 手势识别相关类型定义
 */

// 手势类型常量
export const GestureType = {
  NONE: 'none',           // 无手势
  FIST: 'fist',          // 握拳 - 射击
  OPEN_PALM: 'open_palm', // 张开手掌 - 移动
  ONE: 'one',            // 食指比1 - 暂停
  PEACE: 'peace',        // 胜利手势 - 备用
} as const

export type GestureType = typeof GestureType[keyof typeof GestureType]

// 手势状态
export interface GestureState {
  type: GestureType
  confidence: number      // 识别置信度 0-1
  timestamp: number       // 识别时间戳
}

// 手部位置信息
export interface HandPosition {
  x: number              // 手部中心点 x 坐标 (0-1)
  y: number              // 手部中心点 y 坐标 (0-1)
  landmarks?: number[][]  // 手部关键点坐标
}

// 摄像头状态
export interface CameraState {
  isConnected: boolean
  isActive: boolean
  error?: string
  deviceId?: string
}

// 手势控制配置
export interface GestureConfig {
  enableGesture: boolean          // 是否启用手势控制
  confidenceThreshold: number     // 置信度阈值
  debounceTime: number           // 防抖时间(ms)
  smoothingFactor: number        // 位置平滑因子
}

// 游戏控制指令
export interface GameControl {
  move: {
    x: number    // 移动方向 x (-1 到 1)
    y: number    // 移动方向 y (-1 到 1)
  }
  actions: {
    shoot: boolean      // 是否射击
    pause: boolean      // 是否暂停
  }
}

// 手势识别回调函数类型
export type GestureCallback = (gesture: GestureState, position: HandPosition) => void

// 手势识别hooks返回类型
export interface UseGestureRecognitionReturn {
  // 状态
  gestureState: GestureState
  handPosition: HandPosition
  cameraState: CameraState
  gameControl: GameControl
  
  // 控制方法
  startCamera: () => Promise<void>
  stopCamera: () => void
  toggleGesture: () => void
  updateConfig: (config: Partial<GestureConfig>) => void
  
  // 配置
  config: GestureConfig
  
  // 摄像头引用和流
  videoRef: React.RefObject<HTMLVideoElement>
  stream: MediaStream | null
}