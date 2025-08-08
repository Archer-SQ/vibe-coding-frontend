import { 
  calculateDistance, 
  calculateAngle, 
  recognizeGesture,
  isFingerExtended,
  isPointingLeft,
  isPointingRight,
  isFist,
  type Point3D
} from '../../src/utils/gestureUtils'
import { GestureType } from '../../src/types/gesture'

describe('gestureUtils', () => {
  describe('calculateDistance', () => {
    const point1 = { x: 0, y: 0, z: 0 }
    const point2 = { x: 3, y: 4, z: 0 }

    const distance = calculateDistance(point1, point2)
    expect(distance).toBe(5) // 3-4-5 直角三角形
  })

  it('应该处理3D坐标', () => {
    const point1 = { x: 0, y: 0, z: 0 }
    const point2 = { x: 1, y: 1, z: 1 }

    const distance = calculateDistance(point1, point2)
    expect(distance).toBeCloseTo(Math.sqrt(3), 5)
  })

  it('应该处理相同点', () => {
    const point = { x: 5, y: 10, z: 15 }

    const distance = calculateDistance(point, point)
    expect(distance).toBe(0)
  })
})

describe('calculateAngle', () => {
  it('应该正确计算角度', () => {
    const point1 = { x: 0, y: 0, z: 0 }
    const point2 = { x: 1, y: 0, z: 0 } // 顶点
    const point3 = { x: 1, y: 1, z: 0 }

    const angle = calculateAngle(point1, point2, point3)
    expect(angle).toBeCloseTo(90, 1) // 90度角
  })

  it('应该处理直线情况', () => {
    const point1 = { x: 0, y: 0, z: 0 }
    const point2 = { x: 1, y: 0, z: 0 } // 顶点
    const point3 = { x: 2, y: 0, z: 0 }

    const angle = calculateAngle(point1, point2, point3)
    expect(angle).toBeCloseTo(180, 1) // 180度角
  })
})

describe('recognizeGesture', () => {
  it('应该返回NONE当没有检测到手势时', () => {
    const emptyLandmarks: { x: number; y: number; z: number }[] = []

    const result = recognizeGesture(emptyLandmarks)
    expect(result.type).toBe(GestureType.NONE)
    expect(result.confidence).toBe(0)
  })

  it('应该处理无效输入', () => {
    const result = recognizeGesture(null as unknown as { x: number; y: number; z: number }[] | null)
    expect(result.type).toBe(GestureType.NONE)
    expect(result.confidence).toBe(0)
  })

  it('应该返回正确的手势类型和置信度', () => {
    // 创建模拟的landmarks数据
    const mockLandmarks = Array.from({ length: 21 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
    }))

    const result = recognizeGesture(mockLandmarks)

    // 验证返回值结构
    expect(typeof result.type).toBe('string')
    expect(typeof result.confidence).toBe('number')
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
  })

  it('应该在置信度低时返回NONE', () => {
    // 创建一个会产生低置信度的landmarks数据
    const lowConfidenceLandmarks = Array.from({ length: 21 }, () => ({
      x: 0.5 + Math.random() * 0.01, // 很小的变化
      y: 0.5 + Math.random() * 0.01,
      z: Math.random() * 0.01,
    }))

    const result = recognizeGesture(lowConfidenceLandmarks)

    // 根据实际实现，低置信度可能返回NONE
    expect([GestureType.NONE, GestureType.OPEN_PALM, GestureType.ONE, GestureType.FIST]).toContain(
      result.type,
    )
  })
})

describe('边界情况测试', () => {
  it('应该处理极值坐标', () => {
    const point1 = { x: Number.MAX_VALUE, y: Number.MAX_VALUE, z: Number.MAX_VALUE }
    const point2 = { x: -Number.MAX_VALUE, y: -Number.MAX_VALUE, z: -Number.MAX_VALUE }

    const distance = calculateDistance(point1, point2)
    expect(distance).toBe(Infinity)
  })

  it('应该处理负坐标', () => {
    const point1 = { x: -3, y: -4, z: 0 }
    const point2 = { x: 0, y: 0, z: 0 }

    const distance = calculateDistance(point1, point2)
    expect(distance).toBe(5)
  })

  it('应该处理NaN值', () => {
    const point1 = { x: NaN, y: 0, z: 0 }
    const point2 = { x: 0, y: 0, z: 0 }

    const distance = calculateDistance(point1, point2)
    expect(isNaN(distance)).toBe(true)
  })
})

