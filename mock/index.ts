import Mock from 'mockjs';

// 类型定义
interface GameResult {
  score: number;
  level: number;
  duration: number;
  timestamp: number;
  playerName: string;
}

interface RankItem {
  medal?: string;
  index: number;
  name: string;
  info: string;
  score: number;
}

// 存储键名
const STORAGE_KEYS = {
  GAME_RESULTS: 'game_results',
  GLOBAL_RANK: 'global_rank',
  WEEKLY_RANK: 'weekly_rank',
  PERSONAL_INFO: 'personal_info'
};

// 工具函数：获取存储的游戏结果
const getStoredResults = (): GameResult[] => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEYS.GAME_RESULTS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('获取存储的游戏结果失败:', error);
    return [];
  }
};

// 工具函数：按玩家去重，只保留最高分
const getUniquePlayerResults = (results: GameResult[]): GameResult[] => {
  const playerBestScores = new Map<string, GameResult>();
  
  results.forEach(result => {
    const playerName = result.playerName || '玩家';
    const existing = playerBestScores.get(playerName);
    
    if (!existing || result.score > existing.score) {
      playerBestScores.set(playerName, result);
    }
  });
  
  return Array.from(playerBestScores.values()).sort((a, b) => b.score - a.score);
};

// 工具函数：更新排行榜
const updateRanks = (results: GameResult[]) => {
  const uniqueResults = getUniquePlayerResults(results);
  
  // 生成全球排行榜（取前10名）
  const globalRank: RankItem[] = uniqueResults.slice(0, 10).map((result, index) => ({
    medal: index < 3 ? ['🥇', '🥈', '🥉'][index] : undefined,
    index: index + 1,
    name: result.playerName || '玩家',
    info: new Date(result.timestamp).toLocaleDateString(),
    score: result.score
  }));

  // 生成本周排行榜（过滤本周数据，按玩家去重，取前10名）
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyResults = results.filter((r: GameResult) => r.timestamp > oneWeekAgo);
  const uniqueWeeklyResults = getUniquePlayerResults(weeklyResults);
  
  const weeklyRank: RankItem[] = uniqueWeeklyResults.slice(0, 10).map((result, index) => ({
    medal: index < 3 ? ['🥇', '🥈', '🥉'][index] : undefined,
    index: index + 1,
    name: result.playerName || '玩家',
    info: new Date(result.timestamp).toLocaleDateString(),
    score: result.score
  }));

  // 存储排行榜
  sessionStorage.setItem(STORAGE_KEYS.GLOBAL_RANK, JSON.stringify(globalRank));
  sessionStorage.setItem(STORAGE_KEYS.WEEKLY_RANK, JSON.stringify(weeklyRank));
  
  return { globalRank, weeklyRank };
};

// 工具函数：更新个人信息
const updatePersonalInfo = (playerName: string, allResults: GameResult[]) => {
  const uniqueResults = getUniquePlayerResults(allResults);
  const playerBest = uniqueResults.find(r => (r.playerName || '玩家') === playerName);
  
  if (playerBest) {
    const rank = uniqueResults.findIndex(r => 
      (r.playerName || '玩家') === playerName && r.score === playerBest.score
    ) + 1;
    
    const personalInfo = {
      rank,
      score: playerBest.score,
      createdAt: new Date(playerBest.timestamp).toLocaleDateString()
    };

    sessionStorage.setItem(STORAGE_KEYS.PERSONAL_INFO, JSON.stringify(personalInfo));
    return { rank, personalInfo };
  }
  
  return { rank: 0, personalInfo: { rank: 0, score: 0, createdAt: '-' } };
};

// 全球榜
Mock.mock('/api/rank/global', 'get', () => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEYS.GLOBAL_RANK);
    const list = stored ? JSON.parse(stored) : [];
    
    return {
      code: 0,
      data: { list },
      msg: 'success'
    };
  } catch (error) {
    console.error('获取全球排行榜失败:', error);
    return {
      code: 0,
      data: { list: [] },
      msg: 'success'
    };
  }
});

// 本周榜
Mock.mock('/api/rank/weekly', 'get', () => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEYS.WEEKLY_RANK);
    const list = stored ? JSON.parse(stored) : [];
    
    return {
      code: 0,
      data: { list },
      msg: 'success'
    };
  } catch (error) {
    console.error('获取本周排行榜失败:', error);
    return {
      code: 0,
      data: { list: [] },
      msg: 'success'
    };
  }
});

// 个人信息
Mock.mock('/api/rank/personal', 'get', () => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEYS.PERSONAL_INFO);
    const info = stored ? JSON.parse(stored) : { rank: 0, score: 0, createdAt: '-' };
    
    return {
      code: 0,
      data: { info },
      msg: 'success'
    };
  } catch (error) {
    console.error('获取个人信息失败:', error);
    return {
      code: 0,
      data: { info: { rank: 0, score: 0, createdAt: '-' } },
      msg: 'success'
    };
  }
});

// 提交游戏成绩
Mock.mock('/api/rank/submit', 'post', (options) => {
  try {
    const gameResult = JSON.parse(options.body);
    console.log('提交游戏成绩:', gameResult);
    
    // 获取现有成绩记录
    const existingResults = getStoredResults();
    
    // 添加新成绩
    const newResult = {
      ...gameResult,
      playerName: gameResult.playerName || '玩家',
      timestamp: Date.now()
    };
    existingResults.push(newResult);
    
    // 按分数排序并存储
    existingResults.sort((a, b) => b.score - a.score);
    sessionStorage.setItem(STORAGE_KEYS.GAME_RESULTS, JSON.stringify(existingResults));
    
    // 更新排行榜
     updateRanks(existingResults);
    
    // 更新个人信息并获取排名
    const { rank } = updatePersonalInfo(newResult.playerName, existingResults);
    
    return {
      code: 0,
      data: {
        success: true,
        rank
      },
      msg: '成绩提交成功'
    };
  } catch (error) {
    console.error('提交游戏成绩失败:', error);
    return {
      code: -1,
      data: { success: false },
      msg: '成绩提交失败'
    };
  }
});

export default Mock;