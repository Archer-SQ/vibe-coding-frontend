import { useState, useRef, useCallback } from 'react'

/**
 * 子弹接口
 */
export interface Bullet {
  id: number
  x: number // 百分比位置
  y: number // 百分比位置
  speed: number // 移动速度
}

/**
 * 敌机接口
 */
export interface Enemy {
  id: number
  x: number
  y: number
  speed: number
  type: 'normal' | 'boss'
  imageType?: 1 | 2 // 图片类型，1或2对应不同的敌机图片
  scale: number // 敌机大小倍数（1-3倍）
  health: number // 敌机生命值（需要多少发子弹击败）
  maxHealth: number // 最大生命值（用于显示血条）
}

/**
 * 碰撞检测结果
 */
interface CollisionResult {
  hitEnemies: Enemy[] // 被击败的敌机
  damagedEnemies: Enemy[] // 受伤但未被击败的敌机
  remainingBullets: Bullet[]
  remainingEnemies: Enemy[]
}

/**
 * 子弹系统Hook返回值
 */
interface UseBulletSystemReturn {
  bullets: Bullet[]
  createBullet: (x: number, y: number) => void
  clearBullets: () => void
  updateBullets: (enemies: Enemy[]) => CollisionResult
}

/**
 * 子弹系统Hook
 * 管理子弹的创建、移动、碰撞检测等逻辑
 */
export const useBulletSystem = (): UseBulletSystemReturn => {
  // 子弹状态
  const [bullets, setBullets] = useState<Bullet[]>([])
  
  // 子弹ID计数器
  const bulletIdRef = useRef(0)
  
  // 子弹配置
  const BULLET_SPEED = 2 // 子弹移动速度（百分比/帧）
  const COLLISION_THRESHOLD = 5 // 碰撞检测阈值（百分比）

  /**
   * 创建子弹
   */
  const createBullet = useCallback((x: number, y: number): void => {
    const newBullet: Bullet = {
      id: bulletIdRef.current++,
      x,
      y,
      speed: BULLET_SPEED
    }
    
    setBullets(prevBullets => [...prevBullets, newBullet])
  }, [])

  /**
   * 清空所有子弹
   */
  const clearBullets = useCallback((): void => {
    setBullets([])
  }, [])

  /**
   * 检测碰撞
   */
  const checkCollision = useCallback((bullet: Bullet, enemy: Enemy): boolean => {
    const distance = Math.sqrt(
      Math.pow(bullet.x - enemy.x, 2) + Math.pow(bullet.y - enemy.y, 2)
    )
    return distance < COLLISION_THRESHOLD
  }, [])

  /**
   * 更新子弹位置并处理碰撞
   */
  const updateBullets = useCallback((enemies: Enemy[]): CollisionResult => {
    const hitEnemies: Enemy[] = [] // 被击败的敌机
    const damagedEnemies: Enemy[] = [] // 受伤但未被击败的敌机
    const remainingBullets: Bullet[] = []
    const remainingEnemies = [...enemies]

    // 更新子弹位置
    const updatedBullets = bullets.map(bullet => ({
      ...bullet,
      y: bullet.y - bullet.speed
    }))

    // 过滤掉超出屏幕的子弹并检测碰撞
    for (const bullet of updatedBullets) {
      // 检查是否超出屏幕
      if (bullet.y < 0) {
        continue // 子弹超出屏幕，不保留
      }

      // 检查与敌机的碰撞
      let bulletHit = false
      for (let i = 0; i < remainingEnemies.length; i++) {
        const enemy = remainingEnemies[i]
        if (checkCollision(bullet, enemy)) {
          // 发生碰撞，敌机受到伤害
          const damagedEnemy = {
            ...enemy,
            health: enemy.health - 1 // 减少1点生命值
          }
          
          if (damagedEnemy.health <= 0) {
            // 敌机被击败
            hitEnemies.push(damagedEnemy)
            remainingEnemies.splice(i, 1) // 从剩余敌机中移除
          } else {
            // 敌机受伤但未被击败
            damagedEnemies.push(damagedEnemy)
            remainingEnemies[i] = damagedEnemy // 更新敌机状态
          }
          
          bulletHit = true
          break
        }
      }

      // 如果子弹没有击中任何敌机，保留子弹
      if (!bulletHit) {
        remainingBullets.push(bullet)
      }
    }

    // 更新子弹状态
    setBullets(remainingBullets)

    return {
      hitEnemies,
      damagedEnemies,
      remainingBullets,
      remainingEnemies
    }
  }, [bullets, checkCollision])

  return {
    bullets,
    createBullet,
    clearBullets,
    updateBullets
  }
}