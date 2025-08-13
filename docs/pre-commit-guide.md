# Pre-commit 检查指南

## 概述

项目已配置了 pre-commit 钩子，在每次代码提交前会自动执行以下检查：

1. **ESLint 检查** - 代码规范和语法检查
2. **Stylelint 检查** - 样式文件规范检查
3. **单元测试** - 确保所有测试用例通过

## 检查流程

当你执行 `git commit` 时，系统会自动运行以下步骤：

### 1. ESLint 检查
```bash
pnpm lint
```
- 检查 TypeScript/JavaScript 代码规范
- 忽略 `mock/`、`dist/`、`node_modules/` 等目录
- 如果检查失败，提交会被阻止

### 2. Stylelint 检查
```bash
pnpm lint:style
```
- 检查 CSS/Less 样式文件
- 支持 Less 语法
- 如果检查失败，提交会被阻止

### 3. 单元测试
```bash
pnpm test:ci
```
- 运行所有单元测试
- 生成覆盖率报告
- 如果测试失败，提交会被阻止

## 手动运行检查

你可以在提交前手动运行这些检查：

```bash
# 运行 ESLint 检查
pnpm lint

# 自动修复 ESLint 问题
pnpm lint:fix

# 运行 Stylelint 检查
pnpm lint:style

# 自动修复 Stylelint 问题
pnpm lint:style:fix

# 运行测试
pnpm test:ci
```

## 常见问题

### 如果 ESLint 检查失败
1. 查看错误信息，了解具体问题
2. 运行 `pnpm lint:fix` 自动修复可修复的问题
3. 手动修复剩余问题
4. 重新提交

### 如果 Stylelint 检查失败
1. 查看错误信息，了解具体问题
2. 运行 `pnpm lint:style:fix` 自动修复可修复的问题
3. 手动修复剩余问题
4. 重新提交

### 如果测试失败
1. 查看测试失败的具体原因
2. 修复代码或更新测试用例
3. 确保所有测试通过
4. 重新提交

## 配置文件

- **ESLint**: `eslint.config.js`
- **Stylelint**: `.stylelintrc.json`
- **Pre-commit 钩子**: `.husky/pre-commit`
- **测试配置**: `jest.config.js`

## 注意事项

- 所有检查都必须通过才能成功提交
- 建议在提交前先手动运行检查，以节省时间
- 如果遇到无法解决的问题，可以联系团队成员协助