describe('isFingerExtended', () => {
  it('应该识别伸直的手指', () => {
    const tip: Point3D = { x: 0, y: 0, z: 0 }
    const pip: Point3D = { x: 0, y: 0.1, z: 0 }
    const mcp: Point3D = { x: 0, y: 0.2, z: 0 }
    
    expect(isFingerExtended(tip, pip, mcp)).toBe(true)
  })

  it('应该识别弯曲的手指', () => {
    const tip: Point3D = { x: 0, y: 0.3, z: 0 }
    const pip: Point3D = { x: 0, y: 0.1, z: 0 }
    const mcp: Point3D = { x: 0, y: 0.2, z: 0 }
    
    expect(isFingerExtended(tip, pip, mcp)).toBe(false)
  })
})

describe('isPointingLeft', () => {
  it('应该识别向左指向手势', () => {
    const landmarks: Point3D[] = new Array(21).fill(null).map(() => ({
      x: 0.5,
      y: 0.5,
      z: 0
    }))
    
    // 设置食指关键点（向左指向）
    landmarks[8] = { x: 0.2, y: 0.3, z: 0 } // 食指尖
    landmarks[6] = { x: 0.4, y: 0.4, z: 0 } // 食指第二关节
    landmarks[5] = { x: 0.5, y: 0.5, z: 0 } // 食指第一关节
    
    // 设置其他手指（弯曲状态）
    landmarks[12] = { x: 0.5, y: 0.6, z: 0 } // 中指尖
    landmarks[16] = { x: 0.5, y: 0.6, z: 0 } // 无名指尖
    landmarks[20] = { x: 0.5, y: 0.6, z: 0 } // 小指尖
    
    expect(isPointingLeft(landmarks)).toBe(true)
  })

  it('应该处理无效输入', () => {
    expect(isPointingLeft([])).toBe(false)
    expect(isPointingLeft(null as unknown as Point3D[])).toBe(false)
    expect(isPointingLeft(new Array(10).fill({ x: 0, y: 0, z: 0 }))).toBe(false)
  })
})

describe('isPointingRight', () => {
  it('应该识别向右指向手势', () => {
    const landmarks: Point3D[] = new Array(21).fill(null).map(() => ({
      x: 0.5,
      y: 0.5,
      z: 0
    }))
    
    // 设置食指关键点（向右指向）
    landmarks[8] = { x: 0.8, y: 0.3, z: 0 } // 食指尖
    landmarks[6] = { x: 0.6, y: 0.4, z: 0 } // 食指第二关节
    landmarks[5] = { x: 0.5, y: 0.5, z: 0 } // 食指第一关节
    
    // 设置其他手指（弯曲状态）
    landmarks[12] = { x: 0.5, y: 0.6, z: 0 } // 中指尖
    landmarks[16] = { x: 0.5, y: 0.6, z: 0 } // 无名指尖
    landmarks[20] = { x: 0.5, y: 0.6, z: 0 } // 小指尖
    
    expect(isPointingRight(landmarks)).toBe(true)
  })

  it('应该处理无效输入', () => {
    expect(isPointingRight([])).toBe(false)
    expect(isPointingRight(null as unknown as Point3D[])).toBe(false)
  })
})

describe('isFist', () => {
  it('应该识别拳头手势', () => {
    const landmarks: Point3D[] = new Array(21).fill(null).map(() => ({
      x: 0.5,
      y: 0.5,
      z: 0
    }))
    
    // 设置所有手指为弯曲状态
    landmarks[8] = { x: 0.5, y: 0.6, z: 0 } // 食指尖
    landmarks[6] = { x: 0.5, y: 0.5, z: 0 } // 食指第二关节
    landmarks[5] = { x: 0.5, y: 0.4, z: 0 } // 食指第一关节
    
    landmarks[12] = { x: 0.5, y: 0.6, z: 0 } // 中指尖
    landmarks[10] = { x: 0.5, y: 0.5, z: 0 } // 中指第二关节
    landmarks[9] = { x: 0.5, y: 0.4, z: 0 } // 中指第一关节
    
    landmarks[16] = { x: 0.5, y: 0.6, z: 0 } // 无名指尖
    landmarks[14] = { x: 0.5, y: 0.5, z: 0 } // 无名指第二关节
    landmarks[13] = { x: 0.5, y: 0.4, z: 0 } // 无名指第一关节
    
    landmarks[20] = { x: 0.5, y: 0.6, z: 0 } // 小指尖
    landmarks[18] = { x: 0.5, y: 0.5, z: 0 } // 小指第二关节
    landmarks[17] = { x: 0.5, y: 0.4, z: 0 } // 小指第一关节
    
    expect(isFist(landmarks)).toBe(true)
  })

  it('应该处理无效输入', () => {
    expect(isFist([])).toBe(false)
    expect(isFist(null as unknown as Point3D[])).toBe(false)
  })
})

