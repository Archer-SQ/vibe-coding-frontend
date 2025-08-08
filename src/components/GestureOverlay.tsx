import React, { useRef, useEffect } from 'react'
import type { HandPosition } from '../types/gesture'

interface GestureOverlayProps {
  handPosition: HandPosition
  videoWidth: number
  videoHeight: number
  className?: string
}

// 手部连接线定义（MediaPipe Hands 关键点连接）
const HAND_CONNECTIONS = [
  // 拇指
  [0, 1], [1, 2], [2, 3], [3, 4],
  // 食指
  [0, 5], [5, 6], [6, 7], [7, 8],
  // 中指
  [0, 9], [9, 10], [10, 11], [11, 12],
  // 无名指
  [0, 13], [13, 14], [14, 15], [15, 16],
  // 小指
  [0, 17], [17, 18], [18, 19], [19, 20],
  // 手掌
  [5, 9], [9, 13], [13, 17]
]

/**
 * 手势覆盖层组件
 * 在摄像头画面上绘制手势关键点和连线
 */
export const GestureOverlay: React.FC<GestureOverlayProps> = ({
  handPosition,
  videoWidth,
  videoHeight,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 如果没有手势数据，直接返回
    if (!handPosition.landmarks || handPosition.landmarks.length === 0) {
      return
    }

    const landmarks = handPosition.landmarks

    // 设置绘制样式
    ctx.strokeStyle = '#00ff00'
    ctx.fillStyle = '#ff0000'
    ctx.lineWidth = 2

    // 绘制连接线
    ctx.beginPath()
    HAND_CONNECTIONS.forEach(([start, end]) => {
      if (landmarks[start] && landmarks[end]) {
        const startPoint = landmarks[start]
        const endPoint = landmarks[end]
        
        // 镜像处理：x坐标翻转
        const startX = (1 - startPoint[0]) * canvas.width
        const startY = startPoint[1] * canvas.height
        const endX = (1 - endPoint[0]) * canvas.width
        const endY = endPoint[1] * canvas.height

        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
      }
    })
    ctx.stroke()

    // 绘制关键点
    landmarks.forEach((landmark, index) => {
      // 镜像处理：x坐标翻转
      const x = (1 - landmark[0]) * canvas.width
      const y = landmark[1] * canvas.height

      ctx.beginPath()
      ctx.arc(x, y, 3, 0, 2 * Math.PI)
      
      // 不同类型的关键点使用不同颜色
      if (index === 0) {
        // 手腕 - 蓝色
        ctx.fillStyle = '#0066ff'
      } else if ([4, 8, 12, 16, 20].includes(index)) {
        // 指尖 - 红色
        ctx.fillStyle = '#ff0000'
      } else if ([3, 7, 11, 15, 19].includes(index)) {
        // 指关节 - 橙色
        ctx.fillStyle = '#ff6600'
      } else {
        // 其他关键点 - 绿色
        ctx.fillStyle = '#00ff00'
      }
      
      ctx.fill()
    })

    // 绘制手部中心点
    const centerX = (1 - handPosition.x) * canvas.width
    const centerY = handPosition.y * canvas.height
    
    ctx.beginPath()
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI)
    ctx.fillStyle = '#ffff00'
    ctx.fill()
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.stroke()

  }, [handPosition, videoWidth, videoHeight])

  return (
    <canvas
      ref={canvasRef}
      width={videoWidth}
      height={videoHeight}
      className={`gesture-overlay ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 10
      }}
    />
  )
}

export default GestureOverlay