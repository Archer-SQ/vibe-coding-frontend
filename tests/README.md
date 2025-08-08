# 测试文档
## 概述
本项目使用 Jest 和 React Testing Library 进行单元测试，主要测试以下核心功能

- 手势识别功能 (`useGestureRecognition`)
- 游戏控制逻辑 (`useGameControl`)
- 组件渲染 (`CameraPreview`)
- 工具函数 (`gestureUtils`)

## 安装测试依赖

首先安装测试相关的依赖包：

```bash
pnpm add -D @testing-library/jest-dom @testing-library/react @testing-library/user-event @types/jest jest jest-environment-jsdom ts-jest
```

## 运行测试

### 运行所有测试
```bash
pnpm test
```

### 监听模式运行测试
```bash
pnpm run test:watch
```

### 生成覆盖率报告
```bash
pnpm run test:coverage
```

### CI环境运行测试
```bash
pnpm run test:ci
```

## 测试文件结构

```
tests/
├── setup.ts                           # 测试环境设置
├── types.d.ts                         # 测试类型定义
├── hooks/
│   ├── useGestureRecognition.test.ts   # 手势识别Hook测试
│   └── useGameControl.test.ts          # 游戏控制Hook测试
├── components/
│   └── CameraPreview.test.tsx          # 摄像头预览组件测试
└── utils/
    └── gestureUtils.test.ts            # 手势工具函数测试
```

## 测试重点

### 1. 手势识别测试 (useGestureRecognition)
- ✅ 初始状态验证
- ✅ 配置更新功能
- ✅ 摄像头启动/停止
- ✅ 手势识别开关
- ✅ 错误处理（权限拒绝、设备不存在）
- ✅ 资源清理

### 2. 游戏控制测试 (useGameControl)
- ✅ 游戏状态管理（开始、暂停、结束、重置）
- ✅ 分数、等级、生命值更新
- ✅ 手势输入处理
- ✅ 玩家位置更新
- ✅ 游戏结束条件

### 3. 组件测试 (CameraPreview)
- ✅ 组件渲染
- ✅ 属性传递
- ✅ 事件处理
- ✅ 样式应用

### 4. 工具函数测试 (gestureUtils)
- ✅ 距离计算
- ✅ 角度计算
- ✅ 手势识别算法
- ✅ 边界情况处理

## Mock 说明

测试中使用了以下 Mock：

1. **MediaPipe Mock**: 模拟 MediaPipe Hands 库
2. **Camera Mock**: 模拟摄像头 API
3. **DOM Mock**: 模拟 HTML 元素（video, canvas）
4. **Animation Mock**: 模拟 requestAnimationFrame

## 注意事项

1. **依赖安装**: 运行测试前需要先安装测试依赖
2. **TypeScript 支持**: 配置了完整的 TypeScript 支持
3. **覆盖率报告**: 生成在 `coverage/` 目录下
4. **CI 集成**: 提供了 CI 环境的测试脚本

## 下一步

1. 安装测试依赖包
2. 运行测试验证配置
3. 根据实际代码调整测试用例
4. 添加更多边界情况测试
5. 集成到 CI/CD 流程

## 故障排除

如果遇到测试问题：

1. 确保所有依赖已正确安装
2. 检查 Jest 配置是否正确
3. 验证 TypeScript 配置
4. 查看控制台错误信息
5. 检查 Mock 配置是否匹配实际代码