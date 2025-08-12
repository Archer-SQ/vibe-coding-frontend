import React from 'react'
import { render, waitFor } from '@testing-library/react'
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

// 简单的测试包装器
const SimpleWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )
}

describe('Game 组件简单渲染测试', () => {
  test('Game 组件基本渲染测试', async () => {
    const { container } = render(
      <BrowserRouter>
        <Game />
      </BrowserRouter>
    )

    // 等待组件渲染
    await waitFor(() => {
      expect(container.firstChild).toBeInTheDocument()
    })

    // 检查基本元素
    const allText = container.textContent || ''

    // 检查按钮
    const buttons = container.querySelectorAll('button')

    buttons.forEach((btn, index) => {
      expect(btn).toBeInTheDocument()
    })

    // 基本断言
    expect(container.firstChild).toBeInTheDocument()
    expect(buttons.length).toBeGreaterThan(0)
  })
})