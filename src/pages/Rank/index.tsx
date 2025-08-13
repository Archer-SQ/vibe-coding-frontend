import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import request from '../../services/request'

// 类型定义
interface RankItem {
  rank: number
  deviceId: string
  score: number
  updatedAt: string
}

interface PersonalInfo {
  rank: number
  score: number
  updatedAt: string
}
import './index.less'

const rankTabs = [
  { key: 'all', label: '全球榜' },
  { key: 'weekly', label: '本周榜' },
]

const defaultPersonal: PersonalInfo = {
  rank: 0,
  score: 0,
  updatedAt: '-',
}

const Rank: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [rankData, setRankData] = useState<RankItem[]>([])
  const [personal, setPersonal] = useState<PersonalInfo>(defaultPersonal)
  const navigate = useNavigate()

  useEffect(() => {
    // 榜单数据请求
    const fetchRankData = async () => {
      try {
        const response = await request<{
          success: boolean
          data: {
            type: string
            rankings: RankItem[]
            count: number
          }
          timestamp: number
        }>({ 
          url: `/api/game/ranking?type=${activeTab}`, 
          method: 'get' 
        })
        
        if (response.success && response.data.rankings) {
          setRankData(response.data.rankings)
        } else {
          setRankData([])
        }
      } catch (error) {
        // 获取排行榜数据失败时的错误处理
        setRankData([])
      }
    }
    fetchRankData()
  }, [activeTab])

  useEffect(() => {
    // 个人信息请求 - 暂时使用模拟数据，因为API文档中没有个人信息接口
    const fetchPersonal = async () => {
      try {
        // 这里可以根据需要实现个人最佳成绩的获取逻辑
        // 目前使用默认值
        setPersonal(defaultPersonal)
      } catch (error) {
        // 获取个人信息失败时的错误处理
        setPersonal(defaultPersonal)
      }
    }
    fetchPersonal()
  }, [])

  return (
    <div className="rank-bg">

      <div className="rank-content">
        <h1 className="rank-title">排行榜</h1>
        {/* 个人最佳 */}
        <div className="rank-personal">
          <div className="rank-personal-item">
            <div className="rank-personal-label">全球排名</div>
            <div className="rank-personal-value">{personal.rank}</div>
          </div>
          <div className="rank-personal-item">
            <div className="rank-personal-label">最高分数</div>
            <div className="rank-personal-value">{personal.score}</div>
          </div>
          <div className="rank-personal-item">
            <div className="rank-personal-label">更新时间</div>
            <div className="rank-personal-value">{personal.updatedAt}</div>
          </div>
        </div>
        {/* 排行榜切换 */}
        <div className="rank-tabs">
          {rankTabs.map(tab => (
            <button
              key={tab.key}
              className={`rank-tab${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* 榜单列表，最多显示10条，超出滚动 */}
        <div className="rank-list scrollable">
          {rankData && rankData.length > 0 ? (
            rankData.slice(0, 10).map((item, idx) => (
              <div className={`rank-list-item ${idx < 3 ? 'top' + (idx + 1) : ''}`} key={item.deviceId}>
                {idx < 3 ? (
                  <span
                    className={`rank-medal ${idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : ''}`}
                  >
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </span>
                ) : (
                  <span className="rank-index">{item.rank}</span>
                )}
                <span className="rank-name">玩家{item.deviceId.substring(0, 8)}</span>
                <span className="rank-info">{new Date(item.updatedAt).toLocaleString()}</span>
                <span className="rank-score">{item.score} 分数</span>
              </div>
            ))
          ) : (
            <div className="rank-list-empty">暂无排行数据</div>
          )}
        </div>
        {/* 底部按钮 */}
        <div className="rank-actions">
          <button className="rank-action-btn primary" onClick={() => navigate('/game')}>
            立即挑战
          </button>
          <button className="rank-action-btn" onClick={() => navigate('/')}>
            返回主菜单
          </button>
        </div>
      </div>
    </div>
  )
}

export default Rank
