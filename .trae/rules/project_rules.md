### 一、项目简介
- 📌 项目名称：手势飞机大战
- 💻 目标平台：PC端 Web 浏览器（支持主流浏览器）
- 👤 游玩人数：单人模式
- 🎮 游戏类型：像素风射击类网页游戏
- 📷 交互方式：基于摄像头的手势识别控制（移动与攻击）
- 🏆 核心玩法：玩家通过手势操控飞机在屏幕中移动、发射子弹，击败敌机与 Boss，拾取道具，闯关升级。
- 📈 附加功能：积分系统、历史排行榜、关卡进度存档。
### 二、技术选型
- 主语言 ：TypeScript（强类型，提升可维护性）
- 核心框架 ：React 18
- 状态管理 ：Zustand
- 路由管理 ：React Router v6
- UI 组件库 ：Ant Design
- HTTP 请求 ：Axios（统一请求封装，支持拦截器）
- 构建工具 ：Vite
- 代码规范 ：ESLint + Prettier + Stylelint（统一团队代码风格）
- 单元测试 ：Jest + React Testing Library
- 端到端测试 ：Cypress
- CI/CD ：GitHub Actions
- 包管理 ：pnpm
### 三、目录结构
- 组件/页面文件需与其对应的样式文件同名且放置在同一位置
```
├── public/                # 公共资源
├── mock/                  # mock数据
├── src/
│   ├── assets/            # 静态资源（图片、字体、样式）
│   ├── components/        # 通用基础组件
│   ├── pages/             # 页面级组件
│   ├── layouts/           # 页面布局组件
│   ├── services/          # API 请求与数据处理
│   ├── store/             # 状态管理（Redux/Pinia）
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
### 四、开发规范
- 组件开发 ：原子化、低耦合、高复用，优先函数组件，Hooks 优先
- TS规范 ：严格定义类型，避免 any 类型，使用泛型增强类型安全，非必要不使用@ts-ignore
- 样式管理 ：Less，禁止全局污染，非必要不使用行内样式
- 请求管理 ：使用async/await处理异步请求
- 接口管理 ：统一 API 封装，错误码与异常处理机制标准化，统一处理异常
- 权限体系 ：无权限
- 国际化 ：i18n
- 响应式设计 ：只需适配PC端
- 性能优化 ：懒加载、代码分割、图片压缩
- 安全规范 ：XSS/CSRF 防护、依赖安全扫描
### 五、工程化与协作
- 分支管理 ：Git Flow
- 代码提交 ：Commitlint + Husky，强制规范化提交信息
- 自动化测试 ：PR 必须通过单元测试与端到端测试
- 持续集成 ：自动化构建、测试、部署
- 代码审查 ：强制 Code Review，主干保护
### 六、其他约定
- 环境变量管理 ：区分 dev、test、prod 环境
- 页面需要自适应，不需要考虑移动端
- 禁止自行进行大规模的UI设计改动
- 图片导入采用ES6模块导入
- 注释全部使用中文