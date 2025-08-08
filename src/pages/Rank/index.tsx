import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import request from '../../services/request'

// 类型定义
interface RankItem {
  medal?: string
  index: number
  name: string
  info: string
  score: number
}

interface PersonalInfo {
  rank: number
  score: number
  createdAt: string
}
import './index.less'

const rankTabs = [
  { key: 'global', label: '全球榜' },
  { key: 'weekly', label: '本周榜' },
]

const defaultPersonal: PersonalInfo = {
  rank: 0,
  score: 0,
  createdAt: '-',
}

const Rank: React.FC = () => {
  const [activeTab, setActiveTab] = useState('global')
  const [rankData, setRankData] = useState<RankItem[]>([])
  const [personal, setPersonal] = useState<PersonalInfo>(defaultPersonal)
  const navigate = useNavigate()

  useEffect(() => {
    // 榜单数据请求
    const fetchRankData = async () => {
      try {
        let rankData: RankItem[] = []
        if (activeTab === 'global') {
          const response = await request<{ list: RankItem[] }>({ url: '/api/rank/global', method: 'get' })
          rankData = response.list || []
        } else if (activeTab === 'weekly') {
          const response = await request<{ list: RankItem[] }>({ url: '/api/rank/weekly', method: 'get' })
          rankData = response.list || []
        }
        setRankData(rankData)
      } catch (error) {
        console.error('获取排行榜数据失败:', error)
        setRankData([])
      }
    }
    fetchRankData()
  }, [activeTab])

  useEffect(() => {
    // 个人信息请求
    const fetchPersonal = async () => {
      try {
        const response = await request<{ info: PersonalInfo }>({ url: '/api/rank/personal', method: 'get' })
        setPersonal(response.info || defaultPersonal)
      } catch (error) {
        console.error('获取个人信息失败:', error)
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
            <div className="rank-personal-label">创建时间</div>
            <div className="rank-personal-value">{personal.createdAt}</div>
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
              <div className={`rank-list-item ${item.medal ? 'top' + (idx + 1) : ''}`} key={idx}>
                {item.medal ? (
                  <span
                    className={`rank-medal ${idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : ''}`}
                  >
                    {item.medal}
                  </span>
                ) : (
                  <span className="rank-index">{item.index}</span>
                )}
                <span className="rank-name">{item.name}</span>
                <span className="rank-info">{item.info}</span>
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
