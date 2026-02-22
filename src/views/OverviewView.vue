<template>
  <div class="overview">
    <div class="header">
      <h2>项目总览</h2>
      <p>查看项目需求对齐的完整过程</p>
    </div>

    <el-card class="overview-container" v-loading="loading">
      <!-- 项目基本信息 -->
      <div class="timeline-section">
        <div class="timeline-header">
          <span class="icon-text">📋</span>
          <h3>项目信息</h3>
        </div>
        <div class="project-info">
          <p><strong>项目 ID:</strong> {{ sessionId }}</p>
        </div>
      </div>

      <!-- 原始想法 -->
      <div class="timeline-section">
        <div class="timeline-header">
          <span class="icon-text">💡</span>
          <h3>原始想法</h3>
        </div>
        <div class="idea-content">
          {{ sessionData.idea }}
        </div>
      </div>

      <!-- 对齐过程时间线 -->
      <div class="timeline-section">
        <div class="timeline-header">
          <span class="icon-text">🔗</span>
          <h3>需求对齐过程</h3>
        </div>

        <div class="timeline">
          <!-- 第一轮问答 -->
          <div class="timeline-item" v-for="(round, index) in timelineData" :key="index">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="round-title">第 {{ index + 1 }} 轮对齐</div>
              
              <!-- 问答部分 -->
              <div class="qa-section">
                <div class="section-header" @click="toggleQa(index)">
                  <h4><span class="icon-text">💬</span> 问答内容</h4>
                  <el-icon class="toggle-icon" :class="{ expanded: expandedQa.includes(index) }">
                    <ArrowRight />
                  </el-icon>
                </div>
                <el-collapse-transition>
                  <div class="qa-list" v-show="expandedQa.includes(index)">
                    <div class="qa-item" v-for="(qa, qaIndex) in round.qas" :key="qaIndex">
                      <div class="question">
                        <span class="qa-label">Q{{ qaIndex + 1 }}:</span>
                        {{ qa.question }}
                      </div>
                      <div class="answer">
                        <span class="qa-label">A{{ qaIndex + 1 }}:</span>
                        {{ qa.answer }}
                      </div>
                    </div>
                  </div>
                </el-collapse-transition>
              </div>

              <!-- 报告部分 -->
              <div class="report-section" v-if="round.report">
                <div class="section-header" @click="toggleReport(index)">
                  <h4><span class="icon-text">📝</span> 阶段性报告</h4>
                  <el-icon class="toggle-icon" :class="{ expanded: expandedReport.includes(index) }">
                    <ArrowRight />
                  </el-icon>
                </div>
                <el-collapse-transition>
                  <div class="report-content markdown-body" v-show="expandedReport.includes(index)" v-html="renderMarkdown(round.report)"></div>
                </el-collapse-transition>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <el-button @click="downloadFullProcess" type="primary" size="large">
          下载完整对齐过程
        </el-button>
        <el-button @click="goBack" size="large">返回结果页</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { apiService } from '@/utils/api'
import { InfoFilled } from '@element-plus/icons-vue'
import { ArrowRight } from '@element-plus/icons-vue'
import MarkdownIt from 'markdown-it'

const route = useRoute()
const router = useRouter()
const sessionId = route.params.sessionId

const loading = ref(true)
const sessionData = ref({
  idea: '',
  created_at: '',
  updated_at: '',
  questions: [],
  answers: [],
  reports: []
})
const rounds = ref([]) // 存储轮次数据

// 折叠状态
const expandedQa = ref([]) // 默认全部折叠
const expandedReport = ref([]) // 默认全部折叠

// 切换问答折叠状态
const toggleQa = (index) => {
  const idx = expandedQa.value.indexOf(index)
  if (idx > -1) {
    expandedQa.value.splice(idx, 1)
  } else {
    expandedQa.value.push(index)
  }
}

// 切换报告折叠状态
const toggleReport = (index) => {
  const idx = expandedReport.value.indexOf(index)
  if (idx > -1) {
    expandedReport.value.splice(idx, 1)
  } else {
    expandedReport.value.push(index)
  }
}

// Markdown 渲染器
const md = new MarkdownIt()

const renderMarkdown = (text) => {
  return md.render(text)
}

