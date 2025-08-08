/**
 * 全局摄像头管理器
 * 解决多个hook实例导致的摄像头状态不同步问题
 */

class CameraManager {
  private static instance: CameraManager
  private stream: MediaStream | null = null
  private videoElement: HTMLVideoElement | null = null
  private isActive: boolean = false
  private callbacks: Set<() => void> = new Set()

  private constructor() {}

  static getInstance(): CameraManager {
    if (!CameraManager.instance) {
      CameraManager.instance = new CameraManager()
    }
    return CameraManager.instance
  }

  /**
   * 启动摄像头
   */
  async startCamera(): Promise<MediaStream> {
    if (this.stream && this.isActive) {
      return this.stream
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })
      this.isActive = true
      console.log('📷 全局摄像头已启动')
      return this.stream
    } catch (error) {
      console.error('❌ 全局摄像头启动失败:', error)
      throw error
    }
  }

  /**
   * 停止摄像头
   */
  stopCamera(): void {
    if (this.stream) {
      console.log('📷 正在关闭全局摄像头...')
      
      // 先清理视频元素的srcObject
      if (this.videoElement) {
        this.videoElement.srcObject = null
        this.videoElement.load() // 强制重新加载视频元素
        console.log('🎥 视频元素已清理')
      }
      
      // 停止所有轨道
      this.stream.getTracks().forEach(track => {
        console.log(`🔴 正在停止轨道: ${track.kind}, 状态: ${track.readyState}`)
        track.stop()
        console.log(`✅ 轨道已停止: ${track.kind}, 新状态: ${track.readyState}`)
      })
      
      // 清理stream引用
      this.stream = null
      this.isActive = false
      
      // 通知所有监听器
      this.callbacks.forEach(callback => callback())
      
      console.log('✅ 全局摄像头已完全关闭')
      
      // 额外的清理步骤：强制垃圾回收（如果可用）
      if (typeof window !== 'undefined' && 'gc' in window) {
        try {
          (window as typeof window & { gc: () => void }).gc()
        } catch {
          // 忽略错误，gc可能不可用
        }
      }
    } else {
      console.log('ℹ️ 摄像头未启动，无需关闭')
    }
  }

  /**
   * 获取摄像头状态
   */
  getStatus(): { isActive: boolean; stream: MediaStream | null } {
    return {
      isActive: this.isActive,
      stream: this.stream
    }
  }

  /**
   * 设置视频元素
   */
  setVideoElement(video: HTMLVideoElement | null): void {
    this.videoElement = video
  }

  /**
   * 添加状态变化监听器
   */
  addStatusListener(callback: () => void): void {
    this.callbacks.add(callback)
  }

  /**
   * 移除状态变化监听器
   */
  removeStatusListener(callback: () => void): void {
    this.callbacks.delete(callback)
  }

  /**
   * 强制关闭摄像头（用于路由切换）
   */
  forceStop(): void {
    console.log('🚨 强制关闭摄像头')
    this.stopCamera()
  }
}

export const cameraManager = CameraManager.getInstance()