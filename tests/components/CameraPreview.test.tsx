import * as React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import CameraPreview from '../../src/components/CameraPreview'
import { useGameControl } from '../../src/hooks/useGameControl'
import { GestureType } from '../../src/types/gesture'

// Mock useGameControl hook
jest.mock('../../src/hooks/useGameControl')
const mockUseGameControl = useGameControl as jest.MockedFunction<typeof useGameControl>

// Mock Ant Design components
jest.mock('antd', () => ({
  Button: ({ children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  Switch: ({ checked, onChange, ...props }: { checked?: boolean; onChange?: (checked: boolean) => void } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange?.(e.target.checked)}
      {...props}
    />
  ),
  Slider: ({ onChange, defaultValue, ...props }: { onChange?: (value: number) => void; defaultValue?: number } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      type="range"
      defaultValue={defaultValue}
      onChange={(e) => onChange?.(Number(e.target.value))}
      {...props}
    />
  ),
  Card: ({ children, title, extra }: { children?: React.ReactNode; title?: React.ReactNode; extra?: React.ReactNode }) => (
    <div data-testid="card">
      {title && <div data-testid="card-title">{title}</div>}
      {extra && <div data-testid="card-extra">{extra}</div>}
      {children}
    </div>
  ),
  Alert: ({ message, type, showIcon, ...props }: { message?: React.ReactNode; type?: string; showIcon?: boolean }) => (
    <div data-testid="alert" data-type={type} {...props}>
      {showIcon && <span data-testid="alert-icon">⚠️</span>}
      {message}
    </div>
  ),
  Modal: ({ children, title, open, onCancel, footer, ...props }: { 
    children?: React.ReactNode; 
    title?: React.ReactNode; 
    open?: boolean; 
    onCancel?: () => void;
    footer?: React.ReactNode;
  }) => (
    open ? (
      <div data-testid="modal" {...props}>
        {title && <div data-testid="modal-title">{title}</div>}
        <div data-testid="modal-content">{children}</div>
        {footer && <div data-testid="modal-footer">{footer}</div>}
        <button onClick={onCancel} data-testid="modal-close">关闭</button>
      </div>
    ) : null
  ),
  Space: ({ children, direction = 'horizontal', ...props }: { 
    children?: React.ReactNode; 
    direction?: 'horizontal' | 'vertical';
  }) => (
    <div data-testid="space" data-direction={direction} {...props}>
      {children}
    </div>
  )
}))

// Mock Ant Design icons
jest.mock('@ant-design/icons', () => ({
  CameraOutlined: () => <span data-testid="camera-icon">📷</span>,
  VideoCameraOutlined: () => <span data-testid="video-icon">📹</span>,
  SettingOutlined: () => <span data-testid="setting-icon">⚙️</span>,
  ExclamationCircleOutlined: () => <span data-testid="exclamation-icon">❗</span>,
  ReloadOutlined: () => <span data-testid="reload-icon">🔄</span>,
  BugOutlined: () => <span data-testid="bug-icon">🐛</span>
}))

describe('CameraPreview', () => {
  const mockGameControlReturn = {
    // 玩家状态
    playerPosition: { x: 50, y: 80 },
    gameActions: { shoot: false, pause: false },
    
    // 子弹系统
    bullets: [],
    createBullet: jest.fn(),
    clearBullets: jest.fn(),
    updateBullets: jest.fn().mockReturnValue({ hitEnemies: [], remainingBullets: [], remainingEnemies: [] }),
    
    // 手势状态
    currentGesture: GestureType.NONE,
    gestureConfidence: 0.8,
    isGestureActive: false,
    handPosition: { x: 0, y: 0 },
    
    // 摄像头状态
    isCameraActive: false,
    cameraError: undefined,
    cameraState: { isActive: false },
    videoRef: { current: null },
    stream: null,
    
    // 控制方法
    startGestureControl: jest.fn(),
    stopGestureControl: jest.fn(),
    toggleGestureControl: jest.fn(),
    resetPlayerPosition: jest.fn(),
    
    // 配置
    updateSensitivity: jest.fn(),
    updateMovementBounds: jest.fn(),
    config: {
      enableGesture: true,
      smoothingFactor: 0.3,
      debounceTime: 100
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseGameControl.mockReturnValue(mockGameControlReturn)
  })

  it('应该正确渲染摄像头预览组件', () => {
    render(<CameraPreview />)
    
    expect(screen.getByText('摄像头预览')).toBeInTheDocument()
    expect(screen.getByText('启动摄像头')).toBeInTheDocument()
  })

  it('应该在摄像头未激活时显示启动按钮', () => {
    mockUseGameControl.mockReturnValue({
      ...mockGameControlReturn,
      isCameraActive: false
    })

    render(<CameraPreview />)
    
    expect(screen.getByText('启动摄像头')).toBeInTheDocument()
    expect(screen.queryByText('关闭摄像头')).not.toBeInTheDocument()
  })

  it('应该在摄像头激活时显示关闭按钮', () => {
    mockUseGameControl.mockReturnValue({
      ...mockGameControlReturn,
      isCameraActive: true
    })

    render(<CameraPreview />)
    
    expect(screen.getByText('关闭摄像头')).toBeInTheDocument()
    expect(screen.queryByText('启动摄像头')).not.toBeInTheDocument()
  })

  it('应该调用启动摄像头方法', async () => {
    const user = userEvent.setup()
    const startGestureControl = jest.fn()
    
    mockUseGameControl.mockReturnValue({
      ...mockGameControlReturn,
      startGestureControl
    })

    render(<CameraPreview />)
    
    const startButton = screen.getByText('启动摄像头')
    await user.click(startButton)
    
    expect(startGestureControl).toHaveBeenCalled()
  })

  it('应该调用停止摄像头方法', async () => {
    const user = userEvent.setup()
    const stopGestureControl = jest.fn()
    
    mockUseGameControl.mockReturnValue({
      ...mockGameControlReturn,
      isCameraActive: true,
      stopGestureControl
    })

    render(<CameraPreview />)
    
    const stopButton = screen.getByText('关闭摄像头')
    await user.click(stopButton)
    
    expect(stopGestureControl).toHaveBeenCalled()
  })

  it('应该显示当前手势状态', () => {
    mockUseGameControl.mockReturnValue({
      ...mockGameControlReturn,
      currentGesture: GestureType.FIST,
      gestureConfidence: 0.95
    })

    render(<CameraPreview />)
    
    expect(screen.getByText('握拳 - 射击')).toBeInTheDocument()
    expect(screen.getByText('置信度: 95.0%')).toBeInTheDocument()
  })

  it('应该显示游戏动作状态', () => {
    mockUseGameControl.mockReturnValue({
      ...mockGameControlReturn,
      gameActions: { shoot: true, pause: false }
    })

    render(<CameraPreview />)
    
    const actionItems = screen.getAllByText(/射击|暂停/)
    expect(actionItems.length).toBeGreaterThan(0)
  })

  it('应该处理手势识别开关', async () => {
    const user = userEvent.setup()
    const toggleGestureControl = jest.fn()
    
    mockUseGameControl.mockReturnValue({
      ...mockGameControlReturn,
      isCameraActive: true,
      toggleGestureControl
    })

    render(<CameraPreview />)
    
    const gestureSwitch = screen.getByRole('checkbox')
    await user.click(gestureSwitch)
    
    expect(toggleGestureControl).toHaveBeenCalled()
  })

  it('应该处理灵敏度调整', async () => {
    const updateSensitivity = jest.fn()
    
    mockUseGameControl.mockReturnValue({
      ...mockGameControlReturn,
      isCameraActive: true,
      updateSensitivity
    })

    render(<CameraPreview />)
    
    const sensitivitySlider = screen.getByRole('slider')
    fireEvent.change(sensitivitySlider, { target: { value: '2.0' } })
    
    expect(updateSensitivity).toHaveBeenCalledWith(2.0)
  })

  it('应该显示玩家位置信息', () => {
    mockUseGameControl.mockReturnValue({
      ...mockGameControlReturn,
      playerPosition: { x: 75.5, y: 60.3 }
    })

    render(<CameraPreview />)
    
    expect(screen.getByText('X: 75.5% | Y: 60.3%')).toBeInTheDocument()
  })

  it('应该调用onGestureChange回调', () => {
    const onGestureChange = jest.fn()
    
    mockUseGameControl.mockReturnValue({
      ...mockGameControlReturn,
      currentGesture: GestureType.FIST,
      gestureConfidence: 0.9
    })

    render(<CameraPreview onGestureChange={onGestureChange} />)
    
    expect(onGestureChange).toHaveBeenCalledWith(GestureType.FIST, 0.9)
  })

  it('应该调用onPositionChange回调', () => {
    const onPositionChange = jest.fn()
    
    mockUseGameControl.mockReturnValue({
      ...mockGameControlReturn,
      playerPosition: { x: 30, y: 70 }
    })

    render(<CameraPreview onPositionChange={onPositionChange} />)
    
    expect(onPositionChange).toHaveBeenCalledWith(30, 70)
  })

  it('应该显示摄像头错误信息', () => {
    mockUseGameControl.mockReturnValue({
      ...mockGameControlReturn,
      cameraError: '摄像头访问被拒绝'
    })

    render(<CameraPreview />)
    
    expect(screen.getByText('摄像头访问被拒绝')).toBeInTheDocument()
    expect(screen.getByText('重试启动')).toBeInTheDocument()
    expect(screen.getByText('诊断问题')).toBeInTheDocument()
  })

  it('应该在摄像头激活时显示视频元素', () => {
    mockUseGameControl.mockReturnValue({
      ...mockGameControlReturn,
      isCameraActive: true
    })

    render(<CameraPreview />)
    
    // 查找视频元素，当摄像头激活时应该存在
    const videoElement = document.querySelector('video')
    expect(videoElement).toBeInTheDocument()
    
    // 验证摄像头状态文本
    expect(screen.getByText('摄像头已连接')).toBeInTheDocument()
  })

  it('应该显示手势控制说明', () => {
    render(<CameraPreview />)
    
    expect(screen.getByText('手势控制说明')).toBeInTheDocument()
    expect(screen.getByText('握拳：射击攻击')).toBeInTheDocument()
    expect(screen.getByText('张开手掌：控制移动')).toBeInTheDocument()
    expect(screen.getByText('食指比1：暂停游戏')).toBeInTheDocument()
  })
})