# 自动部署配置指南

本文档将指导您如何设置GitHub Actions自动部署到Vercel。

## 前置条件

1. 项目已托管在GitHub上
2. 已有Vercel账号并完成项目部署
3. 具有GitHub仓库的管理员权限

## 配置步骤

### 1. 获取Vercel配置信息

#### 1.1 获取Vercel Token

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击右上角头像 → Settings
3. 在左侧菜单选择 "Tokens"
4. 点击 "Create Token"
5. 输入Token名称（如：`github-actions`）
6. 选择过期时间（建议选择较长时间）
7. 点击 "Create" 并复制生成的Token

#### 1.2 获取项目ID和组织ID

在项目根目录运行以下命令：

```bash
# 安装Vercel CLI（如果还没安装）
npm install -g vercel

# 登录Vercel
vercel login

# 在项目目录中运行
vercel link

# 查看项目配置
cat .vercel/project.json
```

您将看到类似以下内容：
```json
{
  "projectId": "prj_xxxxxxxxxxxxxxxxxxxx",
  "orgId": "team_xxxxxxxxxxxxxxxxxxxx"
}
```

### 2. 配置GitHub Secrets

1. 打开GitHub仓库页面
2. 点击 "Settings" 选项卡
3. 在左侧菜单中选择 "Secrets and variables" → "Actions"
4. 点击 "New repository secret" 添加以下三个密钥：

| Secret名称 | 值 | 说明 |
|-----------|----|---------|
| `VERCEL_TOKEN` | 步骤1.1中获取的Token | Vercel API访问令牌 |
| `VERCEL_PROJECT_ID` | 步骤1.2中的projectId | Vercel项目ID |
| `VERCEL_ORG_ID` | 步骤1.2中的orgId | Vercel组织ID |

### 3. 验证配置

配置完成后，您可以通过以下方式验证：

1. **推送代码到main分支**：
   ```bash
   git add .
   git commit -m "feat: 测试自动部署"
   git push origin main
   ```

2. **查看GitHub Actions执行情况**：
   - 在GitHub仓库页面点击 "Actions" 选项卡
   - 查看最新的工作流执行状态
   - 如果出现错误，点击具体的工作流查看详细日志

## 工作流说明

### 触发条件

- **自动触发**：当代码推送到 `main` 分支时
- **手动触发**：在GitHub Actions页面手动运行

### 执行流程

1. **代码质量检查**：
   - ESLint代码检查
   - Stylelint样式检查
   - 单元测试执行
   - 项目构建验证

2. **自动部署**（仅在main分支推送时）：
   - 安装Vercel CLI
   - 拉取Vercel环境配置
   - 构建生产版本
   - 部署到Vercel生产环境

### 部署策略

- **生产部署**：仅在 `main` 分支推送时触发
- **预览部署**：Pull Request会触发预览部署（需要额外配置）
- **回滚机制**：如果部署失败，Vercel会自动回滚到上一个稳定版本

## 常见问题

### Q1: 部署失败，提示Token无效

**解决方案**：
1. 检查 `VERCEL_TOKEN` 是否正确配置
2. 确认Token是否已过期
3. 重新生成Token并更新GitHub Secret

### Q2: 找不到项目ID或组织ID

**解决方案**：
1. 确保已在本地运行 `vercel link`
2. 检查 `.vercel/project.json` 文件是否存在
3. 如果文件不存在，重新运行 `vercel link` 并选择正确的项目

### Q3: 测试阶段失败

**解决方案**：
1. 在本地运行相同的命令确保通过：
   ```bash
   pnpm run lint
   pnpm run lint:style
   pnpm run test:ci
   pnpm run build
   ```
2. 修复所有错误后重新推送

### Q4: 部署成功但网站无法访问

**解决方案**：
1. 检查Vercel Dashboard中的部署状态
2. 查看部署日志是否有错误
3. 确认域名配置是否正确

## 高级配置

### 环境变量管理

如果项目需要环境变量，可以在Vercel Dashboard中配置：

1. 进入项目设置页面
2. 选择 "Environment Variables"
3. 添加所需的环境变量
4. 选择适用的环境（Production/Preview/Development）

### 自定义域名

1. 在Vercel Dashboard中进入项目设置
2. 选择 "Domains"
3. 添加自定义域名
4. 按照提示配置DNS记录

### 分支部署策略

如果需要为不同分支配置不同的部署策略，可以修改 `.github/workflows/deploy.yml` 文件：

```yaml
# 为develop分支添加预览部署
on:
  push:
    branches: [ main, develop ]

# 在deploy job中添加条件判断
- name: 部署到生产环境
  if: github.ref == 'refs/heads/main'
  run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}

- name: 部署到预览环境
  if: github.ref == 'refs/heads/develop'
  run: vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}
```

## 监控和通知

### Slack通知（可选）

如果团队使用Slack，可以添加部署通知：

1. 创建Slack Webhook URL
2. 在GitHub Secrets中添加 `SLACK_WEBHOOK_URL`
3. 在工作流中添加通知步骤

### 邮件通知

GitHub Actions默认会向仓库管理员发送失败通知邮件。

## 总结

完成以上配置后，您的项目将具备以下能力：

- ✅ 代码推送到main分支自动触发部署
- ✅ 部署前自动执行代码质量检查和测试
- ✅ 部署失败时自动回滚
- ✅ 详细的部署日志和状态反馈
- ✅ 支持手动触发部署

这样可以确保每次发布都经过充分的质量检查，提高项目的稳定性和可靠性。