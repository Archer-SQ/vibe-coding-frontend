import { Modal, Button } from 'antd'
import { ReloadOutlined, TrophyOutlined, HomeOutlined } from '@ant-design/icons'
import { formatTime } from '../utils/timeUtils'
import './GameOverModal.less'

interface GameOverModalProps {
  visible: boolean
  onRestart: () => void
  onViewRanking: () => void
  onBackHome: () => void
  gameStats: {
    score: number
    time: number
  }
}

const GameOverModal = ({
  visible,
  onRestart,
  onViewRanking,
  onBackHome,
  gameStats
}: GameOverModalProps) => {
  return (
    <Modal
      open={visible}
      footer={null}
      closable={false}
      centered
      className="game-over-modal"
      styles={{ mask: { backgroundColor: 'rgba(0, 0, 0, 0.8)' } }}
      width={480}
    >
      <div className="game-over-modal-content">
        {/* 游戏结束图标 */}
        <div className="game-over-icon">
          <div className="game-over-circle">
            💀
          </div>
        </div>

        {/* 游戏结束标题 */}
        <div className="game-over-title">
          游戏结束
        </div>

        {/* 提示文本 */}
        <div className="game-over-subtitle">
          战斗结束，查看你的成绩！
        </div>

        {/* 游戏统计信息 */}
        <div className="game-stats">
          <div className="stat-item">
            <span className="stat-value">{gameStats.score}</span>
            <span className="stat-label">最终分数</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{formatTime(gameStats.time)}</span>
            <span className="stat-label">生存时间</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="game-over-actions">
          <Button
            type="primary"
            size="large"
            icon={<ReloadOutlined />}
            onClick={onRestart}
            className="restart-btn"
          >
            再次游戏
          </Button>
          
          <Button
            size="large"
            icon={<TrophyOutlined />}
            onClick={onViewRanking}
            className="ranking-btn"
          >
            查看排行榜
          </Button>
          
          <Button
            size="large"
            icon={<HomeOutlined />}
            onClick={onBackHome}
            className="home-btn"
          >
            主菜单
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default GameOverModal