import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Game from '../../src/pages/Game'

// 简单的测试包装器
const SimpleWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )
}

describe('Game 组件简单渲染测试', () => {
  it('应该能够渲染Game组件', async () => {
    const { container } = render(
      <SimpleWrapper>
        <Game />
      </SimpleWrapper>
    )

    // 等待任何div元素出现，表明组件已渲染
    await waitFor(() => {
      const divs = container.querySelectorAll('div')
      expect(divs.length).toBeGreaterThan(0)
    }, { timeout: 10000 })

    console.log('Game组件渲染成功!')
    console.log('DOM元素数量:', container.querySelectorAll('div').length)
    
    // 打印所有文本内容
    const allText = container.textContent || ''
    console.log('所有文本内容:', allText)
    
    // 查找特定的按钮和文本
    const buttons = container.querySelectorAll('button')
    console.log('按钮数量:', buttons.length)
    buttons.forEach((btn, index) => {
      console.log(`按钮${index + 1}:`, btn.textContent)
    })
  })
})