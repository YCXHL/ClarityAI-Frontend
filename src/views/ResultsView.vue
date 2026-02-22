<template>
  <div class="results">
    <div class="header">
      <h2>需求分析报告</h2>
      <p>以下是根据您的回答生成的需求分析报告</p>
    </div>
    
    <el-card class="report-container" v-loading="loading">
      <div class="report-content markdown-body" v-html="renderMarkdown(reportContent)"></div>
    </el-card>
    
    <div class="actions">
      <el-button
        @click="generatePdf"
        type="success"
        size="large"
        :loading="pdfGenerating"
        :disabled="loading"
      >
        生成报告文档
      </el-button>
      <el-button
        @click="continueRefinement"
        size="large"
        :disabled="loading"
      >
        继续细化需求
      </el-button>
      <el-button
        @click="shareProject"
        type="info"
        size="large"
        :disabled="loading"
      >
        分享项目
      </el-button>
      <el-button
        @click="viewOverview"
        type="warning"
        size="large"
        :disabled="loading"
      >
        查看项目总览
      </el-button>
    </div>
    
    <!-- 下载链接 -->
    <div v-if="pdfUrl" class="pdf-download">
      <p>报告已生成：</p>
      <div class="download-options">
        <el-button @click="downloadFullReport" type="primary" size="large">下载完整报告</el-button>
        <el-button @click="downloadFinalReport" type="success" size="large">下载最终报告</el-button>
      </div>
    </div>
    
    <!-- 继续细化需求对话框 -->
    <el-dialog 
      v-model="showRefinementDialog" 
      title="继续细化需求" 
      width="600px"
    >
      <p>请告诉我您想要进一步细化或修改的方面：</p>
      <el-input
        v-model="refinementFeedback"
        type="textarea"
        :autosize="{ minRows: 4, maxRows: 8 }"
        placeholder="例如：我对之前的某个需求有新的想法..."
        maxlength="1000"
        show-word-limit
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showRefinementDialog = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="submitRefinement"
            :loading="refinementSubmitting"
          >
            确认提交
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { apiService } from '@/utils/api'
import MarkdownIt from 'markdown-it'

const route = useRoute()
const router = useRouter()
const sessionId = route.params.sessionId

const reportContent = ref('')
const loading = ref(true)
const pdfGenerating = ref(false)
const pdfUrl = ref(null)

// 继续细化需求相关
const showRefinementDialog = ref(false)
const refinementFeedback = ref('')
const refinementSubmitting = ref(false)

// Markdown 渲染器
const md = new MarkdownIt()

const renderMarkdown = (text) => {
  return md.render(text)
}

onMounted(async () => {
  document.title = '需求分析报告 - ClarityAI'
  try {
    // 从后端获取报告内容
    const response = await apiService.getSessionData(sessionId)
    // 从报告数组中获取最新的报告
    const reports = response.data.reports
    if (reports && reports.length > 0) {
      reportContent.value = reports[reports.length - 1] // 获取最新报告
    } else {
      reportContent.value = '暂无分析报告，请先完成问题回答。'
    }
  } catch (error) {
    console.error('Error loading report:', error)
    ElMessage.error('加载报告失败')
    reportContent.value = '加载报告时出现错误，请稍后重试。'
  } finally {
    loading.value = false
  }
})

const generatePdf = async () => {
  pdfGenerating.value = true

  try {
    const response = await apiService.generatePdf(sessionId)
    pdfUrl.value = response.data.pdf_url

    ElMessage.success('PDF文档生成成功！')
  } catch (error) {
    console.error('Error generating PDF:', error)
    ElMessage.error('生成PDF文档失败，请稍后重试')
  } finally {
    pdfGenerating.value = false
  }
}

// 生成完整报告的Markdown内容
const generateFullReport = (sessionData) => {
  let markdownContent = '# 项目需求说明书\n\n';
  
  // 添加原始想法
  markdownContent += '## 1. 项目原始想法\n\n';
  markdownContent += `${sessionData.idea}\n\n`;
  
  // 添加问答内容
  if (sessionData.questions && sessionData.answers) {
    markdownContent += '## 2. 需求澄清问答\n\n';
    
    const minLen = Math.min(sessionData.questions.length, sessionData.answers.length);
    for (let i = 0; i < minLen; i++) {
      const q = sessionData.questions[i];
      const a = sessionData.answers[i];
      
      const questionText = typeof q === 'object' ? q.text : q;
      const answerText = typeof a === 'object' ? a.answer : a;
      
      markdownContent += `**Q${i+1}: ${questionText}**\n`;
      markdownContent += `A${i+1}: ${answerText}\n\n`;
    }
  }
  
  // 添加分析报告
  if (sessionData.reports && sessionData.reports.length > 0) {
    markdownContent += '## 3. 阶段性分析报告\n\n';
    
    for (let i = 0; i < sessionData.reports.length; i++) {
      markdownContent += `### 第${i+1}次分析:\n`;
      markdownContent += `${sessionData.reports[i]}\n\n`;
    }
  }
  
  return markdownContent;
};

