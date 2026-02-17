import axios from 'axios'

// 从 localStorage 获取 API 地址
const getApiBaseUrl = () => {
  const savedUrl = localStorage.getItem('clarityai_api_url')
  return savedUrl || 'https://clarityapi.ycxhl.top/api'
}

// 创建 axios 实例
const createApiClient = () => {
  const client = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    }
  })
  
  // 添加响应拦截器
  client.interceptors.response.use(responseInterceptor, handleError)
  
  return client
}

// 动态获取 API 客户端
const getApiClient = () => createApiClient()

// 请求拦截器
const requestInterceptor = (config) => {
  return config
}

// 响应拦截器
const responseInterceptor = (response) => {
  return response
}

const handleError = (error) => {
  // 检查是否是 token 限额错误
  if (error.response?.status === 429) {
    const data = error.response.data
    if (data.error === 'token_limit_reached') {
      // 使用 ElMessageBox 显示带链接的提示
      import('element-plus').then(({ ElMessageBox }) => {
        ElMessageBox.confirm(
          '服务端已达单日 token 限额，请明日再试或切换/搭建个人服务端。\n\n提示：您可以查看历史记录和项目总览，这些功能不受影响。',
          '服务限额提示',
          {
            confirmButtonText: '查看 GitHub 仓库',
            cancelButtonText: '关闭',
            type: 'warning'
          }
        ).then(() => {
          // 点击确认按钮，打开 GitHub 仓库
          window.open('https://github.com', '_blank')
        })
      })
    }
  }
  return Promise.reject(error)
}

// API 服务方法
export const apiService = {
  // 健康检查
  healthCheck: () => {
    const client = getApiClient()
    return client.get('/health')
  },
  
  // 生成问题
  generateQuestions: (idea) => {
    const client = getApiClient()
    return client.post('/generate-questions', { idea })
  },
  
  // 获取会话数据（包括问题）
  getSessionData: (sessionId) => {
    const client = getApiClient()
    return client.get(`/session/${sessionId}`)
  },
  
  // 提交答案
  submitAnswers: (sessionId, answers) => {
    const client = getApiClient()
    return client.post('/submit-answers', { session_id: sessionId, answers })
  },
  
  // 生成 PDF
  generatePdf: (sessionId) => {
    const client = getApiClient()
    return client.post('/generate-pdf', { session_id: sessionId })
  },
  
  // 继续细化需求
  continueWithFeedback: (sessionId, feedback) => {
    const client = getApiClient()
    return client.post('/continue-with-feedback', { session_id: sessionId, feedback })
  },
  
  // 删除会话
  deleteSession: (sessionId) => {
    const client = getApiClient()
    return client.delete(`/session/${sessionId}`)
  }
}
