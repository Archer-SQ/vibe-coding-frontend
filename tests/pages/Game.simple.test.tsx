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
  test('Game 组件基本渲染测试', async () => {
    const { container } = render(
      <BrowserRouter>
        <Game />
      </BrowserRouter>
    )

    // 等待组件渲染
    await waitFor(() => {
      expect(container.firstChild).toBeInTheDocument()
    })

    // 检查基本元素
    const allText = container.textContent || ''

    // 检查按钮
    const buttons = container.querySelectorAll('button')

    buttons.forEach((btn, index) => {
      expect(btn).toBeInTheDocument()
    })

    // 基本断言
    expect(container.firstChild).toBeInTheDocument()
    expect(buttons.length).toBeGreaterThan(0)
  })
})