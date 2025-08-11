/**
 * 手势识别工具函数
 */

import { GestureType, type GestureState } from '../types/gesture'

/**
 * 3D点坐标接口
 */
export interface Point3D {
  x: number
  y: number
  z: number
}

/**
 * 计算两点之间的欧几里得距离
 * @param point1 第一个点
 * @param point2 第二个点
 * @returns 两点之间的距离
 */
export const calculateDistance = (point1: Point3D, point2: Point3D): number => {
  const dx = point2.x - point1.x
  const dy = point2.y - point1.y
  const dz = point2.z - point1.z
  
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/**
 * 计算三点形成的角度（以point2为顶点）
 * @param point1 第一个点
 * @param point2 顶点
 * @param point3 第三个点
 * @returns 角度（度数）
 */
export const calculateAngle = (point1: Point3D, point2: Point3D, point3: Point3D): number => {
  // 计算向量（从顶点指向其他两点）
  const vector1 = {
    x: point1.x - point2.x,
    y: point1.y - point2.y,
    z: point1.z - point2.z
  }
  
  const vector2 = {
    x: point3.x - point2.x,
    y: point3.y - point2.y,
    z: point3.z - point2.z
  }
  
  // 计算向量长度
  const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y + vector1.z * vector1.z)
  const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y + vector2.z * vector2.z)
  
  // 避免除零错误
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0
  }
  
  // 计算点积
  const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z
  
  // 计算余弦值
  const cosAngle = dotProduct / (magnitude1 * magnitude2)
  
  // 确保余弦值在有效范围内
  const clampedCosAngle = Math.max(-1, Math.min(1, cosAngle))
  
  // 转换为角度（度数）
  return Math.acos(clampedCosAngle) * (180 / Math.PI)
}

/**
 * 判断手指是否伸直
 * @param tip 指尖点
 * @param pip 第二关节点
 * @param mcp 第一关节点
 * @returns 是否伸直
 */
export const isFingerExtended = (tip: Point3D, pip: Point3D, mcp: Point3D): boolean => {
  // 简单判断：指尖的y坐标小于两个关节点的y坐标
  return tip.y < pip.y && tip.y < mcp.y
}

/**
 * 判断是否为向左指向手势
 * @param landmarks 手部关键点数组
 * @returns 是否为向左指向
 */
export const isPointingLeft = (landmarks: Point3D[]): boolean => {
  if (!landmarks || landmarks.length < 21) {
    return false
  }
  
  const index_tip = landmarks[8]
  const index_pip = landmarks[6]
  const index_mcp = landmarks[5]
  const middle_tip = landmarks[12]
  const ring_tip = landmarks[16]
  const pinky_tip = landmarks[20]
  
  // 食指伸直且指向左侧
  const isIndexExtended = isFingerExtended(index_tip, index_pip, index_mcp)
  const isPointingLeft = index_tip.x < index_mcp.x
  
  // 其他手指相对弯曲
  const otherFingersBent = middle_tip.y > index_pip.y && 
                          ring_tip.y > index_pip.y && 
                          pinky_tip.y > index_pip.y
  
  return isIndexExtended && isPointingLeft && otherFingersBent
}

/**
 * 判断是否为向右指向手势
 * @param landmarks 手部关键点数组
 * @returns 是否为向右指向
 */
export const isPointingRight = (landmarks: Point3D[]): boolean => {
  if (!landmarks || landmarks.length < 21) {
    return false
  }
  
  const index_tip = landmarks[8]
  const index_pip = landmarks[6]
  const index_mcp = landmarks[5]
  const middle_tip = landmarks[12]
  const ring_tip = landmarks[16]
  const pinky_tip = landmarks[20]
  
  // 食指伸直且指向右侧
  const isIndexExtended = isFingerExtended(index_tip, index_pip, index_mcp)
  const isPointingRight = index_tip.x > index_mcp.x
  
  // 其他手指相对弯曲
  const otherFingersBent = middle_tip.y > index_pip.y && 
                          ring_tip.y > index_pip.y && 
                          pinky_tip.y > index_pip.y
  
  return isIndexExtended && isPointingRight && otherFingersBent
}

/**
 * 判断是否为拳头手势
 * @param landmarks 手部关键点数组
 * @returns 是否为拳头
 */
export const isFist = (landmarks: Point3D[]): boolean => {
  if (!landmarks || landmarks.length < 21) {
    return false
  }

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
  
  // 检查所有手指是否弯曲（除了拇指可能伸直）
  const isIndexBent = !isFingerExtended(index_tip, index_pip, index_mcp)
  const isMiddleBent = !isFingerExtended(middle_tip, middle_pip, middle_mcp)
  const isRingBent = !isFingerExtended(ring_tip, ring_pip, ring_mcp)
  const isPinkyBent = !isFingerExtended(pinky_tip, pinky_pip, pinky_mcp)
  
  // 拳头：食指、中指、无名指、小指都弯曲
  return isIndexBent && isMiddleBent && isRingBent && isPinkyBent
}

/**
 * 基于手部关键点识别手势
 * @param landmarks 手部关键点数组
 * @returns 手势状态
 */
export const recognizeGesture = (landmarks: Point3D[] | null): GestureState => {
  // 处理无效输入
  if (!landmarks || landmarks.length < 21) {
    return {
      type: GestureType.NONE,
      confidence: 0,
      timestamp: Date.now()
    }
  }
  
  try {
    // 获取关键点
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

    // 判断手指是否伸直
    const isThumbUp = landmarks[4].y < landmarks[3].y && landmarks[3].y < landmarks[2].y
    const isIndexUp = isFingerExtended(index_tip, index_pip, index_mcp)
    const isMiddleUp = isFingerExtended(middle_tip, middle_pip, middle_mcp)
    const isRingUp = isFingerExtended(ring_tip, ring_pip, ring_mcp)
    const isPinkyUp = isFingerExtended(pinky_tip, pinky_pip, pinky_mcp)

    const upFingers = [isThumbUp, isIndexUp, isMiddleUp, isRingUp, isPinkyUp]
    const upCount = upFingers.filter(Boolean).length

    // 手势识别逻辑
    
    // 食指比1：只有食指伸直
    if (isIndexUp && upCount === 1) {
      return {
        type: GestureType.ONE,
        confidence: 0.9,
        timestamp: Date.now()
      }
    }
    
    // 食指+拇指伸直（常见的比1手势）
    if (isIndexUp && upCount === 2 && isThumbUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
      return {
        type: GestureType.ONE,
        confidence: 0.8,
        timestamp: Date.now()
      }
    }
    
    // 握拳：最多只有拇指伸直，食指必须弯曲
    if (upCount <= 1 && !isIndexUp) {
      return {
        type: GestureType.FIST,
        confidence: 0.9,
        timestamp: Date.now()
      }
    }
    
    // 张开手掌：至少3个手指伸直，包括食指和中指
    if (upCount >= 3 && isIndexUp && isMiddleUp) {
      return {
        type: GestureType.OPEN_PALM,
        confidence: 0.9,
        timestamp: Date.now()
      }
    }
    
    // 两个手指伸直（食指+中指）
    if (upCount === 2 && isIndexUp && isMiddleUp) {
      return {
        type: GestureType.OPEN_PALM,
        confidence: 0.8,
        timestamp: Date.now()
      }
    }

    // 默认返回无手势
    return {
      type: GestureType.NONE,
      confidence: 0.3,
      timestamp: Date.now()
    }
    
  } catch (error) {
    return {
      type: GestureType.NONE,
      confidence: 0,
      timestamp: Date.now()
    }
  }
}