// 计算时间线数据（使用轮次数据，保持问答对应关系）
const timelineData = computed(() => {
  if (rounds.value.length > 0) {
    // 使用轮次数据
    return rounds.value.map(round => ({
      qas: round.questions.map((q, index) => ({
        question: q?.text || '',
        answer: round.answers[index]?.answer || ''
      })),
      report: round.report,
      round_number: round.round_number,
      created_at: round.created_at
    }))
  }
  
  // 降级到旧逻辑（如果没有轮次数据）
  const data = []
  const reports = sessionData.value.reports || []
  const answers = sessionData.value.answers || []
  const questions = sessionData.value.questions || []

  for (let i = 0; i < reports.length; i++) {
    const roundData = {
      qas: [],
      report: reports[i]
    }
    
    const qaCount = Math.min(questions.length, answers.length)
    for (let j = 0; j < qaCount; j++) {
      roundData.qas.push({
        question: questions[j]?.text || '',
        answer: answers[j]?.answer || ''
      })
    }
    
    data.push(roundData)
  }

  if (reports.length === 0 && answers.length > 0) {
    const roundData = {
      qas: [],
      report: null
    }
    const qaCount = Math.min(questions.length, answers.length)
    for (let j = 0; j < qaCount; j++) {
      roundData.qas.push({
        question: questions[j]?.text || '',
        answer: answers[j]?.answer || ''
      })
    }
    data.push(roundData)
  }

  return data
})

onMounted(async () => {
  document.title = '项目总览 - ClarityAI'
  
  // 解析 URL 中的后端地址参数
  const urlParams = new URLSearchParams(window.location.search)
  const encodedApiUrl = urlParams.get('api')
  if (encodedApiUrl) {
    try {
      const apiUrl = decodeURIComponent(atob(encodedApiUrl))
      localStorage.setItem('clarityai_api_url', apiUrl)
      ElMessage.success('已自动配置后端服务器地址')
    } catch (error) {
      console.error('Error parsing API URL:', error)
    }
  }
  
  try {
    const response = await apiService.getSessionData(sessionId)
    sessionData.value = response.data
    
    // 加载轮次数据（保持问答对应关系）
    try {
      const roundsResponse = await apiService.getSessionRounds(sessionId)
      rounds.value = roundsResponse.data.rounds || []
    } catch (roundsError) {
      console.warn('Failed to load rounds data, using fallback:', roundsError)
      // 降级到旧逻辑
    }
    
    // 更新项目最后访问时间
    const savedProjects = localStorage.getItem('clarityai_projects')
    if (savedProjects) {
      let projects = JSON.parse(savedProjects)
      const projectIndex = projects.findIndex(p => p.id === sessionId)
      if (projectIndex > -1) {
        projects[projectIndex].lastVisited = new Date().toISOString()
        localStorage.setItem('clarityai_projects', JSON.stringify(projects))
      }
    }
  } catch (error) {
    console.error('Error loading session data:', error)
    ElMessage.error('加载项目数据失败')
  } finally {
    loading.value = false
  }
})

const formatDate = (dateString) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 下载完整对齐过程
const downloadFullProcess = () => {
  let markdownContent = '# 项目需求对齐完整过程\n\n'
  
  // 项目信息
  markdownContent += '## 项目信息\n\n'
  markdownContent += `- **项目 ID:** ${sessionId}\n`
  // 原始想法
  markdownContent += '## 原始想法\n\n'
  markdownContent += `${sessionData.value.idea}\n\n`
  
  // 对齐过程
  markdownContent += '## 需求对齐过程\n\n'
  
  // 优先使用轮次数据
  if (rounds.value.length > 0) {
    rounds.value.forEach((round, index) => {
      markdownContent += `### 第 ${round.round_number || (index + 1)} 轮对齐\n\n`
      markdownContent += `**时间:** ${formatDate(round.created_at)}\n\n`
      
      // 问答内容
      markdownContent += '#### 问答内容\n\n'
      round.questions.forEach((q, qIndex) => {
        const a = round.answers[qIndex]?.answer || ''
        markdownContent += `**Q${qIndex + 1}:** ${q.text || ''}\n\n`
        markdownContent += `**A${qIndex + 1}:** ${a}\n\n`
      })
      
      // 阶段性报告
      if (round.report) {
        markdownContent += '#### 阶段性报告\n\n'
        markdownContent += `${round.report}\n\n`
      }
      
      markdownContent += '---\n\n'
    })
  } else {
    // 降级到旧逻辑
    const reports = sessionData.value.reports || []
    const answers = sessionData.value.answers || []
    const questions = sessionData.value.questions || []
    
    for (let i = 0; i < reports.length; i++) {
      markdownContent += `### 第 ${i + 1} 轮对齐\n\n`
      
      // 问答内容
      markdownContent += '#### 问答内容\n\n'
      const qaCount = Math.min(questions.length, answers.length)
      for (let j = 0; j < qaCount; j++) {
        const q = questions[j]?.text || ''
        const a = answers[j]?.answer || ''
        markdownContent += `**Q${j + 1}:** ${q}\n\n`
        markdownContent += `**A${j + 1}:** ${a}\n\n`
      }
      
      // 阶段性报告
      markdownContent += '#### 阶段性报告\n\n'
      markdownContent += `${reports[i]}\n\n`
      
      markdownContent += '---\n\n'
    }
    
    // 如果没有报告但有问答
    if (reports.length === 0 && answers.length > 0) {
      markdownContent += '### 问答内容\n\n'
      const qaCount = Math.min(questions.length, answers.length)
      for (let j = 0; j < qaCount; j++) {
        const q = questions[j]?.text || ''
        const a = answers[j]?.answer || ''
        markdownContent += `**Q${j + 1}:** ${q}\n\n`
        markdownContent += `**A${j + 1}:** ${a}\n\n`
      }
    }
  }
  
  // 创建 Blob 对象并下载
  const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.style.display = 'none'
  a.href = url
  a.download = `project_overview_${sessionId.substring(0, 8)}.md`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
  
  ElMessage.success('完整对齐过程下载成功！')
}

