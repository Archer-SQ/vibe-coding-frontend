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

## 代码规范
- 统一使用 ESLint、Prettier、Stylelint 进行代码风格校验
- 组件开发优先函数组件与 Hooks
- 样式采用 Less，禁止全局污染

## 其他说明
详见项目根目录下 `project_rules.md`。
