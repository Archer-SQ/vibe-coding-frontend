import React, { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { cameraManager } from '../utils/cameraManager'

// 懒加载页面组件
const Start = lazy(() => import('../pages/Start'))
const Rank = lazy(() => import('../pages/Rank'))
const Game = lazy(() => import('../pages/Game'))
const GestureDebug = lazy(() => import('../pages/GestureDebug'))
const GestureTest = lazy(() => import('../pages/GestureTest'))

// 加载中组件
const PageLoading: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }}>
    <Spin size="large" />
  </div>
)

const StartWithNav: React.FC = () => {
  const navigate = useNavigate()
  return <Start 
    onStart={() => navigate('/game')} 
    onRank={() => navigate('/rank')} 
  />
}

const RouterWithCameraControl: React.FC = () => {
  const location = useLocation()
  
  useEffect(() => {
    // 只要进入首页或排行榜页面就关闭摄像头
    if (location.pathname === '/' || location.pathname === '/rank') {
      cameraManager.forceStop()
    }
  }, [location.pathname])

  // 页面卸载时强制关闭摄像头
  useEffect(() => {
    const handleBeforeUnload = () => {
      cameraManager.forceStop()
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cameraManager.forceStop()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // 组件卸载时也关闭摄像头
      cameraManager.forceStop()
    }
  }, [])
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/" element={<StartWithNav />} />
        <Route path="/rank" element={<Rank />} />
        <Route path="/game" element={<Game />} />
        <Route path="/debug" element={<GestureDebug />} />
        <Route path="/test" element={<GestureTest />} />
      </Routes>
    </Suspense>
  )
}

const AppRouter: React.FC = () => (
  <BrowserRouter>
    <RouterWithCameraControl />
  </BrowserRouter>
)

export default AppRouter
