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
  { index: 1, name: '玩家1', info: '高级玩家', score: 1000, medal: '🥇' },
  { index: 2, name: '玩家2', info: '中级玩家', score: 800, medal: '🥈' },
  { index: 3, name: '玩家3', info: '初级玩家', score: 600, medal: '🥉' },
]

const mockPersonalBest = {
  score: 1200,
  rank: 1,
}

describe('Rank 页面', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // 默认成功响应
    mockRequest.mockResolvedValue({ list: mockRankData })
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
      expect(screen.getByText('玩家1')).toBeInTheDocument()
    })
  })

  it('应该正确加载全球榜数据', async () => {
    mockRequest.mockResolvedValue({ list: mockRankData })
    renderWithRouter(<Rank />)

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith({
        url: '/api/rank/global',
        method: 'get',
      })
    })
  })

  it('应该正确切换到本周榜', async () => {
    mockRequest.mockResolvedValue({ list: mockRankData })
    renderWithRouter(<Rank />)

    // 点击本周榜标签
    const weeklyTab = screen.getByText('本周榜')
    fireEvent.click(weeklyTab)

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith({
        url: '/api/rank/weekly',
        method: 'get',
      })
    })
  })

  it('应该正确加载个人最佳成绩', async () => {
    mockRequest
      .mockResolvedValueOnce({ list: mockRankData }) // 全球榜数据
      .mockResolvedValueOnce({ info: mockPersonalBest }) // 个人最佳成绩

    renderWithRouter(<Rank />)

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith({
        url: '/api/rank/personal',
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
    expect(screen.getByText('创建时间')).toBeInTheDocument()
  })

  it('应该在没有排行榜数据时显示空状态', async () => {
    mockRequest.mockResolvedValue({ list: [] })
    renderWithRouter(<Rank />)

    await waitFor(() => {
      expect(screen.getByText('暂无排行数据')).toBeInTheDocument()
    })
  })
})