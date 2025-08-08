import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import Game from '../../src/pages/Game'

// Mock 路由
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

// Mock 图片资源
jest.mock('@/assets/image-removebg-preview.png', () => 'player-ship.png', { virtual: true })
jest.mock('@/assets/bullet-rocket.png', () => 'bullet.png', { virtual: true })
jest.mock('@/assets/enemy-ship.png', () => 'enemy-ship.png', { virtual: true })

// Mock MediaPipe
const mockHands = {
  setOptions: jest.fn(),
  onResults: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
}

Object.defineProperty(window, 'Hands', {
  writable: true,
  value: jest.fn(() => mockHands),
})

// Mock cameraManager
jest.mock('../../src/utils/cameraManager', () => {
  const mockCameraManager = {
    startCamera: jest.fn().mockResolvedValue(new MediaStream()),
    stopCamera: jest.fn(),
    setVideoElement: jest.fn(),
    addStatusListener: jest.fn(),
    removeStatusListener: jest.fn(),
    getStatus: jest.fn().mockReturnValue({ isActive: false, stream: null }),
    forceStop: jest.fn(),
  }
  
  return {
    cameraManager: mockCameraManager,
  }
})

// Mock timeUtils
jest.mock('../../src/utils/timeUtils', () => ({
  formatTime: jest.fn((time: number) => `${Math.floor(time / 1000)}s`),
}))

// Mock request
jest.mock('../../src/services/request', () => ({
  __esModule: true,
  default: {
    post: jest.fn().mockResolvedValue({ data: { success: true } }),
  },
}))

// Mock window.requestAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: jest.fn((cb: FrameRequestCallback) => {
    return setTimeout(cb, 16)
  }),
})

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: jest.fn((id: number) => {
    clearTimeout(id)
  }),
})

// Mock HTMLVideoElement
Object.defineProperty(HTMLVideoElement.prototype, 'play', {
  writable: true,
  value: jest.fn().mockResolvedValue(undefined),
})

Object.defineProperty(HTMLVideoElement.prototype, 'load', {
  writable: true,
  value: jest.fn(),
})

// 测试组件包装器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('Game 组件调试测试', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // 使用真实的定时器来避免复杂的异步问题
    jest.useRealTimers()
  })

  it('应该能够渲染 Game 组件', async () => {
    console.log('开始渲染 Game 组件...')
    
    try {
      const { container } = render(
        <TestWrapper>
          <Game />
        </TestWrapper>
      )
      
      console.log('组件渲染完成')
      console.log('DOM 内容:', container.innerHTML)
      
      // 检查是否有任何内容被渲染
      const allElements = container.querySelectorAll('*')
      console.log('渲染的元素数量:', allElements.length)
      
      // 尝试查找一些基本元素
      const buttons = container.querySelectorAll('button')
      console.log('按钮数量:', buttons.length)
      
      if (buttons.length > 0) {
        buttons.forEach((button, index) => {
          console.log(`按钮 ${index}:`, button.textContent)
        })
      }
      
      // 基本断言
      expect(container).toBeInTheDocument()
      expect(allElements.length).toBeGreaterThan(1)
      
    } catch (error) {
      console.error('渲染过程中出现错误:', error)
      throw error
    }
  })
})