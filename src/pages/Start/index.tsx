import React from 'react'
import planeImg from '../../assets/image-removebg-preview.png'
import './index.less'

const Start: React.FC<{ onStart?: () => void; onRank?: () => void }> = ({ onStart, onRank }) => {
  return (
    <div className="start-bg">
      <div className="start-content">
        <h1 className="start-title">手势飞机大战</h1>
        <div className="start-desc">体验前沿的手势识别技术</div>
        <div className="start-icon">
          {/* 飞机像素图片icon */}
          <img src={planeImg} alt="飞机" className="start-plane-img" />
        </div>
        <div className="start-btns">
          <button className="start-btn start-btn-play" onClick={onStart}>
            开始游戏
          </button>
          <button className="start-btn start-btn-rank" onClick={onRank}>
            排行榜
          </button>
        </div>
        <div className="start-tip">使用摄像头进行手势识别，获得沉浸式游戏体验</div>
      </div>
    </div>
  )
}

export default Start
