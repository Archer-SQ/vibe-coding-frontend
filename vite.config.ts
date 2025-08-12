import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // 路径别名
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  
  // 构建优化
  build: {
    // 代码分割
    rollupOptions: {
      output: {
        // 手动分包
        manualChunks: {
          // React 相关
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI 组件库
          'ui-vendor': ['antd', '@ant-design/icons'],
          // 手势识别相关
          'gesture-vendor': ['@mediapipe/hands', '@tensorflow/tfjs', '@tensorflow/tfjs-backend-webgl'],
          // 工具库
          'utils-vendor': ['axios', 'zustand'],
        },
        // 文件命名
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || []
          const extType = info[info.length - 1]
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name || '')) {
            return `media/[name]-[hash].${extType}`
          }
          if (/\.(png|jpe?g|gif|svg)(\?.*)?$/i.test(assetInfo.name || '')) {
            return `images/[name]-[hash].${extType}`
          }
          if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name || '')) {
            return `fonts/[name]-[hash].${extType}`
          }
          return `assets/[name]-[hash].${extType}`
        },
      },
    },
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除console
        drop_debugger: true, // 移除debugger
      },
    },
    // 启用 gzip 压缩大小报告
    reportCompressedSize: true,
    // 设置 chunk 大小警告限制
    chunkSizeWarningLimit: 1000,
  },
  
  // 开发服务器优化
  server: {
    host: true,
    port: 5174,
    // 可选：启用HTTPS（用于测试其他设备访问）
    // https: true, // 启用自签名证书
    // 或者使用自定义证书
    // https: {
    //   key: fs.readFileSync('path/to/key.pem'),
    //   cert: fs.readFileSync('path/to/cert.pem'),
    // },
  },
  
  // 依赖预构建优化
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'antd',
      '@ant-design/icons',
      'axios',
      'zustand',
      '@mediapipe/hands', // 包含MediaPipe以确保正确加载
    ],
    // 强制预构建某些依赖
    force: true,
  },
})
