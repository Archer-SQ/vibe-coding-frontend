# Git Flow 分支管理指南

## 概述

本项目采用 Git Flow 工作流进行分支管理，确保代码质量和发布流程的规范化。

## 分支结构

### 主要分支

- **main**: 生产分支，包含稳定的生产代码
- **develop**: 开发分支，包含最新的开发功能

### 支持分支

- **feature/**: 功能分支，用于开发新功能
- **release/**: 发布分支，用于准备新版本发布
- **hotfix/**: 热修复分支，用于紧急修复生产问题

## 工作流程

### 1. 功能开发

```bash
# 开始新功能开发
git flow feature start <功能名称>

# 例如：开发手势识别优化功能
git flow feature start gesture-optimization

# 开发完成后，完成功能分支
git flow feature finish gesture-optimization
```

### 2. 发布准备

```bash
# 开始新版本发布
git flow release start <版本号>

# 例如：准备 v1.0.0 版本
git flow release start v1.0.0

# 发布完成后
git flow release finish v1.0.0
```

### 3. 热修复

```bash
# 开始热修复
git flow hotfix start <修复名称>

# 例如：修复摄像头权限问题
git flow hotfix start camera-permission-fix

# 修复完成后
git flow hotfix finish camera-permission-fix
```

## 分支命名规范

### Feature 分支
- `feature/功能模块-具体功能`
- 例如：
  - `feature/game-engine-optimization`
  - `feature/gesture-recognition-improvement`
  - `feature/ui-responsive-design`

### Release 分支
- `release/v主版本.次版本.修订版本`
- 例如：
  - `release/v1.0.0`
  - `release/v1.1.0`
  - `release/v2.0.0`

### Hotfix 分支
- `hotfix/问题描述`
- 例如：
  - `hotfix/camera-permission-error`
  - `hotfix/game-crash-fix`
  - `hotfix/security-vulnerability`

## 提交信息规范

遵循 Conventional Commits 规范：

```
<类型>[可选的作用域]: <描述>

[可选的正文]

[可选的脚注]
```

### 类型说明
- `feat`: 新功能
- `fix`: 修复问题
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 示例
```bash
feat(gesture): 添加新的手势识别算法

- 实现基于深度学习的手势识别
- 提高识别准确率到95%
- 支持更多手势类型

Closes #123
```

## 代码审查流程

1. **创建 Pull Request**: 功能开发完成后，创建 PR 到 develop 分支
2. **代码审查**: 至少需要一名团队成员审查代码
3. **自动化测试**: 确保所有测试通过
4. **合并代码**: 审查通过后合并到目标分支

## 发布流程

### 版本号规则
采用语义化版本控制 (Semantic Versioning)：

- **主版本号**: 不兼容的 API 修改
- **次版本号**: 向下兼容的功能性新增
- **修订版本号**: 向下兼容的问题修正

### 发布检查清单

- [ ] 所有功能测试通过
- [ ] 代码覆盖率达到要求
- [ ] 文档更新完成
- [ ] 版本号更新
- [ ] CHANGELOG 更新
- [ ] 生产环境部署测试

## 常用命令

### 查看分支状态
```bash
git branch -a                    # 查看所有分支
git flow feature list           # 查看功能分支
git flow release list          # 查看发布分支
git flow hotfix list           # 查看热修复分支
```

### 切换分支
```bash
git checkout develop           # 切换到开发分支
git checkout main             # 切换到主分支
git checkout feature/功能名    # 切换到功能分支
```

### 同步分支
```bash
git pull origin develop       # 同步开发分支
git pull origin main         # 同步主分支
```

## 注意事项

1. **永远不要直接在 main 分支上开发**
2. **功能分支应该从 develop 分支创建**
3. **定期同步 develop 分支的最新代码**
4. **提交前确保代码通过所有测试**
5. **遵循代码规范和提交信息规范**
6. **及时删除已合并的功能分支**

## 故障排除

### 常见问题

1. **分支冲突**: 使用 `git rebase` 或 `git merge` 解决
2. **误操作**: 使用 `git reflog` 查看操作历史并恢复
3. **分支同步**: 定期执行 `git pull` 保持分支同步

### 紧急情况处理

如果遇到紧急问题需要立即修复：

1. 从 main 分支创建 hotfix 分支
2. 快速修复问题
3. 测试验证修复效果
4. 完成 hotfix 流程，同时合并到 main 和 develop

## 团队协作建议

1. **每日同步**: 每天开始工作前同步最新代码
2. **小步提交**: 频繁提交小的功能点，避免大批量提交
3. **及时沟通**: 遇到冲突或问题及时与团队沟通
4. **代码审查**: 认真进行代码审查，提高代码质量
5. **文档维护**: 及时更新相关文档和注释