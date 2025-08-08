import { Modal, Button } from 'antd'
import { PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { formatTime } from '../utils/timeUtils'
import './PauseModal.less'

interface PauseModalProps {
  visible: boolean
  onResume: () => void
  onRestart: () => void
  gameStats: {
    score: number
    time: number
  }
}

const PauseModal = ({ visible, onResume, onRestart, gameStats }: PauseModalProps) => {
  return (
    <Modal
      open={visible}
      footer={null}
      closable={false}
      centered
      className="pause-modal"
      styles={{ mask: { backgroundColor: 'rgba(0, 0, 0, 0.8)' } }}
      width={480}
    >
      <div className="pause-modal-content">
        {/* 暂停图标 */}
        <div className="pause-icon">
          <div className="pause-circle">⏸️</div>
        </div>

        {/* 游戏暂停标题 */}
        <div className="pause-title">游戏暂停</div>

        {/* 提示文本 */}
        <div className="pause-subtitle">休息一下，准备继续战斗！</div>

        {/* 游戏统计信息 */}
        <div className="game-stats">
          <div className="stat-item">
            <span className="stat-value">{gameStats.score}</span>
            <span className="stat-label">击杀</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{formatTime(gameStats.time)}</span>
            <span className="stat-label">时间</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="pause-actions">
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={onResume}
            className="resume-btn"
          >
            继续游戏
          </Button>

          <Button
            size="large"
            icon={<ReloadOutlined />}
            onClick={onRestart}
            className="restart-btn"
          >
            重新开始
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default PauseModal
