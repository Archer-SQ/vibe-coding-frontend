import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import Start from '../../../src/pages/Start/index'

// Mock 图片资源
jest.mock('../../../src/assets/image-removebg-preview.png', () => 'plane-image.png', { virtual: true })

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Start 页面', () => {
  const mockOnStart = jest.fn()
  const mockOnRank = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('应该正确渲染页面内容', () => {
    renderWithRouter(<Start onStart={mockOnStart} onRank={mockOnRank} />)

    // 检查标题
    expect(screen.getByText('手势飞机大战')).toBeInTheDocument()
    
    // 检查描述
    expect(screen.getByText('体验前沿的手势识别技术')).toBeInTheDocument()
    expect(screen.getByText('使用摄像头进行手势识别，获得沉浸式游戏体验')).toBeInTheDocument()
    
    // 检查按钮
    expect(screen.getByText('开始游戏')).toBeInTheDocument()
    expect(screen.getByText('排行榜')).toBeInTheDocument()
  })

  it('点击开始游戏按钮应该调用onStart回调', () => {
    renderWithRouter(<Start onStart={mockOnStart} onRank={mockOnRank} />)

    const startButton = screen.getByText('开始游戏')
    fireEvent.click(startButton)

    expect(mockOnStart).toHaveBeenCalled()
  })

  it('点击排行榜按钮应该调用onRank回调', () => {
    renderWithRouter(<Start onStart={mockOnStart} onRank={mockOnRank} />)

    const rankButton = screen.getByText('排行榜')
    fireEvent.click(rankButton)

    expect(mockOnRank).toHaveBeenCalled()
  })

  it('应该有正确的样式类名', () => {
    const { container } = renderWithRouter(<Start onStart={mockOnStart} onRank={mockOnRank} />)

    // 检查主容器
    expect(container.firstChild).toHaveClass('start-bg')
    
    // 检查内容容器
    const content = container.querySelector('.start-content')
    expect(content).toBeInTheDocument()
    
    // 检查按钮容器
    const buttonGroup = container.querySelector('.start-btns')
    expect(buttonGroup).toBeInTheDocument()
  })

  it('应该显示飞机图片', () => {
    renderWithRouter(<Start onStart={mockOnStart} onRank={mockOnRank} />)

    const planeImg = screen.getByAltText('飞机')
    expect(planeImg).toBeInTheDocument()
    expect(planeImg).toHaveClass('start-plane-img')
  })
})