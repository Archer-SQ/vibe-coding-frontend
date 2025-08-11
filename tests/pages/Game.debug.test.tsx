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

  test('Game 组件能够正常渲染', async () => {
    let container: HTMLElement

    try {
      const result = render(
        <BrowserRouter>
          <Game />
        </BrowserRouter>
      )
      container = result.container

      // 等待组件完全渲染
      await waitFor(() => {
        expect(container.firstChild).toBeInTheDocument()
      }, { timeout: 5000 })

      // 检查是否有任何元素被渲染
      const allElements = container.querySelectorAll('*')

      // 检查按钮数量
      const buttons = container.querySelectorAll('button')

      buttons.forEach((button, index) => {
        expect(button).toBeInTheDocument()
      })

      // 基本断言
      expect(container.firstChild).toBeInTheDocument()
      expect(allElements.length).toBeGreaterThan(0)
      expect(buttons.length).toBeGreaterThan(0)

    } catch (error) {
      // 如果渲染失败，记录错误但不让测试失败
      throw error
    }
  })
})