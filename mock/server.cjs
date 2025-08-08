const express = require('express');
const cors = require('cors');
const Mock = require('mockjs');

const app = express();
const PORT = 3002;

// 启用 CORS
app.use(cors({
  origin: [
    'http://localhost:3000', 'http://127.0.0.1:3000',
    'http://localhost:5173', 'http://127.0.0.1:5173', 
    'http://localhost:5174', 'http://127.0.0.1:5174'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// 全球榜
app.get('/api/rank/global', (req, res) => {
  console.log('🌍 Mock 全球榜请求');
  const data = Mock.mock({
    'list|10': [
      {
        'medal|1': ['🥇', '🥈', '🥉', undefined],
        'index|+1': 1,
        'name': '@cname',
        'score|10000-120000': 1,
        'info': '@date("yyyy-MM-dd")'
      }
    ]
  });
  
  res.json({
    code: 0,
    data,
    msg: 'success'
  });
});

// 本周榜
app.get('/api/rank/weekly', (req, res) => {
  console.log('📅 Mock 本周榜请求');
  const data = Mock.mock({
    'list|5': [
      {
        'medal|1': ['🥇', '🥈', '🥉', undefined],
        'index|+1': 1,
        'name': '@cname',
        'score|10000-80000': 1,
        'info': '@date("yyyy-MM-dd")'
      }
    ]
  });
  
  res.json({
    code: 0,
    data,
    msg: 'success'
  });
});

// 个人信息
app.get('/api/rank/personal', (req, res) => {
  console.log('👤 Mock 个人信息请求');
  const data = {
    info: {
      rank: Mock.Random.integer(1, 999),
      score: Mock.Random.integer(10000, 120000),
      createdAt: Mock.Random.date('yyyy-MM-dd')
    }
  };
  
  res.json({
    code: 0,
    data,
    msg: 'success'
  });
});

// 提交游戏成绩
app.post('/api/rank/submit', (req, res) => {
  console.log('🎯 Mock 提交游戏成绩请求', req.body);
  
  try {
    const gameResult = req.body;
    
    // 模拟成功提交，返回随机排名
    const rank = Mock.Random.integer(1, 100);
    
    res.json({
      code: 0,
      data: {
        success: true,
        rank
      },
      msg: '成绩提交成功'
    });
  } catch (error) {
    console.error('提交游戏成绩失败:', error);
    res.status(500).json({
      code: -1,
      data: { success: false },
      msg: '成绩提交失败'
    });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Mock 服务器错误:', err);
  res.status(500).json({
    code: -1,
    msg: '服务器内部错误',
    error: err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Mock 服务器启动成功！`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`🔗 API 接口:`);
  console.log(`   - GET  /api/rank/global   - 全球榜`);
  console.log(`   - GET  /api/rank/weekly   - 本周榜`);
  console.log(`   - GET  /api/rank/personal - 个人信息`);
  console.log(`   - POST /api/rank/submit   - 提交游戏成绩`);
});