// 生成最终报告的Markdown内容（仅包含最终总结）
const generateFinalReport = (sessionData) => {
  let markdownContent = '# 项目需求说明书（最终版）\n\n';
  
  // 添加原始想法
  markdownContent += '## 项目概述\n\n';
  markdownContent += `${sessionData.idea}\n\n`;
  
  // 添加最终分析报告
  if (sessionData.reports && sessionData.reports.length > 0) {
    markdownContent += '## 需求分析总结\n\n';
    
    // 使用最新的报告作为最终总结
    const latestReport = sessionData.reports[sessionData.reports.length - 1];
    markdownContent += `${latestReport}\n\n`;
  } else {
    markdownContent += '暂无分析报告。\n\n';
  }
  
  return markdownContent;
};

// 下载完整报告
const downloadFullReport = async () => {
  try {
    const response = await apiService.getSessionData(sessionId);
    const sessionData = response.data;
    
    const markdownContent = generateFullReport(sessionData);
    
    // 创建Blob对象并下载
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `requirement_document_full_${sessionId.substring(0, 8)}.md`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    ElMessage.success('完整报告下载成功！');
  } catch (error) {
    console.error('Error generating full report:', error);
    ElMessage.error('生成完整报告失败，请稍后重试');
  }
};

// 下载最终报告
const downloadFinalReport = async () => {
  try {
    const response = await apiService.getSessionData(sessionId);
    const sessionData = response.data;
    
    const markdownContent = generateFinalReport(sessionData);
    
    // 创建Blob对象并下载
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `requirement_document_final_${sessionId.substring(0, 8)}.md`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    ElMessage.success('最终报告下载成功！');
  } catch (error) {
    console.error('Error generating final report:', error);
    ElMessage.error('生成最终报告失败，请稍后重试');
  }
};

const continueRefinement = () => {
  // 打开对话框让用户输入反馈
  showRefinementDialog.value = true
  refinementFeedback.value = ''
}

// 分享项目
const shareProject = async () => {
  const currentApiUrl = localStorage.getItem('clarityai_api_url') || 'http://localhost:5000/api'
  
  // 将后端地址编码后添加到链接中
  const encodedApiUrl = btoa(encodeURIComponent(currentApiUrl))
  const shareUrl = `${window.location.origin}/overview/${sessionId}?api=${encodedApiUrl}`
  
  try {
    await navigator.clipboard.writeText(shareUrl)
    ElMessage.success('链接已复制到剪贴板，可以分享给他人了！')
  } catch (error) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = shareUrl
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('链接已复制到剪贴板，可以分享给他人了！')
  }
}

// 查看项目总览
const viewOverview = () => {
  router.push({ name: 'Overview', params: { sessionId } })
}

const submitRefinement = async () => {
  if (!refinementFeedback.value.trim()) {
    ElMessage.warning('请输入您的细化需求')
    return
  }
  
  refinementSubmitting.value = true
  
  try {
    // 提交反馈
    const response = await apiService.continueWithFeedback(sessionId, refinementFeedback.value)
    
    // 关闭对话框
    showRefinementDialog.value = false
    refinementFeedback.value = ''
    
    ElMessage.success('已收到您的细化需求，正在生成新问题...')
    
    // 跳转到问题页面
    router.push({ name: 'Questions', params: { sessionId } })
  } catch (error) {
    console.error('Error submitting refinement:', error)
    ElMessage.error('提交细化需求失败，请稍后重试')
  } finally {
    refinementSubmitting.value = false
  }
}
</script>

<style scoped>
.results {
  max-width: 900px;
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

.report-container {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.report-content {
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
  margin-bottom: 20px;
}

.pdf-download {
  text-align: center;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.pdf-download a {
  color: #409eff;
  text-decoration: none;
  font-weight: bold;
  font-size: 1.1rem;
}

.pdf-download a:hover {
  text-decoration: underline;
}

.download-options {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}
</style>