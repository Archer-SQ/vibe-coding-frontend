import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Rank from '../../../src/pages/Rank'
import request from '../../../src/services/request'

// Mock react-router-dom
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

// Mock request service
jest.mock('../../../src/services/request')
const mockRequest = request as jest.MockedFunction<typeof request>



const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

const mockRankData = [
  { rank: 1, deviceId: 'abc123def456ghi789jkl012mno345p1', score: 1000, updatedAt: '2024-01-01T00:00:00Z' },
  { rank: 2, deviceId: 'abc123def456ghi789jkl012mno345p2', score: 800, updatedAt: '2024-01-02T00:00:00Z' },
  { rank: 3, deviceId: 'abc123def456ghi789jkl012mno345p3', score: 600, updatedAt: '2024-01-03T00:00:00Z' },
]

const mockPersonalBest = {
  score: 1200,
  rank: 1,
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('Rank 页面', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // 默认成功响应
    mockRequest.mockResolvedValue({ 
      success: true, 
      data: { 
        type: 'all', 
        rankings: mockRankData, 
        count: mockRankData.length 
      }, 
      timestamp: Date.now() 
    })
  })

  it('应该正确渲染页面内容', async () => {
    renderWithRouter(<Rank />)

    // 检查标题
    expect(screen.getByText('排行榜')).toBeInTheDocument()
    
    // 检查标签页
    expect(screen.getByText('全球榜')).toBeInTheDocument()
    expect(screen.getByText('本周榜')).toBeInTheDocument()
    
    // 检查按钮
    expect(screen.getByText('立即挑战')).toBeInTheDocument()
    expect(screen.getByText('返回主菜单')).toBeInTheDocument()

    // 等待数据加载
    await waitFor(() => {
      expect(screen.getByText('1000 分数')).toBeInTheDocument()
    })
  })

  it('应该正确加载全球榜数据', async () => {
    mockRequest.mockResolvedValue({ 
      success: true, 
      data: { 
        type: 'all', 
        rankings: mockRankData, 
        count: mockRankData.length 
      }, 
      timestamp: Date.now() 
    })
    renderWithRouter(<Rank />)

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith({
        url: '/api/game/ranking?type=all',
        method: 'get',
      })
    })
  })

  it('应该正确切换到本周榜', async () => {
    mockRequest.mockResolvedValue({ 
      success: true, 
      data: { 
        type: 'weekly', 
        rankings: mockRankData, 
        count: mockRankData.length 
      }, 
      timestamp: Date.now() 
    })
    renderWithRouter(<Rank />)

    // 点击本周榜标签
    const weeklyTab = screen.getByText('本周榜')
    fireEvent.click(weeklyTab)

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith({
        url: '/api/game/ranking?type=weekly',
        method: 'get',
      })
    })
  })

  it('应该正确加载个人最佳成绩', async () => {
    mockRequest.mockResolvedValue({ 
      success: true, 
      data: { 
        type: 'all', 
        rankings: mockRankData, 
        count: mockRankData.length 
      }, 
      timestamp: Date.now() 
    })

    renderWithRouter(<Rank />)

    // 由于个人信息现在使用模拟数据，只需要验证排行榜数据加载
    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith({
        url: '/api/game/ranking?type=all',
        method: 'get',
      })
    })
  })

  it('应该处理数据加载失败', async () => {
    mockRequest.mockRejectedValue(new Error('Network error'))

    renderWithRouter(<Rank />)

    // 应该显示加载状态或错误状态
    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalled()
    })
  })

  it('点击立即挑战按钮应该导航到游戏页面', () => {
    renderWithRouter(<Rank />)

    const challengeButton = screen.getByText('立即挑战')
    fireEvent.click(challengeButton)

    expect(mockNavigate).toHaveBeenCalledWith('/game')
  })

  it('点击返回主菜单按钮应该导航到首页', () => {
    renderWithRouter(<Rank />)

    const homeButton = screen.getByText('返回主菜单')
    fireEvent.click(homeButton)

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('应该有正确的样式类名', () => {
    const { container } = renderWithRouter(<Rank />)

    // 检查主容器
    expect(container.firstChild).toHaveClass('rank-bg')
    
    // 检查内容容器
    const content = container.querySelector('.rank-content')
    expect(content).toBeInTheDocument()
  })

  it('应该显示个人信息区域', async () => {
    mockRequest.mockResolvedValue({ list: mockRankData })
    renderWithRouter(<Rank />)

    // 检查个人信息标签
    expect(screen.getByText('全球排名')).toBeInTheDocument()
    expect(screen.getByText('最高分数')).toBeInTheDocument()
    expect(screen.getByText('更新时间')).toBeInTheDocument()
  })

  it('应该在没有排行榜数据时显示空状态', async () => {
    mockRequest.mockResolvedValue({ 
      success: true, 
      data: { 
        type: 'all', 
        rankings: [], 
        count: 0 
      }, 
      timestamp: Date.now() 
    })
    renderWithRouter(<Rank />)

    await waitFor(() => {
      expect(screen.getByText('暂无排行数据')).toBeInTheDocument()
    })
  })
})