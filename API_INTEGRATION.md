# 前后端联调配置说明

## 📋 概述

本文档说明了手势飞机大战游戏前端与后端API的联调配置。

## 🔧 配置变更

### 1. 环境变量更新

**开发环境** (`.env.development`):
```
VITE_API_BASE_URL=http://localhost:3000
```

**生产环境** (`.env.production`):
```
VITE_API_BASE_URL=https://api.yourdomain.com
```

### 2. Mock数据禁用

在 `src/main.tsx` 中已注释掉Mock.js：
```typescript
// import '../mock/index' // 暂时注释掉 mockjs，使用真实的 Node.js 服务器
```

### 3. 新增工具函数

**设备ID工具** (`src/utils/deviceUtils.ts`):
- `generateDeviceId()`: 生成32位十六进制设备ID
- `validateDeviceId()`: 验证设备ID格式
- `getOrCreateDeviceId()`: 获取或创建设备ID（自动存储到localStorage）
- `clearDeviceId()`: 清除设备ID

## 🚀 API接口适配

### 1. 提交游戏成绩

**原接口**: `/api/rank/submit`
**新接口**: `/api/game/submit`

**请求数据变更**:
```typescript
// 原格式
{
  score: number,
  level: number,
  duration: number,
  timestamp: number,
  playerName: string
}

// 新格式
{
  deviceId: string,  // 32位十六进制设备ID
  score: number      // 游戏分数
}
```

**响应数据变更**:
```typescript
// 新响应格式
{
  success: boolean,
  data: {
    recordId: string,
    isNewBest: boolean,
    currentBest: number,
    message: string
  },
  timestamp: number
}
```

### 2. 获取排行榜

**原接口**: 
- `/api/rank/global` (总榜)
- `/api/rank/weekly` (周榜)

**新接口**: `/api/game/ranking?type={all|weekly}`

**响应数据变更**:
```typescript
// 原格式
{
  list: Array<{
    medal?: string,
    index: number,
    name: string,
    info: string,
    score: number
  }>
}

// 新格式
{
  success: boolean,
  data: {
    type: string,
    rankings: Array<{
      rank: number,
      deviceId: string,
      score: number,
      createdAt: string
    }>,
    count: number
  },
  timestamp: number
}
```

### 3. 个人信息接口

目前API文档中没有个人信息接口，排行榜页面的个人信息部分暂时使用默认值。



## 📊 数据流程

### 游戏成绩提交流程

1. 游戏结束时自动获取或生成设备ID
2. 调用 `/api/game/submit` 提交成绩
3. 后端返回是否为新纪录的信息
4. 前端根据结果显示相应提示

### 排行榜获取流程

1. 进入排行榜页面
2. 根据选择的榜单类型调用相应接口
3. 渲染排行榜数据，前三名显示奖牌图标
4. 玩家名称显示为"玩家{设备ID前8位}"

## 🔍 调试建议

1. **检查网络请求**: 使用浏览器开发者工具查看Network面板
2. **查看控制台**: 检查是否有JavaScript错误
3. **验证设备ID**: 在localStorage中查看 `gesture_game_device_id`

## 📝 注意事项

1. **设备ID格式**: 必须是32位十六进制字符串 `[a-f0-9]{32}`
2. **分数范围**: 0-999999
3. **CORS配置**: 确保后端正确配置CORS
4. **错误处理**: 所有API调用都有错误处理机制
5. **本地存储**: 设备ID会自动存储在localStorage中

## 🚀 启动步骤

1. **启动后端服务**: 确保后端服务运行在 `http://localhost:3000`
2. **启动前端服务**: 运行 `pnpm dev`
3. **开始游戏**: 正常游戏流程，成绩会自动提交到后端

## 🔧 故障排除

### 常见问题

1. **接口404错误**: 检查后端服务是否启动
2. **CORS错误**: 检查后端CORS配置
3. **设备ID格式错误**: 清除localStorage重新生成
4. **网络超时**: 检查网络连接和后端服务状态

### 解决方案

1. 检查浏览器控制台错误信息
2. 验证环境变量配置
3. 确认后端服务正常运行