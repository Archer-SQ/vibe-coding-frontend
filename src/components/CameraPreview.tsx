import React, { useRef, useEffect, useCallback, memo, useState } from 'react'
import { Button, Switch, Slider, Alert, Modal, Space, Card } from 'antd'
import { CameraOutlined, VideoCameraOutlined, SettingOutlined, ReloadOutlined, BugOutlined } from '@ant-design/icons'
import { useGameControl } from '../hooks/useGameControl'
import { GestureType } from '../types/gesture'
import { cameraManager } from '../utils/cameraManager'
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
  
  // 诊断相关状态
  const [showDiagnostic, setShowDiagnostic] = useState(false)
  const [diagnosticInfo, setDiagnosticInfo] = useState<{
    permission: { state: string; message: string } | null
    compatibility: { supported: boolean; message: string } | null
    devices: MediaDeviceInfo[]
    browserInfo: string
  }>({
    permission: null,
    compatibility: null,
    devices: [],
    browserInfo: ''
  })

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
      // 启动失败时的错误处理
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

  // 运行摄像头诊断
  const runDiagnostic = useCallback(async () => {
    try {
      // 检查权限
      const permission = await cameraManager.checkPermission()
      
      // 检查兼容性
      const compatibility = cameraManager.checkCompatibility()
      
      // 获取设备列表
      let devices: MediaDeviceInfo[] = []
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const allDevices = await navigator.mediaDevices.enumerateDevices()
          devices = allDevices.filter(device => device.kind === 'videoinput')
        }
      } catch (error) {
        // 设备枚举失败
      }
      
      // 获取浏览器信息
      const browserInfo = `${navigator.userAgent}`
      
      setDiagnosticInfo({
        permission,
        compatibility,
        devices,
        browserInfo
      })
      
      setShowDiagnostic(true)
    } catch (error) {
      // 诊断失败
      setDiagnosticInfo({
        permission: { state: 'error', message: '权限检查失败' },
        compatibility: { supported: false, message: '兼容性检查失败' },
        devices: [],
        browserInfo: navigator.userAgent
      })
      setShowDiagnostic(true)
    }
  }, [])

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
                  <div className="error-icon">❌</div>
                  <div className="error-message">{cameraError}</div>
                  <div className="error-actions">
                    <Space>
                      <Button 
                        type="primary" 
                        size="small"
                        icon={<ReloadOutlined />}
                        onClick={handleStartCamera}
                      >
                        重试启动
                      </Button>
                      <Button 
                        size="small"
                        icon={<BugOutlined />}
                        onClick={runDiagnostic}
                      >
                        诊断问题
                      </Button>
                    </Space>
                  </div>
                  <div className="error-tips">
                    <p>💡 解决方案：</p>
                    <ul>
                      <li>点击浏览器地址栏的摄像头图标，允许访问摄像头</li>
                      <li>确保没有其他应用正在使用摄像头</li>
                      <li>尝试刷新页面重新授权</li>
                      <li>检查摄像头设备是否正常连接</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="camera-inactive">
                  <CameraOutlined style={{ fontSize: '48px', color: '#ccc' }} />
                  <span>摄像头未启动</span>
                  <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                    点击"启动摄像头"按钮开始手势控制
                  </p>
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

      {/* 诊断模态框 */}
      <Modal
        title={
          <span>
            <BugOutlined /> 摄像头诊断报告
          </span>
        }
        open={showDiagnostic}
        onCancel={() => setShowDiagnostic(false)}
        footer={[
          <Button key="close" onClick={() => setShowDiagnostic(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        <div className="diagnostic-report">
          {/* 权限状态 */}
          <div className="diagnostic-section">
            <h4>📋 权限状态</h4>
            {diagnosticInfo.permission && (
              <Alert
                type={diagnosticInfo.permission.state === 'granted' ? 'success' : 'warning'}
                message={diagnosticInfo.permission.message}
                showIcon
              />
            )}
          </div>

          {/* 浏览器兼容性 */}
          <div className="diagnostic-section">
            <h4>🌐 浏览器兼容性</h4>
            {diagnosticInfo.compatibility && (
              <Alert
                type={diagnosticInfo.compatibility.supported ? 'success' : 'error'}
                message={diagnosticInfo.compatibility.message}
                showIcon
              />
            )}
          </div>

          {/* 摄像头设备 */}
          <div className="diagnostic-section">
            <h4>📹 摄像头设备</h4>
            {diagnosticInfo.devices.length > 0 ? (
              <div>
                <Alert type="success" message={`检测到 ${diagnosticInfo.devices.length} 个摄像头设备`} showIcon />
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  {diagnosticInfo.devices.map((device, index) => (
                    <li key={device.deviceId}>
                      {device.label || `摄像头 ${index + 1}`} ({device.deviceId.substring(0, 8)}...)
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <Alert type="warning" message="未检测到摄像头设备或权限不足" showIcon />
            )}
          </div>

          {/* 环境信息 */}
          <div className="diagnostic-section">
            <h4>💻 环境信息</h4>
            <div style={{ fontSize: '12px', color: '#666', wordBreak: 'break-all' }}>
              <p><strong>协议:</strong> {location.protocol}</p>
              <p><strong>域名:</strong> {location.hostname}</p>
              <p><strong>端口:</strong> {location.port || '默认'}</p>
              <p><strong>浏览器:</strong> {diagnosticInfo.browserInfo}</p>
            </div>
          </div>

          {/* 解决建议 */}
          <div className="diagnostic-section">
            <h4>💡 解决建议</h4>
            <div style={{ fontSize: '14px' }}>
              <p><strong>如果权限被拒绝:</strong></p>
              <ul>
                <li>点击浏览器地址栏的摄像头图标重新授权</li>
                <li>在浏览器设置中允许此网站访问摄像头</li>
                <li>尝试刷新页面重新请求权限</li>
              </ul>
              
              <p><strong>如果没有检测到设备:</strong></p>
              <ul>
                <li>确保摄像头设备已正确连接</li>
                <li>检查其他应用是否正在使用摄像头</li>
                <li>尝试重新插拔摄像头设备</li>
              </ul>
              
              <p><strong>如果浏览器不兼容:</strong></p>
              <ul>
                <li>使用Chrome 53+、Firefox 36+或Safari 11+</li>
                <li>确保浏览器已更新到最新版本</li>
                <li>如果是HTTP环境，请使用HTTPS或localhost</li>
              </ul>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default memo(CameraPreview)