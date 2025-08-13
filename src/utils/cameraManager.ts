/**
 * 全局摄像头管理器
 * 确保整个应用只有一个摄像头实例，避免冲突
 */
class CameraManager {
  private stream: MediaStream | null = null
  private videoElement: HTMLVideoElement | null = null
  private isActive = false
  private callbacks = new Set<() => void>()

  /**
   * 启动摄像头
   */
  async startCamera(): Promise<MediaStream> {
    if (this.stream && this.isActive) {
      return this.stream
    }

    try {
      // 检查浏览器是否支持MediaDevices API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('您的浏览器不支持摄像头功能，请使用Chrome、Firefox或Safari等现代浏览器')
      }

      // 如果有旧的流，先清理
      if (this.stream) {
        this.stopAllTracks()
      }

      // 请求摄像头权限
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      }

      this.stream = await navigator.mediaDevices.getUserMedia(constraints)
      this.isActive = true

      // 异步通知所有监听器
      setTimeout(() => {
        this.callbacks.forEach((callback) => {
          try {
            callback()
          } catch (error) {
            // 监听器执行失败时的错误处理
          }
        })
      }, 0)

      return this.stream
    } catch (error) {
      this.isActive = false
      
      // 根据错误类型提供具体的错误信息
      let errorMessage = '摄像头启动失败'
      
      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = '摄像头权限被拒绝，请在浏览器设置中允许访问摄像头'
            break
          case 'NotFoundError':
            errorMessage = '未找到摄像头设备，请检查摄像头是否正确连接'
            break
          case 'NotReadableError':
            errorMessage = '摄像头被其他应用占用，请关闭其他使用摄像头的应用'
            break
          case 'OverconstrainedError':
            errorMessage = '摄像头不支持所需的分辨率，请尝试使用其他摄像头'
            break
          case 'SecurityError':
            errorMessage = '安全限制：请确保网站使用HTTPS协议访问'
            break
          case 'AbortError':
            errorMessage = '摄像头启动被中断'
            break
          default:
            errorMessage = error.message || '摄像头启动失败，请检查设备和权限设置'
        }
      }
      
      const enhancedError = new Error(errorMessage)
      enhancedError.name = error instanceof Error ? error.name : 'CameraError'
      throw enhancedError
    }
  }

  /**
   * 停止摄像头
   */
  async stopCamera(): Promise<void> {
    if (!this.stream || !this.isActive) {
      return
    }

    // 清理视频元素
    if (this.videoElement) {
      this.videoElement.srcObject = null
    }

    // 停止所有轨道
    this.stopAllTracks()

    this.stream = null
    this.videoElement = null
    this.isActive = false

    // 异步通知所有监听器
    setTimeout(() => {
      this.callbacks.forEach((callback) => {
        try {
          callback()
        } catch (error) {
          // 监听器执行失败时的错误处理
        }
      })
    }, 0)
  }

  /**
   * 停止所有媒体轨道
   */
  private stopAllTracks(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop()
      })
    }
  }

  /**
   * 获取摄像头状态
   */
  getStatus() {
    // 检查MediaStream的实际状态
    if (this.stream && this.isActive) {
      const tracks = this.stream.getTracks()
      const hasActiveTracks = tracks.some(track => track.readyState === 'live')
      
      // 如果没有活跃的轨道，说明摄像头实际上已经停止了
      if (!hasActiveTracks) {
        this.isActive = false
        this.stream = null
        this.videoElement = null
      }
    }
    
    return {
      isActive: this.isActive,
      stream: this.stream,
      hasVideo: !!this.videoElement,
    }
  }

  /**
   * 设置视频元素
   */
  setVideoElement(video: HTMLVideoElement): void {
    this.videoElement = video
    if (this.stream) {
      video.srcObject = this.stream
    }
  }

  /**
   * 添加状态监听器
   */
  addStatusListener(callback: () => void): void {
    this.callbacks.add(callback)
  }

  /**
   * 移除状态监听器
   */
  removeStatusListener(callback: () => void): void {
    this.callbacks.delete(callback)
  }

  /**
   * 检查摄像头权限状态
   */
  async checkPermission(): Promise<{ state: string; message: string }> {
    try {
      if (!navigator.permissions) {
        return { 
          state: 'unknown', 
          message: '浏览器不支持权限查询，请手动授权摄像头权限' 
        }
      }

      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
      
      switch (permission.state) {
        case 'granted':
          return { 
            state: 'granted', 
            message: '摄像头权限已授权' 
          }
        case 'denied':
          return { 
            state: 'denied', 
            message: '摄像头权限被拒绝，请在浏览器设置中重新授权' 
          }
        case 'prompt':
          return { 
            state: 'prompt', 
            message: '需要请求摄像头权限' 
          }
        default:
          return { 
            state: 'unknown', 
            message: '权限状态未知' 
          }
      }
    } catch (error) {
      return { 
        state: 'error', 
        message: '权限检查失败' 
      }
    }
  }

  /**
   * 检查浏览器兼容性
   */
  checkCompatibility(): { supported: boolean; message: string } {
    if (!navigator.mediaDevices) {
      return {
        supported: false,
        message: '浏览器不支持MediaDevices API，请使用Chrome 53+、Firefox 36+或Safari 11+等现代浏览器'
      }
    }

    if (!navigator.mediaDevices.getUserMedia) {
      return {
        supported: false,
        message: '浏览器不支持getUserMedia API，请更新浏览器到最新版本'
      }
    }

    // 检查是否为HTTPS环境（localhost除外）
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    if (!isSecure) {
      return {
        supported: false,
        message: '摄像头功能需要HTTPS协议，请使用HTTPS访问或在localhost环境下测试'
      }
    }

    return {
      supported: true,
      message: '浏览器支持摄像头功能'
    }
  }

  /**
   * 强制关闭摄像头（用于页面卸载等紧急情况）
   */
  forceStop(): void {
    if (this.stream) {
      this.stopAllTracks()
      this.stream = null
    }
    this.videoElement = null
    this.isActive = false
  }
}

// 导出单例实例
export const cameraManager = new CameraManager()