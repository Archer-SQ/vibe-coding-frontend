import axios from 'axios'
import type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { message } from 'antd'

interface ErrorResponse {
  msg?: string
  message?: string
}

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002',
  timeout: 10000,
  withCredentials: true,
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 可在此处添加 token 等通用逻辑
    return config
  },
  error => {
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 统一处理业务错误码
    const { code, msg } = response.data || {}
    if (typeof code !== 'undefined' && code !== 0) {
      message.error(msg || '请求失败')
      return Promise.reject(response.data)
    }
    return response.data
  },
  (error: AxiosError<ErrorResponse>) => {
    // 统一处理 HTTP 错误
    let errorMessage = '网络异常'
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = '服务器连接失败，请检查服务是否启动'
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage = '网络连接错误'
    } else if (error.code === 'TIMEOUT') {
      errorMessage = '请求超时'
    } else if (error.response) {
      // 服务器响应了错误状态码
      const status = error.response.status
      switch (status) {
        case 400:
          errorMessage = '请求参数错误'
          break
        case 401:
          errorMessage = '未授权，请重新登录'
          break
        case 403:
          errorMessage = '拒绝访问'
          break
        case 404:
          errorMessage = '请求的资源不存在'
          break
        case 429:
          errorMessage = '请求过于频繁，请稍后再试'
          break
        case 500:
          errorMessage = '服务器内部错误'
          break
        default:
          errorMessage = error.response.data?.msg || error.response.data?.message || `请求失败 (${status})`
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      errorMessage = '服务器无响应，请检查网络连接'
    } else {
      // 其他错误
      errorMessage = error.message || '未知错误'
    }
    
    message.error(errorMessage)
    return Promise.reject(error)
  },
)

export default function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  return service(config) as Promise<T>
}
