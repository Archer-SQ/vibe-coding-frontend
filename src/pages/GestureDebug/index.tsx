import React, { useEffect, useState } from 'react'
import { Card, Button, Space, Typography, Alert, Descriptions, Badge, Progress } from 'antd'
import { PlayCircleOutlined, StopOutlined, ReloadOutlined } from '@ant-design/icons'
import { useGestureRecognition } from '@/hooks/useGestureRecognition'
import { cameraManager } from '@/utils/cameraManager'
import GestureVisualization from '@/components/GestureVisualization'
import './index.less'

const { Title, Text, Paragraph } = Typography

interface DebugInfo {
  timestamp: string
  userAgent: string
  protocol: string
  hostname: string
  hasMediaDevices: boolean
  hasGetUserMedia: boolean
  isSecureContext: boolean
  cameraPermission: string
  browserCompatibility: string
}

const GestureDebug: React.FC = () => {
  const {
    gestureState,
    handPosition,
    cameraState,
    gameControl,
    startCamera,
    stopCamera,
    // toggleGesture,
    config,
    videoRef,
    stream
  } = useGestureRecognition()

  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  // 收集调试信息
  useEffect(() => {
    const collectDebugInfo = async () => {
      // 检查摄像头权限
      const permission = await cameraManager.checkPermission()
      
      // 检查浏览器兼容性
      const compatibility = cameraManager.checkCompatibility()

      const info: DebugInfo = {
        timestamp: new Date().toLocaleString(),
        userAgent: navigator.userAgent,
        protocol: location.protocol,
        hostname: location.hostname,
        hasMediaDevices: !!navigator.mediaDevices,
        hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        isSecureContext: window.isSecureContext,
        cameraPermission: permission.state,
        browserCompatibility: compatibility.supported ? '支持' : compatibility.message
      }

      setDebugInfo(info)
    }

    collectDebugInfo()
  }, [])

  // 监听控制台日志
  useEffect(() => {
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error

    const addLog = (level: string, ...args: any[]) => {
      const message = `[${level}] ${new Date().toLocaleTimeString()}: ${args.join(' ')}`
      setLogs(prev => [...prev.slice(-19), message]) // 保留最近20条日志
    }

    console.log = (...args) => {
      originalLog(...args)
      if (args.some(arg => typeof arg === 'string' && (arg.includes('MediaPipe') || arg.includes('摄像头') || arg.includes('手势')))) {
        addLog('LOG', ...args)
      }
    }

    console.warn = (...args) => {
      originalWarn(...args)
      addLog('WARN', ...args)
    }

    console.error = (...args) => {
      originalError(...args)
      addLog('ERROR', ...args)
    }

    return () => {
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
    }
  }, [])

  const handleStartCamera = async () => {
    try {
      await startCamera()
    } catch (error) {
      console.error('启动摄像头失败:', error)
    }
  }

  const handleStopCamera = async () => {
    try {
      await stopCamera()
    } catch (error) {
      console.error('停止摄像头失败:', error)
    }
  }

  const getStatusColor = (isActive: boolean) => isActive ? 'success' : 'default'
  const getStatusText = (isActive: boolean) => isActive ? '运行中' : '已停止'

  return (
    <div className="gesture-debug">
      <div className="debug-header">
        <Title level={2}>手势识别调试面板</Title>
        <Paragraph>
          此页面用于诊断手势识别功能的问题，提供详细的状态信息和错误日志。
        </Paragraph>
      </div>

      <div className="debug-content">
        {/* 控制面板 */}
        <Card title="控制面板" className="control-panel">
          <Space size="large">
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={handleStartCamera}
              loading={cameraState.isActive}
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
            <Button 
              icon={<ReloadOutlined />}
              onClick={() => window.location.reload()}
            >
              重新加载页面
            </Button>
          </Space>
        </Card>

        {/* 环境信息 */}
        <Card title="环境信息" className="environment-info">
          {debugInfo && (
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="时间戳">{debugInfo.timestamp}</Descriptions.Item>
              <Descriptions.Item label="协议">{debugInfo.protocol}</Descriptions.Item>
              <Descriptions.Item label="域名">{debugInfo.hostname}</Descriptions.Item>
              <Descriptions.Item label="安全上下文">
                <Badge 
                  status={debugInfo.isSecureContext ? 'success' : 'error'} 
                  text={debugInfo.isSecureContext ? '是' : '否'} 
                />
              </Descriptions.Item>
              <Descriptions.Item label="MediaDevices支持">
                <Badge 
                  status={debugInfo.hasMediaDevices ? 'success' : 'error'} 
                  text={debugInfo.hasMediaDevices ? '是' : '否'} 
                />
              </Descriptions.Item>
              <Descriptions.Item label="getUserMedia支持">
                <Badge 
                  status={debugInfo.hasGetUserMedia ? 'success' : 'error'} 
                  text={debugInfo.hasGetUserMedia ? '是' : '否'} 
                />
              </Descriptions.Item>
              <Descriptions.Item label="摄像头权限">{debugInfo.cameraPermission}</Descriptions.Item>
              <Descriptions.Item label="浏览器兼容性">{debugInfo.browserCompatibility}</Descriptions.Item>
            </Descriptions>
          )}
        </Card>

        {/* 状态监控 */}
        <Card title="状态监控" className="status-monitor">
          <div className="status-grid">
            <div className="status-item">
              <Text strong>摄像头状态</Text>
              <div>
                <Badge status={getStatusColor(cameraState.isActive)} text={getStatusText(cameraState.isActive)} />
              </div>
            </div>
            <div className="status-item">
              <Text strong>手势识别</Text>
              <div>
                <Badge status={getStatusColor(config.enableGesture)} text={getStatusText(config.enableGesture)} />
              </div>
            </div>
            <div className="status-item">
              <Text strong>视频流</Text>
              <div>
                <Badge status={getStatusColor(!!stream)} text={stream ? '已连接' : '未连接'} />
              </div>
            </div>
            <div className="status-item">
              <Text strong>当前手势</Text>
              <div>
                <Text code>{gestureState.type}</Text>
              </div>
            </div>
          </div>
        </Card>

        {/* 手势数据 */}
        <Card title="手势数据" className="gesture-data">
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="手势类型">{gestureState.type}</Descriptions.Item>
                <Descriptions.Item label="置信度">
                  <Progress 
                    percent={Math.round(gestureState.confidence * 100)} 
                    size="small" 
                    status={gestureState.confidence > 0.7 ? 'success' : 'normal'}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="手部位置X">{handPosition.x.toFixed(3)}</Descriptions.Item>
                <Descriptions.Item label="手部位置Y">{handPosition.y.toFixed(3)}</Descriptions.Item>
                <Descriptions.Item label="关键点数量">{handPosition.landmarks?.length || 0}</Descriptions.Item>
                <Descriptions.Item label="移动控制">
                  X: {gameControl.move.x.toFixed(2)}, Y: {gameControl.move.y.toFixed(2)}
                </Descriptions.Item>
                <Descriptions.Item label="动作控制">
                  射击: {gameControl.actions.shoot ? '是' : '否'}, 
                  暂停: {gameControl.actions.pause ? '是' : '否'}
                </Descriptions.Item>
              </Descriptions>
            </div>
            <div style={{ minWidth: '300px' }}>
              <Typography.Text strong style={{ display: 'block', marginBottom: '8px' }}>
                手势连线图
              </Typography.Text>
              <GestureVisualization 
                handPosition={handPosition}
                width={300}
                height={200}
              />
            </div>
          </div>
        </Card>

        {/* 视频预览 */}
        <Card title="视频预览" className="video-preview">
          <div className="video-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', maxWidth: '640px', height: 'auto' }}
            />
            {!cameraState.isActive && (
              <div className="video-placeholder">
                <Text type="secondary">摄像头未启动</Text>
              </div>
            )}
          </div>
        </Card>

        {/* 错误信息 */}
        {cameraState.error && (
          <Alert
            message="错误信息"
            description={cameraState.error}
            type="error"
            showIcon
            closable
          />
        )}

        {/* 实时日志 */}
        <Card title="实时日志" className="debug-logs">
          <div className="logs-container">
            {logs.length === 0 ? (
              <Text type="secondary">暂无日志</Text>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`log-item ${log.includes('ERROR') ? 'error' : log.includes('WARN') ? 'warn' : 'info'}`}>
                  <Text code>{log}</Text>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default GestureDebug