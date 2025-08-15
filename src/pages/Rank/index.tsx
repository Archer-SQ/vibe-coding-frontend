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
    // 个人信息获取 - 从排行榜数据中查找当前设备的排名
    const fetchPersonal = async () => {
      try {
        const { getOrCreateDeviceId } = await import('../../utils/deviceUtils')
        const currentDeviceId = getOrCreateDeviceId()
        
        // 从全球榜中查找当前设备的排名信息
        const response = await request<{
          success: boolean
          data: {
            type: string
            rankings: RankItem[]
            count: number
          }
          timestamp: number
        }>({ 
          url: '/api/game/ranking?type=all', 
          method: 'get' 
        })
        
        if (response.success && response.data.rankings) {
          // 查找当前设备在排行榜中的位置
          const currentPlayerRank = response.data.rankings.find(
            item => item.deviceId === currentDeviceId
          )
          
          if (currentPlayerRank) {
            setPersonal({
              rank: currentPlayerRank.rank,
              score: currentPlayerRank.score,
              updatedAt: new Date(currentPlayerRank.updatedAt).toLocaleString()
            })
          } else {
            // 如果在排行榜中没有找到，说明还没有提交过成绩
            setPersonal({
              rank: 0,
              score: 0,
              updatedAt: '暂无记录'
            })
          }
        } else {
          setPersonal(defaultPersonal)
        }
      } catch (error) {
        console.error('获取个人排名信息失败:', error)
        setPersonal(defaultPersonal)
      }
    }
    fetchPersonal()
  }, [activeTab])

  return (
    <div className="rank-bg">

      <div className="rank-content">
        <h1 className="rank-title">排行榜</h1>
        {/* 个人最佳 */}
        <div className="rank-personal">
          <div className="rank-personal-item">
            <div className="rank-personal-label">全球排名</div>
            <div className="rank-personal-value">{personal.rank === 0 ? '未上榜' : `第${personal.rank}名`}</div>
          </div>
          <div className="rank-personal-item">
            <div className="rank-personal-label">最高分数</div>
            <div className="rank-personal-value">{personal.score === 0 ? '暂无记录' : `${personal.score}分`}</div>
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
