# Mock 服务使用说明

## 概述
项目提供了独立的 Mock 服务，用于模拟后端 API 接口，方便前端开发和测试。

## 可用命令

### 启动 Mock 服务
```bash
# 启动 Mock 服务（生产模式）
pnpm mock

# 启动 Mock 服务（开发模式，支持热重载）
pnpm mock:dev
```

## 服务端口

- **Mock 服务**: `http://localhost:3002`
- **前端开发服务**: `http://localhost:5173`

## API 接口

Mock 服务提供以下 API 接口：

| 接口路径 | 方法 | 描述 | 示例数据 |
|---------|------|------|----------|
| `/api/rank/global` | GET | 全球排行榜 | 10条随机数据 |
| `/api/rank/weekly` | GET | 本周排行榜 | 5条随机数据 |
| `/api/rank/friend` | GET | 好友排行榜 | 4条随机数据 |
| `/api/rank/personal` | GET | 个人信息 | 个人排名、分数等 |

## 使用场景

### 1. 前端开发
使用 Mock 服务进行前端开发：

```bash
# 终端1：启动前端服务
pnpm dev

# 终端2：启动 Mock 服务
pnpm mock:dev
```

前端请求配置中的 `baseURL` 应设置为 `http://localhost:3002`。

### 2. 接口测试
可以直接使用 curl 或其他工具测试 Mock 接口：

```bash
# 测试全球排行榜
curl http://localhost:3002/api/rank/global

# 测试个人信息
curl http://localhost:3002/api/rank/personal
```

## 数据格式

所有接口返回统一的数据格式：

```json
{
  "code": 0,
  "data": {
    // 具体数据内容
  },
  "msg": "success"
}
```

## 注意事项

1. Mock 服务使用 MockJS 生成随机数据，每次请求返回的数据都可能不同
2. Mock 服务已配置 CORS，支持跨域请求
3. 开发模式（`:dev` 命令）支持文件变更时自动重启