<script setup>
import { RouterView } from 'vue-router'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Setting, HomeFilled, CircleCheck, CircleClose, StarFilled } from '@element-plus/icons-vue'
import { apiService } from '@/utils/api'


const router = useRouter()
const showProjectList = ref(false)
const showSettings = ref(false)
const projects = ref([])
const apiBaseUrl = ref('https://clarityapi.ycxhl.top/api')
const serverType = ref('official') // 'official' 或 'custom'
const connectionStatus = ref('')
const testingConnection = ref(false)

onMounted(() => {
  // 加载项目列表
  const savedProjects = localStorage.getItem('clarityai_projects')
  if (savedProjects) {
    projects.value = JSON.parse(savedProjects)
  }
  
  // 加载 API 地址
  const savedApiUrl = localStorage.getItem('clarityai_api_url')
  if (savedApiUrl) {
    apiBaseUrl.value = savedApiUrl
    // 判断是官方还是自定义
    if (savedApiUrl !== 'https://clarityapi.ycxhl.top/api') {
      serverType.value = 'custom'
    }
  }
})

const goToHome = () => {
  router.push('/')
}

const openGithub = () => {
  window.open('https://github.com/YCXHL/ClarityAI-Frontend', '_blank')
}

const openBlog = () => {
  window.open('https://www.ycxhl.top', '_blank')
}

const viewProjects = () => {
  // 重新加载项目列表
  const savedProjects = localStorage.getItem('clarityai_projects')
  if (savedProjects) {
    projects.value = JSON.parse(savedProjects)
  } else {
    projects.value = []
  }
  showProjectList.value = true
}

const deleteProject = async (projectId, index) => {
  // 确认删除
  const confirmed = await ElMessageBox.confirm('确定要删除此项目吗？此操作将同时删除本地记录和服务端数据，无法撤销。', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  
  if (!confirmed) return
  
  try {
    // 先删除服务端数据
    await apiService.deleteSession(projectId)
    
    // 再删除本地数据
    projects.value.splice(index, 1)
    localStorage.setItem('clarityai_projects', JSON.stringify(projects.value))
    
    ElMessage.success('项目已删除')
  } catch (error) {
    console.error('Error deleting project:', error)
    ElMessage.error('删除失败：' + (error.response?.data?.error || error.message))
  }
}

const viewProject = (projectId) => {
  router.push({ name: 'Overview', params: { sessionId: projectId } })
  showProjectList.value = false
}

const openSettings = () => {
  showSettings.value = true
  connectionStatus.value = ''
}

const gotoGithub = () => {
  window.location.href = "https://github.com/YCXHL/ClarityAI-Frontend";
}

const saveSettings = () => {
  // 根据服务器类型设置地址
  const finalUrl = serverType.value === 'official' 
    ? 'https://clarityapi.ycxhl.top/api' 
    : apiBaseUrl.value
  
  localStorage.setItem('clarityai_api_url', finalUrl)
  ElMessage.success('设置已保存，请刷新页面生效')
  showSettings.value = false
}

const testConnection = async () => {
  testingConnection.value = true
  connectionStatus.value = ''
  
  try {
    const response = await fetch(`${apiBaseUrl.value.replace('/api', '')}/api/health`)
    if (response.ok) {
      connectionStatus.value = 'success'
      ElMessage.success('服务器连接成功！')
    } else {
      connectionStatus.value = 'error'
      ElMessage.error('服务器连接失败')
    }
  } catch (error) {
    connectionStatus.value = 'error'
    ElMessage.error('无法连接到服务器：' + error.message)
  } finally {
    testingConnection.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <h1 class="logo" @click="goToHome">ClarityAI</h1>
        <nav class="header-nav">
          <el-button @click="goToHome" text size="large">
            <el-icon><HomeFilled /></el-icon>
            主页
          </el-button>
          <el-button @click="viewProjects" text size="large">
            <el-icon><Document /></el-icon>
            项目列表
          </el-button>
          <el-button @click="openSettings" text size="large">
            <el-icon><Setting /></el-icon>
            设置
          </el-button>
          <el-button @click="gotoGithub" text size="large">
            <el-icon><StarFilled /></el-icon>
            在Github上Star
          </el-button>
        </nav>
      </div>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
    <footer class="app-footer">
      <p>
        <span>ClarityAI - 懂你的项目需求</span><br />
        <span class="footer-link" @click="openGithub">GitHub仓库</span>
        <span class="footer-link" @click="openBlog">Royan的小站</span>
      </p>
    </footer>

    <!-- 项目列表对话框 -->
    <el-dialog v-model="showProjectList" title="项目列表" width="600px">
      <div v-if="projects.length === 0" class="empty-projects">
        <el-empty description="暂无项目记录" />
      </div>
      <div v-else class="project-list">
        <div class="project-item" v-for="(project, index) in projects" :key="project.id">
          <div class="project-info" @click="viewProject(project.id)">
            <div class="project-name">{{ project.idea.substring(0, 50) }}{{ project.idea.length > 50 ? '...' : '' }}</div>
            <div class="project-date">{{ formatDate(project.lastVisited) }}</div>
          </div>
          <el-button @click="deleteProject(project.id, index)" type="danger" size="small">删除</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 设置对话框 -->
    <el-dialog v-model="showSettings" title="设置" width="500px">
      <el-form label-position="top">
        <el-form-item label="服务器类型">
          <el-radio-group v-model="serverType">
            <el-radio label="official">官方服务器</el-radio>
            <el-radio label="custom">自定义服务器</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="后端服务器地址" v-if="serverType === 'custom'">
          <el-input v-model="apiBaseUrl" placeholder="https://clarityapi.ycxhl.top/api" />
          <div class="form-tip">请输入完整的 API 地址，例如：https://clarityapi.ycxhl.top/api</div>
        </el-form-item>
        <el-form-item label="测试连接">
          <el-button @click="testConnection" :loading="testingConnection" type="primary">
            测试连接
          </el-button>
          <div v-if="connectionStatus === 'success'" class="connection-status success">
            <el-icon><CircleCheck /></el-icon> 连接成功
          </div>
          <div v-if="connectionStatus === 'error'" class="connection-status error">
            <el-icon><CircleClose /></el-icon> 连接失败
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSettings = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">保存设置</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background-color: #f5f7fa;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #7c6ee4, #5e50e4);
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: 600;
  cursor: pointer;
  margin: 0;
}

.header-nav {
  display: flex;
  gap: 10px;
}

.header-nav .el-button {
  color: white;
}

.header-nav .el-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.app-main {
  flex: 1;
  padding: 2rem 0;
  background-color: #f5f7fa;
}

.app-footer {
  text-align: center;
  padding: 1.5rem;
  color: #909399;
  background-color: white;
  border-top: 1px solid #ebeef5;
}

.app-footer p {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.footer-link {
  color: #409eff;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-link:hover {
  color: #66b1ff;
  text-decoration: underline;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.project-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: box-shadow 0.2s;
}

.project-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.project-info {
  flex: 1;
  cursor: pointer;
}

.project-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.project-date {
  font-size: 0.85rem;
  color: #909399;
}

.empty-projects {
  padding: 40px 0;
}

.form-tip {
  font-size: 0.85rem;
  color: #909399;
  margin-top: 5px;
}

.connection-status {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.connection-status.success {
  color: #67c23a;
}

.connection-status.error {
  color: #f56c6c;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
