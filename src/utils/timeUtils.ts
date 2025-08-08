/**
 * 格式化时间显示
 * @param milliseconds 毫秒数
 * @returns 格式化后的时间字符串 (HH:MM:SS.mmm)
 */
export const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  const ms = Math.floor((milliseconds % 1000) / 10) // 取两位毫秒
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}