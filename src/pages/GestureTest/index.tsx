import React, { useState } from 'react'
import { Card, Button, Space, Typography, Alert } from 'antd'
import { PlayCircleOutlined, StopOutlined } from '@ant-design/icons'
import { useGestureRecognition } from '../../hooks/useGestureRecognition'
import GestureVisualization from '../../components/GestureVisualization'
import './index.less'

const { Title, Paragraph } = Typography

/**
 * 手势连线图测试页面
 * 专门用于测试手势可视化功能
 */
const GestureTest: React.FC = () => {
  const {
    handPosition,
    gestureState,
    cameraState,
    startCamera,
    stopCamera,
    videoRef,
  } = useGestureRecognition()

  const [isStarting, setIsStarting] = useState(false)

  const handleStartCamera = async () => {
    setIsStarting(true)
    try {
      await startCamera()
    } catch (error) {
      console.error('启动摄像头失败:', error)
    } finally {
      setIsStarting(false)
    }
  }

  const handleStopCamera = async () => {
    try {
      await stopCamera()
    } catch (error) {
      console.error('停止摄像头失败:', error)
    }
  }

  return (
    <div className="gesture-test">
      <div className="test-header">
        <Title level={2}>手势连线图测试</Title>
        <Paragraph>
          这个页面专门用于测试手势连线图功能。启动摄像头后，在摄像头前伸出手掌，应该能看到手势连线图。
        </Paragraph>
      </div>

      <div className="test-content">
        {/* 控制面板 */}
        <Card title="控制面板" style={{ marginBottom: 16 }}>
          <Space size="large">
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={handleStartCamera}
              loading={isStarting}
              disabled={cameraState.isActive}
            >
              启动摄像头
            </Button>
            <Button 
              icon={<StopOutlined />}
              onClick={handleStopCamera}
              disabled={!cameraState.isActive}
            >
              停止摄像头
            </Button>
          </Space>
        </Card>

        {/* 错误信息 */}
        {cameraState.error && (
          <Alert
            message="错误信息"
            description={cameraState.error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 主要测试区域 */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          {/* 摄像头预览 */}
          <Card title="摄像头预览" style={{ flex: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ 
                  width: '100%', 
                  maxWidth: '480px', 
                  height: 'auto',
                  borderRadius: '8px',
                  background: '#000'
                }}
              />
              {!cameraState.isActive && (
                <div style={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)',
                  color: '#999'
                }}>
                  摄像头未启动
                </div>
              )}
            </div>
          </Card>

          {/* 手势连线图 */}
          <Card title="手势连线图" style={{ minWidth: '350px' }}>
            <div style={{ textAlign: 'center' }}>
              <GestureVisualization 
                handPosition={handPosition}
                width={320}
                height={240}
              />
              <div style={{ marginTop: '16px', textAlign: 'left' }}>
                <p><strong>当前手势:</strong> {gestureState.type}</p>
                <p><strong>置信度:</strong> {(gestureState.confidence * 100).toFixed(1)}%</p>
                <p><strong>手部位置:</strong> ({handPosition.x.toFixed(3)}, {handPosition.y.toFixed(3)})</p>
                <p><strong>关键点数量:</strong> {handPosition.landmarks?.length || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* 使用说明 */}
        <Card title="使用说明" style={{ marginTop: 16 }}>
          <ul>
            <li>点击"启动摄像头"按钮开始测试</li>
            <li>在摄像头前伸出手掌，保持手掌清晰可见</li>
            <li>右侧的手势连线图应该显示手部关键点和连接线</li>
            <li>尝试不同的手势：张开手掌、握拳、比1等</li>
            <li>观察手势类型和置信度的变化</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}

export default GestureTest