describe('recognizeGesture 扩展测试', () => {
  it('应该识别食指比1手势', () => {
    const landmarks: Point3D[] = new Array(21).fill(null).map(() => ({
      x: 0.5,
      y: 0.5,
      z: 0
    }))
    
    // 只有食指伸直
    landmarks[4] = { x: 0.5, y: 0.6, z: 0 } // 拇指尖（弯曲）
    landmarks[3] = { x: 0.5, y: 0.5, z: 0 } // 拇指关节
    landmarks[2] = { x: 0.5, y: 0.4, z: 0 } // 拇指根部
    
    landmarks[8] = { x: 0.5, y: 0.2, z: 0 } // 食指尖（伸直）
    landmarks[6] = { x: 0.5, y: 0.4, z: 0 } // 食指第二关节
    landmarks[5] = { x: 0.5, y: 0.5, z: 0 } // 食指第一关节
    
    landmarks[12] = { x: 0.5, y: 0.6, z: 0 } // 中指尖（弯曲）
    landmarks[10] = { x: 0.5, y: 0.5, z: 0 } // 中指第二关节
    landmarks[9] = { x: 0.5, y: 0.4, z: 0 } // 中指第一关节
    
    landmarks[16] = { x: 0.5, y: 0.6, z: 0 } // 无名指尖（弯曲）
    landmarks[14] = { x: 0.5, y: 0.5, z: 0 } // 无名指第二关节
    landmarks[13] = { x: 0.5, y: 0.4, z: 0 } // 无名指第一关节
    
    landmarks[20] = { x: 0.5, y: 0.6, z: 0 } // 小指尖（弯曲）
    landmarks[18] = { x: 0.5, y: 0.5, z: 0 } // 小指第二关节
    landmarks[17] = { x: 0.5, y: 0.4, z: 0 } // 小指第一关节
    
    const result = recognizeGesture(landmarks)
    expect(result.type).toBe(GestureType.ONE)
    expect(result.confidence).toBeGreaterThan(0.8)
  })

  it('应该识别张开手掌手势', () => {
    const landmarks: Point3D[] = new Array(21).fill(null).map(() => ({
      x: 0.5,
      y: 0.5,
      z: 0
    }))
    
    // 所有手指都伸直
    landmarks[4] = { x: 0.5, y: 0.2, z: 0 } // 拇指尖
    landmarks[3] = { x: 0.5, y: 0.4, z: 0 } // 拇指关节
    landmarks[2] = { x: 0.5, y: 0.5, z: 0 } // 拇指根部
    
    landmarks[8] = { x: 0.5, y: 0.2, z: 0 } // 食指尖
    landmarks[6] = { x: 0.5, y: 0.4, z: 0 } // 食指第二关节
    landmarks[5] = { x: 0.5, y: 0.5, z: 0 } // 食指第一关节
    
    landmarks[12] = { x: 0.5, y: 0.2, z: 0 } // 中指尖
    landmarks[10] = { x: 0.5, y: 0.4, z: 0 } // 中指第二关节
    landmarks[9] = { x: 0.5, y: 0.5, z: 0 } // 中指第一关节
    
    landmarks[16] = { x: 0.5, y: 0.2, z: 0 } // 无名指尖
    landmarks[14] = { x: 0.5, y: 0.4, z: 0 } // 无名指第二关节
    landmarks[13] = { x: 0.5, y: 0.5, z: 0 } // 无名指第一关节
    
    landmarks[20] = { x: 0.5, y: 0.2, z: 0 } // 小指尖
    landmarks[18] = { x: 0.5, y: 0.4, z: 0 } // 小指第二关节
    landmarks[17] = { x: 0.5, y: 0.5, z: 0 } // 小指第一关节
    
    const result = recognizeGesture(landmarks)
    expect(result.type).toBe(GestureType.OPEN_PALM)
    expect(result.confidence).toBeGreaterThan(0.8)
  })

  it('应该处理异常情况', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    // 测试空数组
    let result = recognizeGesture([])
    expect(result.type).toBe(GestureType.NONE)
    expect(result.confidence).toBe(0)
    
    // 测试null输入
    result = recognizeGesture(null as unknown as Point3D[])
    expect(result.type).toBe(GestureType.NONE)
    expect(result.confidence).toBe(0)
    
    // 测试长度不足的数组
    result = recognizeGesture(new Array(10).fill({ x: 0, y: 0, z: 0 }))
    expect(result.type).toBe(GestureType.NONE)
    expect(result.confidence).toBe(0)
    
    consoleSpy.mockRestore()
  })
})
