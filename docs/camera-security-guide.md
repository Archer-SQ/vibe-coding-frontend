# 摄像头访问安全指南

## 🔒 为什么只有localhost能访问摄像头？

### 浏览器安全策略

现代浏览器出于用户隐私和安全考虑，对访问敏感设备（摄像头、麦克风等）有严格限制：

1. **安全上下文要求**：只有在"安全上下文"中才能访问摄像头
2. **HTTPS协议强制**：生产环境必须使用HTTPS
3. **localhost例外**：开发环境允许localhost和127.0.0.1访问

### 安全上下文定义

✅ **允许访问摄像头的环境：**
- `https://` 协议的网站
- `localhost` 域名
- `127.0.0.1` IP地址
- `file://` 协议（本地文件）

❌ **禁止访问摄像头的环境：**
- `http://` 协议的远程网站
- 局域网IP地址（如 `http://192.168.1.100`）
- 公网IP地址（如 `http://123.456.789.0`）

## 🛠️ 解决方案

### 开发环境

#### 方案1：使用localhost（推荐）
```bash
# 启动开发服务器
pnpm dev

# 访问地址
http://localhost:5175/
```

#### 方案2：启用HTTPS
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    https: true, // 启用自签名证书
    host: true,
    port: 5174,
  },
})
```

启用后访问：`https://localhost:5174/`

### 生产环境

#### 方案1：使用免费SSL证书
```bash
# 使用Let's Encrypt
certbot --nginx -d yourdomain.com
```

#### 方案2：云服务商SSL
- 阿里云SSL证书
- 腾讯云SSL证书
- Cloudflare SSL

#### 方案3：反向代理
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:5174;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔧 常见问题

### Q: 为什么局域网IP无法访问摄像头？
A: 浏览器认为HTTP协议下的局域网IP不安全，需要HTTPS协议。

### Q: 如何在手机上测试？
A: 配置HTTPS后，手机可以通过 `https://your-ip:5174` 访问。

### Q: 开发环境如何快速启用HTTPS？
A: 在 `vite.config.ts` 中设置 `https: true`，使用自签名证书。

### Q: 自签名证书的安全警告怎么办？
A: 开发环境可以点击"高级"→"继续访问"，生产环境必须使用正式证书。

## 📱 移动设备测试

### 启用HTTPS后的访问方式：
1. 确保手机和电脑在同一局域网
2. 获取电脑IP地址：`ipconfig`（Windows）或 `ifconfig`（Mac/Linux）
3. 手机访问：`https://192.168.x.x:5174`
4. 接受安全证书警告（开发环境）

## 🚀 部署建议

### Vercel部署
```json
{
  "functions": {
    "app/api/**/*.js": {
      "runtime": "@vercel/node"
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Netlify部署
```toml
[build]
  publish = "dist"
  command = "pnpm build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 🔍 调试工具

### 检查安全上下文
```javascript
// 在浏览器控制台运行
console.log('是否为安全上下文:', window.isSecureContext);
console.log('协议:', location.protocol);
console.log('主机名:', location.hostname);
```

### 检查摄像头权限
```javascript
// 检查权限状态
navigator.permissions.query({name: 'camera'})
  .then(permission => console.log('摄像头权限:', permission.state));
```

## 📚 相关资源

- [MDN - Secure Contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts)
- [Chrome 安全策略](https://sites.google.com/a/chromium.org/dev/Home/chromium-security/deprecating-powerful-features-on-insecure-origins)
- [Let's Encrypt 免费证书](https://letsencrypt.org/)