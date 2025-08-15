import Mock from 'mockjs';

// 健康检查接口
Mock.mock('/api/health', 'get', () => {
  return {
    success: true,
    data: {
      status: 'ok',
      timestamp: Date.now(),
      version: '1.0.0'
    },
    timestamp: Date.now()
  };
});

// 注意：根据API文档，只保留真实存在的接口
// 已移除的mock接口：/api/rank/global, /api/rank/weekly, /api/rank/personal, /api/rank/submit
// 这些接口在真实API文档中不存在，避免误导开发

export default Mock;