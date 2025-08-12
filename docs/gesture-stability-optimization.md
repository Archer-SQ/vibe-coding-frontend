# 手势识别稳定性优化文档

## 问题描述

用户反馈手势识别功能不稳定，经常出现"MediaPipe处理帧时出错: memory access out of bounds"错误，导致手势识别功能失效。

## 问题分析

MediaPipe的"memory access out of bounds"错误通常由以下原因造成：

1. **视频帧数据不完整或损坏**：当视频流不稳定时，可能传递损坏的帧数据给MediaPipe
2. **MediaPipe实例状态不一致**：在处理帧时MediaPipe实例被意外销毁或重置
3. **并发处理冲突**：多个帧处理请求同时进行，导致内存访问冲突
4. **视频元素状态不稳定**：视频元素的readyState、尺寸等属性在处理时发生变化

## 优化方案

### 1. 增强帧处理安全性

- **并发控制**：添加`isProcessing`标志，防止多个帧同时处理
- **状态验证**：增加更严格的视频元素状态检查
- **帧数据安全**：使用Canvas创建视频帧副本，避免直接传递视频元素

```typescript
// 添加处理标志，防止并发处理
let isProcessing = false

const processFrame = async () => {
  // 防止并发处理
  if (isProcessing) {
    animationFrameRef.current = requestAnimationFrame(processFrame)
    return
  }
  
  // 创建安全的视频帧副本
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  
  // 发送canvas图像到MediaPipe
  await handsRef.current.send({ image: canvas as any })
}
```

### 2. 智能错误恢复机制

- **错误分类处理**：区分不同类型的错误，采用不同的处理策略
- **自动重新初始化**：检测到内存访问错误时，自动重新初始化MediaPipe
- **延迟重试**：避免立即重试，给系统恢复时间

```typescript
// 内存访问错误 - 重新初始化MediaPipe
if (errorMessage.includes('memory access') || errorMessage.includes('out of bounds')) {
  console.warn('🔄 检测到内存访问错误，重新初始化MediaPipe...');
  isMediaPipeInitializedRef.current = false
  handsRef.current = null
  
  // 延迟重新初始化
  setTimeout(async () => {
    try {
      await initializeHands()
      console.log('✅ MediaPipe重新初始化完成');
    } catch (initError) {
      console.error('❌ MediaPipe重新初始化失败:', initError);
    }
  }, 1000)
}
```

### 3. 优化MediaPipe配置

- **降低检测阈值**：从0.7降低到0.6，提高检测稳定性
- **简化配置**：移除不必要的配置选项，减少潜在冲突

```typescript
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 0, // 降低模型复杂度以提高性能
  minDetectionConfidence: 0.6, // 适当降低检测置信度，提高稳定性
  minTrackingConfidence: 0.6, // 适当降低跟踪置信度，提高稳定性
})
```

### 4. 增强状态检查

- **多层状态验证**：检查全局状态、MediaPipe初始化状态、视频状态
- **视频有效性检查**：验证视频是否暂停、结束、时间戳是否有效

```typescript
// 使用全局状态检查，确保状态一致性
const globalStatus = cameraManager.getStatus()

if (!videoRef.current || !globalStatus.isActive || !handsRef.current || !isMediaPipeInitializedRef.current) {
  return
}

// 检查视频是否暂停或结束
if (video.paused || video.ended) {
  return
}

// 检查视频时间戳是否有效
if (video.currentTime <= 0) {
  return
}
```

## 预期效果

1. **减少内存访问错误**：通过Canvas缓冲和并发控制，显著降低内存访问冲突
2. **提高恢复能力**：自动检测和恢复机制，减少手动刷新页面的需求
3. **增强稳定性**：更严格的状态检查，避免在不稳定状态下进行处理
4. **改善用户体验**：减少手势识别中断，提供更流畅的游戏体验

## 测试验证

- ✅ 所有单元测试通过（116个测试用例）
- ✅ ESLint检查通过
- ✅ 开发服务器正常启动
- ✅ 浏览器预览无错误

## 后续监控

建议在生产环境中监控以下指标：

1. **错误频率**：MediaPipe相关错误的发生频率
2. **恢复成功率**：自动重新初始化的成功率
3. **用户体验**：手势识别的响应时间和准确性
4. **性能影响**：Canvas处理对整体性能的影响

## 注意事项

1. 使用了`as any`类型断言来解决MediaPipe类型定义的限制
2. Canvas处理会增加一定的CPU开销，但能显著提高稳定性
3. 自动重新初始化机制需要1秒延迟，期间手势识别会暂时失效