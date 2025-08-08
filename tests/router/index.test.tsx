import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import AppRouter from '../../src/router/index'
import { cameraManager } from '../../src/utils/cameraManager'

// Mock 依赖
jest.mock('../../src/utils/cameraManager', () => ({
  cameraManager: {
    forceStop: jest.fn(),
  },
}))

// Mock 页面组件
jest.mock('../../src/pages/Start', () => {
  return function MockStart({ onStart, onRank }: { onStart?: () => void; onRank?: () => void }) {
    return (
      <div data-testid="start-page">
        <button onClick={onStart}>开始游戏</button>
        <button onClick={onRank}>排行榜</button>
      </div>
    )
  }
})

jest.mock('../../src/pages/Rank', () => {
  return function MockRank() {
    return <div data-testid="rank-page">排行榜页面</div>
  }
})

jest.mock('../../src/pages/Game', () => {
  return function MockGame() {
    return <div data-testid="game-page">游戏页面</div>
  }
})

const mockCameraManager = cameraManager as jest.Mocked<typeof cameraManager>

describe('AppRouter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console.log to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('应该渲染首页', async () => {
    render(<AppRouter />)
    
    await waitFor(() => {
      expect(screen.getByTestId('start-page')).toBeInTheDocument()
    })
  })

  it('应该在页面隐藏时关闭摄像头', async () => {
    render(<AppRouter />)

    // 模拟页面隐藏
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: true,
    })

    const event = new Event('visibilitychange')
    document.dispatchEvent(event)

    await waitFor(() => {
      expect(mockCameraManager.forceStop).toHaveBeenCalled()
    })
  })

  it('应该在页面卸载前关闭摄像头', async () => {
    render(<AppRouter />)

    // 模拟页面卸载
    const event = new Event('beforeunload')
    window.dispatchEvent(event)

    await waitFor(() => {
      expect(mockCameraManager.forceStop).toHaveBeenCalled()
    })
  })
})