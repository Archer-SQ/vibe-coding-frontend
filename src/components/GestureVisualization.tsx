import React, { useRef, useEffect, useMemo, useState } from 'react'
import type { HandPosition } from '../types/gesture'

interface GestureVisualizationProps {
  handPosition: HandPosition
  gestureStatus?: 'initializing' | 'active' | 'error' | 'inactive'
  width?: number
  height?: number
  className?: string
}

// 手部连接线定义（MediaPipe Hands 关键点连接）
const HAND_CONNECTIONS = [
  // 拇指
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  // 食指
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  // 中指
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  // 无名指
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  // 小指
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  // 手掌
  [5, 9],
  [9, 13],
  [13, 17],
]

/**
 * 手势可视化组件
 * 在独立区域中绘制手势关键点和连线
 */
export const GestureVisualization: React.FC<GestureVisualizationProps> = ({
  handPosition,
  gestureStatus = 'inactive',
  width = 200, // 调整默认宽度以适应左侧面板（240px - 32px padding = 208px可用空间）
  height = 150, // 相应调整高度保持比例
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [lastValidLandmarks, setLastValidLandmarks] = useState<number[][] | null>(null)

  // 使用 useMemo 来稳定 landmarks 数据
  const stableLandmarks = useMemo(() => {
    const currentLandmarks = handPosition.landmarks || []

    // 如果当前有有效的landmarks数据，更新缓存并返回
    if (currentLandmarks.length >= 21) {
      setLastValidLandmarks(currentLandmarks)
      return currentLandmarks
    }

    // 如果当前没有有效数据，使用缓存的数据
    if (lastValidLandmarks && lastValidLandmarks.length >= 21) {
      return lastValidLandmarks
    }

    return currentLandmarks
  }, [handPosition.landmarks, lastValidLandmarks])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 设置深色背景
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制边框
    ctx.strokeStyle = '#16213e'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, canvas.width, canvas.height)

    // 检查是否使用缓存数据
    const isUsingCached = lastValidLandmarks && stableLandmarks === lastValidLandmarks

    // 如果没有手势数据，显示提示
    if (!stableLandmarks || stableLandmarks.length === 0) {
      ctx.fillStyle = '#6c7293'
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
      ctx.textAlign = 'center'
      ctx.fillText('等待手势检测...', canvas.width / 2, canvas.height / 2)
      return
    }

    // 检查关键点数据是否有效
    if (stableLandmarks.length < 21) {
      ctx.fillStyle = '#6c7293'
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
      ctx.textAlign = 'center'
      ctx.fillText(`关键点不足: ${stableLandmarks.length}/21`, canvas.width / 2, canvas.height / 2)
      return
    }

    // 绘制连接线
    ctx.strokeStyle = '#0f3460'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    HAND_CONNECTIONS.forEach(([start, end]) => {
      if (stableLandmarks[start] && stableLandmarks[end]) {
        const startPoint = stableLandmarks[start]
        const endPoint = stableLandmarks[end]

        // 添加镜像处理以匹配摄像头的镜像效果
        const startX = (1 - startPoint[0]) * canvas.width // 镜像X坐标
        const startY = startPoint[1] * canvas.height
        const endX = (1 - endPoint[0]) * canvas.width // 镜像X坐标
        const endY = endPoint[1] * canvas.height

        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()
      }
    })

    // 绘制关键点
    stableLandmarks.forEach((landmark: number[]) => {
      const x = (1 - landmark[0]) * canvas.width // 镜像X坐标
      const y = landmark[1] * canvas.height

      ctx.beginPath()
      ctx.arc(x, y, 3, 0, 2 * Math.PI)

      // 使用青色作为关键点颜色，符合设计图风格
      ctx.fillStyle = '#00d4aa'
      ctx.fill()

      // 添加发光效果
      ctx.shadowColor = '#00d4aa'
      ctx.shadowBlur = 8
      ctx.fill()
      ctx.shadowBlur = 0
    })

    // 绘制手部中心点（更大更明显）
    const centerCanvasX = (1 - handPosition.x) * canvas.width // 镜像X坐标
    const centerCanvasY = handPosition.y * canvas.height

    ctx.beginPath()
    ctx.arc(centerCanvasX, centerCanvasY, 5, 0, 2 * Math.PI)
    ctx.fillStyle = '#00d4aa'
    ctx.fill()

    // 中心点发光效果
    ctx.shadowColor = '#00d4aa'
    ctx.shadowBlur = 12
    ctx.fill()
    ctx.shadowBlur = 0

    // 添加中心点外圈
    ctx.beginPath()
    ctx.arc(centerCanvasX, centerCanvasY, 8, 0, 2 * Math.PI)
    ctx.strokeStyle = '#00d4aa'
    ctx.lineWidth = 1
    ctx.stroke()

    // 绘制状态信息
    const statusText = {
      'initializing': '初始化中...',
      'active': '手势识别中',
      'error': '识别错误',
      'inactive': '未启用'
    }[gestureStatus]

    const statusColor = {
      'initializing': '#ffa500',
      'active': '#00d4aa',
      'error': '#ff4757',
      'inactive': '#666'
    }[gestureStatus]

    ctx.font = '12px Arial'
    ctx.fillStyle = statusColor
    ctx.textAlign = 'center'
    ctx.fillText(statusText, canvas.width / 2, canvas.height - 10)

    // 如果使用缓存数据，显示提示
    if (isUsingCached && stableLandmarks.length > 0) {
      ctx.font = '10px Arial'
      ctx.fillStyle = '#888'
      ctx.fillText('(缓存数据)', canvas.width / 2, canvas.height - 25)
    }
  }, [stableLandmarks, handPosition.x, handPosition.y, width, height, lastValidLandmarks, gestureStatus]) // 使用稳定的依赖项

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`gesture-visualization ${className}`}
      style={{
        borderRadius: '8px',
        background: '#1a1a2e',
        border: '1px solid #16213e',
      }}
    />
  )
}

export default GestureVisualization
