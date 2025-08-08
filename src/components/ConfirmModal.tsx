import React from 'react'
import { Modal, Button } from 'antd'
import { TrophyOutlined, HomeOutlined, CloseOutlined } from '@ant-design/icons'
import './ConfirmModal.less'

interface ConfirmModalProps {
  visible: boolean
  type: 'ranking' | 'home'
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  type,
  onConfirm,
  onCancel
}): React.ReactElement => {
  const isRanking = type === 'ranking'
  
  return (
    <Modal
      open={visible}
      footer={null}
      closable={false}
      centered
      className="confirm-modal"
      styles={{ mask: { backgroundColor: 'rgba(0, 0, 0, 0.8)' } }}
    >
      <div className="confirm-modal-content">
        {/* 图标 */}
        <div className="confirm-icon">
          {isRanking ? (
            <TrophyOutlined className="icon-trophy" />
          ) : (
            <HomeOutlined className="icon-home" />
          )}
        </div>

        {/* 标题 */}
        <h2 className="confirm-title">
          {isRanking ? '查看排行榜' : '返回首页'}
        </h2>

        {/* 描述文字 */}
        <p className="confirm-description">
          游戏正在进行中，确定要离开{isRanking ? '查看排行榜' : '返回首页'}吗？
        </p>

        {/* 按钮组 */}
        <div className="confirm-buttons">
          <Button
            type="primary"
            size="large"
            className="confirm-btn"
            onClick={onConfirm}
            icon={isRanking ? <TrophyOutlined /> : <HomeOutlined />}
          >
            {isRanking ? '确定查看' : '确定返回'}
          </Button>
          
          <Button
            size="large"
            className="cancel-btn"
            onClick={onCancel}
            icon={<CloseOutlined />}
          >
            继续游戏
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmModal