import React, { useRef, useEffect, useCallback, memo } from 'react'
import { Button, Switch, Slider, Card } from 'antd'
import { CameraOutlined, VideoCameraOutlined, SettingOutlined } from '@ant-design/icons'
import { useGameControl } from '../hooks/useGameControl'
import { GestureType } from '../types/gesture'
import './CameraPreview.less'

interface CameraPreviewProps {
  onGestureChange?: (gesture: string, confidence: number) => void
  onPositionChange?: (x: number, y: number) => void
}

/**
 * 摄像头预览组件
 * 显示摄像头画面、手势状态和控制面板
 */
const CameraPreview: React.FC<CameraPreviewProps> = ({
  onGestureChange,
  onPositionChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const {
    playerPosition,
    gameActions,
    currentGesture,
    gestureConfidence,
    isGestureActive,
    isCameraActive,
    cameraError,
    startGestureControl,
    stopGestureControl,
    toggleGestureControl,
    updateSensitivity
  } = useGameControl()

  // 手势类型映射
  const gestureLabels: Record<string, string> = {
    [GestureType.NONE]: '无手势',
    [GestureType.FIST]: '握拳 - 射击',
    [GestureType.OPEN_PALM]: '张开手掌 - 移动',
    [GestureType.ONE]: '食指比1 - 暂停',
    [GestureType.PEACE]: '胜利手势'
  }

  // 获取手势状态样式
  const getGestureStatusClass = (gesture: string) => {
    switch (gesture) {
      case GestureType.FIST:
        return 'gesture-shoot'
      case GestureType.OPEN_PALM:
        return 'gesture-move'
      case GestureType.ONE:
        return 'gesture-pause'
      default:
        return 'gesture-none'
    }
  }

  // 启动摄像头
  const handleStartCamera = useCallback(async () => {
    try {
      await startGestureControl()
    } catch (error) {
      console.error('启动摄像头失败:', error)
    }
  }, [startGestureControl])

  // 停止摄像头
  const handleStopCamera = useCallback(() => {
    stopGestureControl()
  }, [stopGestureControl])

  // 切换手势识别
  const handleToggleGesture = useCallback((checked: boolean) => {
    if (checked !== isGestureActive) {
      toggleGestureControl()
    }
  }, [isGestureActive, toggleGestureControl])

  // 更新灵敏度
  const handleSensitivityChange = useCallback((value: number) => {
    updateSensitivity(value)
  }, [updateSensitivity])

  // 通知父组件手势变化
  useEffect(() => {
    if (onGestureChange) {
      onGestureChange(currentGesture, gestureConfidence)
    }
  }, [currentGesture, gestureConfidence, onGestureChange])

  // 通知父组件位置变化
  useEffect(() => {
    if (onPositionChange) {
      onPositionChange(playerPosition.x, playerPosition.y)
    }
  }, [playerPosition, onPositionChange])

  return (
    <div className="camera-preview-container">
      {/* 摄像头预览区域 */}
      <Card 
        title="摄像头预览" 
        size="small"
        extra={
          <div className="camera-controls">
            {!isCameraActive ? (
              <Button 
                type="primary" 
                icon={<CameraOutlined />}
                onClick={handleStartCamera}
                size="small"
              >
                启动摄像头
              </Button>
            ) : (
              <Button 
                danger 
                icon={<VideoCameraOutlined />}
                onClick={handleStopCamera}
                size="small"
              >
                关闭摄像头
              </Button>
            )}
          </div>
        }
      >
        <div className="camera-display">
          {isCameraActive ? (
            <div className="camera-active">
              <video 
                ref={videoRef}
                className="camera-video"
                autoPlay
                playsInline
                muted
              />
              <canvas 
                ref={canvasRef}
                className="camera-overlay"
              />
              <div className="camera-status active">
                <span className="status-dot"></span>
                <span>摄像头已连接</span>
              </div>
            </div>
          ) : (
            <div className="camera-placeholder">
              {cameraError ? (
                <div className="camera-error">
                  <span>❌ {cameraError}</span>
                </div>
              ) : (
                <div className="camera-inactive">
                  <CameraOutlined style={{ fontSize: '48px', color: '#ccc' }} />
                  <span>摄像头未启动</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* 手势状态显示 */}
      <Card title="手势状态" size="small" className="gesture-status-card">
        <div className="gesture-info">
          <div className={`gesture-indicator ${getGestureStatusClass(currentGesture)}`}>
            <div className="gesture-icon">
              {currentGesture === GestureType.FIST && '✊'}
              {currentGesture === GestureType.OPEN_PALM && '✋'}
              {currentGesture === GestureType.ONE && '☝️'}
              {currentGesture === GestureType.NONE && '🤚'}
            </div>
            <div className="gesture-details">
              <div className="gesture-name">
                {gestureLabels[currentGesture] || '未知手势'}
              </div>
              <div className="gesture-confidence">
                置信度: {(gestureConfidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 游戏动作状态 */}
      <Card title="游戏动作" size="small" className="game-actions-card">
        <div className="action-indicators">
          <div className={`action-item ${gameActions.shoot ? 'active' : ''}`}>
            <span className="action-icon">🔫</span>
            <span className="action-label">射击</span>
          </div>
          <div className={`action-item ${gameActions.pause ? 'active' : ''}`}>
            <span className="action-icon">⏸️</span>
            <span className="action-label">暂停</span>
          </div>
        </div>
      </Card>

      {/* 控制设置 */}
      <Card 
        title={
          <span>
            <SettingOutlined /> 控制设置
          </span>
        } 
        size="small" 
        className="control-settings-card"
      >
        <div className="setting-item">
          <div className="setting-label">手势识别</div>
          <Switch 
            checked={isGestureActive}
            onChange={handleToggleGesture}
            disabled={!isCameraActive}
          />
        </div>
        
        <div className="setting-item">
          <div className="setting-label">移动灵敏度</div>
          <Slider
            min={0.1}
            max={3.0}
            step={0.1}
            defaultValue={1.0}
            onChange={handleSensitivityChange}
            disabled={!isCameraActive}
            marks={{
              0.1: '低',
              1.0: '中',
              3.0: '高'
            }}
          />
        </div>

        <div className="setting-item">
          <div className="setting-label">玩家位置</div>
          <div className="position-display">
            X: {playerPosition.x.toFixed(1)}% | Y: {playerPosition.y.toFixed(1)}%
          </div>
        </div>
      </Card>

      {/* 手势控制说明 */}
      <Card title="手势控制说明" size="small" className="gesture-guide-card">
        <div className="gesture-guide">
          <div className="guide-item">
            <span className="guide-icon">✊</span>
            <span className="guide-text">握拳：射击攻击</span>
          </div>
          <div className="guide-item">
            <span className="guide-icon">✋</span>
            <span className="guide-text">张开手掌：控制移动</span>
          </div>
          <div className="guide-item">
            <span className="guide-icon">☝️</span>
            <span className="guide-text">食指比1：暂停游戏</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default memo(CameraPreview)