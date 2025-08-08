/**
 * Hooks 统一导出文件
 */

// 手势识别相关hooks
export { useGestureRecognition } from './useGestureRecognition'
export { useGameControl } from './useGameControl'

// 类型导出
export type { 
  GestureType,
  GestureState, 
  HandPosition, 
  CameraState, 
  GestureConfig, 
  GameControl,
  UseGestureRecognitionReturn 
} from '../types/gesture'