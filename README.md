# vibe-coding-frontend

## 项目简介
基于 React 18 + TypeScript + Vite 的前端项目，集成 Ant Design、Zustand、React Router、Axios 等现代化技术栈，规范化工程配置，适用于中大型前端项目开发。

## 技术栈
- React 18
- TypeScript
- Vite
- Ant Design
- Zustand
- React Router v6
- Axios
- ESLint + Prettier + Stylelint
- Jest + React Testing Library
- Cypress
- pnpm

## 目录结构
```
├── public/                # 公共资源
├── mock/                  # mock数据
├── src/
│   ├── assets/            # 静态资源（图片、字体、样式）
│   ├── components/        # 通用基础组件
│   ├── pages/             # 页面级组件
│   ├── layouts/           # 页面布局组件
│   ├── services/          # API 请求与数据处理
│   ├── store/             # 状态管理
│   ├── hooks/             # 自定义 hooks
│   ├── utils/             # 工具函数
│   ├── router/            # 路由配置
│   ├── constants/         # 常量定义
│   ├── types/             # TypeScript 类型定义
│   └── App.tsx            # 应用入口
├── tests/                 # 测试用例
├── .husky/                # Git 钩子
├── .github/               # CI/CD 配置
├── .env*                  # 环境变量
└── package.json
```

## 快速开始
```bash
pnpm install
pnpm run dev
```

## 部署

### 手动部署
```bash
# 构建项目
pnpm run build

# 部署到Vercel
pnpm run deploy:prod
```

### 自动部署
项目已配置GitHub Actions自动部署，当代码推送到`main`分支时会自动触发部署流程：

1. **代码质量检查**：ESLint、Stylelint、单元测试
2. **构建验证**：确保项目可以正常构建
3. **自动部署**：部署到Vercel生产环境

#### 配置自动部署
详细配置步骤请参考：[自动部署配置指南](./docs/auto-deploy-setup.md)

#### 部署状态
- 🟢 **生产环境**：https://vibe-coding-frontend.vercel.app
- 📊 **部署状态**：[![Deploy Status](https://github.com/your-username/vibe-coding-frontend/workflows/自动部署到Vercel/badge.svg)](https://github.com/your-username/vibe-coding-frontend/actions)

## 开发流程

### Git Flow
项目采用Git Flow分支管理策略：

```bash
# 开发新功能
git flow feature start feature-name
git flow feature finish feature-name

# 发布版本
git flow release start v1.0.0
git flow release finish v1.0.0

# 紧急修复
git flow hotfix start hotfix-name
git flow hotfix finish hotfix-name
```

### 提交规范
使用Conventional Commits规范：

```bash
# 功能开发
git commit -m "feat: 添加用户登录功能"

# 问题修复
git commit -m "fix: 修复登录页面样式问题"

# 文档更新
git commit -m "docs: 更新API文档"
```

## 代码规范
- 统一使用 ESLint、Prettier、Stylelint 进行代码风格校验
- 组件开发优先函数组件与 Hooks
- 样式采用 Less，禁止全局污染
- 严格的TypeScript类型检查，避免使用any

## 测试

```bash
# 运行单元测试
pnpm run test

# 运行测试并生成覆盖率报告
pnpm run test:coverage

# 监听模式运行测试
pnpm run test:watch
```

## 其他说明
详见项目根目录下 `project_rules.md`。
