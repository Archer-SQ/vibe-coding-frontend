# 手势飞机大战 - Vercel 部署指南

## 🚀 部署准备

### 1. 项目配置检查

✅ **已完成的配置：**
- `vercel.json` - Vercel 部署配置文件
- `.env.production` - 生产环境变量
- `package.json` - 添加了部署脚本
- 构建测试通过 - 项目可正常构建

### 2. 环境要求

- Node.js 18.x 或更高版本
- pnpm 包管理器
- Git 版本控制
- Vercel 账户

## 📋 部署步骤

### 方式一：Vercel CLI 部署（推荐）

#### 1. 安装 Vercel CLI
```bash
npm i -g vercel
```

#### 2. 登录 Vercel
```bash
vercel login
```

#### 3. 初始化项目
```bash
vercel
```
按提示选择：
- Set up and deploy? → Yes
- Which scope? → 选择你的账户
- Link to existing project? → No
- What's your project's name? → vibe-coding-frontend
- In which directory is your code located? → ./

#### 4. 部署到生产环境
```bash
pnpm run deploy:prod
# 或者
vercel --prod
```

### 方式二：GitHub 集成部署

#### 1. 推送代码到 GitHub
```bash
git add .
git commit -m "feat: 配置Vercel部署"
git push origin main
```

#### 2. 在 Vercel Dashboard 导入项目
1. 访问 [vercel.com](https://vercel.com)
2. 点击 "New Project"
3. 选择 GitHub 仓库
4. 配置项目设置：
   - **Framework Preset**: Vite
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

## ⚙️ 环境变量配置

在 Vercel Dashboard 的项目设置中添加以下环境变量：

```env
# API 配置
VITE_API_BASE_URL=https://your-api-domain.com

# 应用配置
VITE_APP_TITLE=手势飞机大战
VITE_APP_VERSION=1.0.0

# 功能开关
VITE_ENABLE_GESTURE=true
VITE_ENABLE_CAMERA=true
VITE_ENABLE_DEBUG=false

# 性能配置
VITE_GESTURE_CONFIDENCE_THRESHOLD=0.8
VITE_CAMERA_FPS=30
```

## 🔧 项目配置说明

### vercel.json 配置
```json
{
  "version": 2,
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "installCommand": "pnpm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 构建优化
- 代码分割：React、UI组件、手势识别库分别打包
- 静态资源缓存：1年缓存策略
- 代码压缩：生产环境移除 console 和 debugger
- 安全头：添加 XSS 防护和内容类型保护

## 🧪 部署验证

### 功能测试清单
- [ ] 页面正常加载
- [ ] 路由跳转正常（首页、游戏、排行榜）
- [ ] 摄像头权限请求正常
- [ ] 手势识别功能正常
- [ ] 游戏逻辑正常运行
- [ ] 静态资源加载正常
- [ ] 响应式布局正常

### 性能检查
```bash
# 本地预览构建结果
pnpm preview
```

使用 Chrome DevTools Lighthouse 检查：
- Performance > 90
- Accessibility > 90
- Best Practices > 90
- SEO > 80

## 🔄 持续部署

### 自动部署配置
- **主分支推送** → 自动部署到生产环境
- **功能分支推送** → 自动创建预览部署
- **Pull Request** → 自动创建预览链接

### 部署脚本
```json
{
  "scripts": {
    "deploy": "vercel",
    "deploy:prod": "vercel --prod",
    "vercel-build": "pnpm build"
  }
}
```

## ⚠️ 重要注意事项

### 1. HTTPS 要求
- 摄像头功能需要 HTTPS 环境
- Vercel 自动提供 HTTPS 支持
- 自定义域名需要配置 SSL 证书

### 2. API 跨域配置
确保后端 API 配置了正确的 CORS 策略：
```javascript
// 后端 CORS 配置示例
app.use(cors({
  origin: ['https://your-vercel-domain.vercel.app'],
  credentials: true
}));
```

### 3. 静态资源优化
- 图片资源已优化压缩
- 使用 WebP 格式（如需要）
- 大文件建议使用 CDN

### 4. 浏览器兼容性
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 🐛 常见问题解决

### 构建失败
```bash
# 清理依赖重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### 路由 404 错误
- 检查 `vercel.json` 中的 `rewrites` 配置
- 确保 SPA 路由重写规则正确

### 环境变量未生效
- 确保变量名以 `VITE_` 开头
- 在 Vercel Dashboard 中重新部署

### 摄像头无法访问
- 确认部署域名使用 HTTPS
- 检查浏览器权限设置
- 测试不同浏览器兼容性

## 📞 技术支持

如遇到部署问题，请检查：
1. Vercel 部署日志
2. 浏览器控制台错误
3. 网络请求状态
4. 环境变量配置

---

🎉 **部署完成后，你的手势飞机大战就可以在线体验了！**