const goBack = () => {
  router.push({ name: 'Results', params: { sessionId } })
}
</script>

<style scoped>
.overview {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  font-size: 1.8rem;
  color: #2c3e50;
  margin-bottom: 10px;
}

.header p {
  color: #7f8c8d;
}

.icon-text {
  font-size: 1.5rem;
  margin-right: 8px;
}

.overview-container {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.timeline-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.timeline-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.timeline-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.timeline-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background-color: #ecf5ff;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 0.9rem;
  color: #409eff;
}

.timeline-note .el-icon {
  font-size: 1.1rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
  margin-bottom: 10px;
}

.section-header:hover {
  background-color: #f0f0f0;
}

.section-header h4 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
}

.toggle-icon {
  transition: transform 0.3s;
  font-size: 1.2rem;
  color: #909399;
}

.toggle-icon.expanded {
  transform: rotate(90deg);
}

.project-info {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.project-info p {
  margin: 8px 0;
  color: #606266;
}

.idea-content {
  background-color: #ecf5ff;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
  line-height: 1.8;
  color: #303133;
}

.timeline {
  position: relative;
  padding-left: 30px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #e0e0e0;
}

.timeline-item {
  position: relative;
  margin-bottom: 40px;
}

.timeline-dot {
  position: absolute;
  left: -26px;
  top: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #409eff;
  border: 3px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.timeline-content {
  background-color: #fafafa;
  padding: 20px;
  border-radius: 8px;
}

.round-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e0e0e0;
}

.qa-section,
.report-section {
  margin-bottom: 20px;
}

.qa-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.qa-item {
  background-color: #fff;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.question,
.answer {
  margin: 8px 0;
  line-height: 1.6;
}

.question {
  color: #303133;
  font-weight: 500;
}

.answer {
  color: #67c23a;
  background-color: #f0f9ff;
  padding: 10px;
  border-radius: 4px;
}

.qa-label {
  font-weight: bold;
  margin-right: 8px;
}

.report-content {
  background-color: #fff;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  line-height: 1.8;
  color: #606266;
}

.markdown-body {
  white-space: normal;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
  color: #2c3e50;
}

.markdown-body h1 {
  font-size: 1.5rem;
}

.markdown-body h2 {
  font-size: 1.3rem;
}

.markdown-body h3 {
  font-size: 1.1rem;
}

.markdown-body p {
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body li {
  margin-top: 4px;
  margin-bottom: 4px;
}

.markdown-body code {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 0.9em;
  background-color: #f6f8fa;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.markdown-body pre {
  padding: 16px;
  overflow: auto;
  font-size: 0.9em;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 6px;
}

.markdown-body pre code {
  display: inline;
  padding: 0;
  margin: 0;
  overflow: visible;
  line-height: inherit;
  word-wrap: normal;
  background-color: transparent;
  border-radius: 0;
}

.markdown-body blockquote {
  padding: 0 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
  margin: 0 0 16px 0;
}

.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 16px;
}

.markdown-body table th,
.markdown-body table td {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
}

.markdown-body table th {
  background-color: #f6f8fa;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
}
</style>
