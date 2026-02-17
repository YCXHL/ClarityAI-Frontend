<template>
  <div class="home">
    <div class="hero-section">
      <h1>ClarityAI - 懂你的项目需求</h1>
      <p>通过多轮交互式对话，帮助您从模糊的初步想法逐步明确为结构化项目需求</p>
      <p>将对齐后的需求报告发给AI，让AI更懂你的需求</p>
    </div>
    
    <div class="input-section">
      <el-card class="idea-input-card">
        <h3>请输入您的初步想法</h3>
        <el-form @submit.prevent="startProcess">
          <el-form-item>
            <el-input
              v-model="idea"
              :autosize="{ minRows: 4, maxRows: 8 }"
              type="textarea"
              placeholder="例如：我想开发一个在线学习平台，帮助学生更好地管理学习进度..."
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>
        </el-form>
        
        <!-- 开始按钮改为卡片形式 -->
        <div class="start-button-wrapper">
          <div 
            class="start-button-card" 
            :class="{ 'is-loading': loading, 'is-disabled': !idea.trim() }"
            @click="startProcess"
          >
            <span class="button-icon">🚀</span>
            <span class="button-text">{{ loading ? '处理中...' : '开始需求对齐' }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 功能介绍 -->
    <div class="features-section">
      <div class="features-grid">
        <el-card class="feature-card">
          <div class="feature-icon">💬</div>
          <h4>智能问答</h4>
          <p>AI 生成针对性问题，帮助您明确项目需求</p>
        </el-card>
        <el-card class="feature-card">
          <div class="feature-icon">📝</div>
          <h4>多轮对齐</h4>
          <p>支持多轮交互，持续细化需求直到满意</p>
        </el-card>
        <el-card class="feature-card">
          <div class="feature-icon">📊</div>
          <h4>报告生成</h4>
          <p>自动生成结构化需求分析报告</p>
        </el-card>
        <el-card class="feature-card">
          <div class="feature-icon">📄</div>
          <h4>文档导出</h4>
          <p>一键导出 Markdown 格式项目文档</p>
        </el-card>
        <el-card class="feature-card">
          <div class="feature-icon">🔗</div>
          <h4>项目总览</h4>
          <p>时间线展示完整的需求对齐过程</p>
        </el-card>
        <el-card class="feature-card">
          <div class="feature-icon">⚙️</div>
          <h4>灵活配置</h4>
          <p>支持自定义后端服务器地址</p>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { apiService } from '@/utils/api'

const router = useRouter()
const idea = ref('')
const loading = ref(false)

onMounted(() => {
  document.title = 'ClarityAI - 首页'
  
  // 解析 URL 中的后端地址参数
  const urlParams = new URLSearchParams(window.location.search)
  const encodedApiUrl = urlParams.get('api')
  if (encodedApiUrl) {
    try {
      const apiUrl = decodeURIComponent(atob(encodedApiUrl))
      localStorage.setItem('clarityai_api_url', apiUrl)
      ElMessage.success('已自动配置后端服务器地址')
      // 清除 URL 中的参数
      window.history.replaceState({}, '', window.location.pathname)
    } catch (error) {
      console.error('Error parsing API URL:', error)
    }
  }
})

const startProcess = async () => {
  if (!idea.value.trim()) {
    ElMessage.error('请输入您的初步想法')
    return
  }
  
  loading.value = true
  
  try {
    const response = await apiService.generateQuestions(idea.value)
    const sessionId = response.data.session_id
    
    // 保存项目到 localStorage
    const project = {
      id: sessionId,
      idea: idea.value,
      lastVisited: new Date().toISOString()
    }
    
    const savedProjects = localStorage.getItem('clarityai_projects')
    let projects = savedProjects ? JSON.parse(savedProjects) : []
    projects.push(project)
    localStorage.setItem('clarityai_projects', JSON.stringify(projects))
    
    // 跳转到问题页面
    router.push({ name: 'Questions', params: { sessionId } })
  } catch (error) {
    console.error('Error:', error)
    ElMessage.error('生成问题失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.home {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
}

.hero-section {
  text-align: center;
  margin-bottom: 40px;
}

.hero-section h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.hero-section p {
  font-size: 1.2rem;
  color: #7f8c8d;
}

.input-section {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.idea-input-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
}

.idea-input-card h3 {
  margin-bottom: 20px;
  color: #2c3e50;
  text-align: center;
}

.idea-input-card .el-form-item:last-child {
  text-align: center !important;
}

.idea-input-card .el-form-item:last-child .el-button {
  display: inline-block;
}

.start-button-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.start-button-card {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 30px;
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  user-select: none;
}

.start-button-card:hover:not(.is-disabled):not(.is-loading) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

.start-button-card:active:not(.is-disabled):not(.is-loading) {
  transform: translateY(0);
}

.start-button-card.is-disabled {
  background: #dcdfe6;
  cursor: not-allowed;
  box-shadow: none;
}

.start-button-card.is-loading {
  background: #909399;
  cursor: wait;
}

.button-icon {
  font-size: 1.5rem;
}

.button-text {
  font-size: 1rem;
  font-weight: 500;
}

.features-section {
  margin-top: 60px;
  text-align: center;
}

.features-section h3 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 30px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
  max-width: 900px;
  margin: 0 auto;
}

.feature-card {
  text-align: center;
  padding: 20px 15px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.feature-card h4 {
  font-size: 1rem;
  color: #2c3e50;
  margin-bottom: 8px;
}

.feature-card p {
  font-size: 0.8rem;
  color: #7f8c8d;
  line-height: 1.5;
  margin: 0;
}
</style>