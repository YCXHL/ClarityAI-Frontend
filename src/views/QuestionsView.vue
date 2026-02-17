<template>
  <div class="questions">
    <div class="header">
      <h2>需求澄清问答</h2>
      <p>请回答以下问题以帮助我们更好地理解您的需求</p>
    </div>
    
    <el-card class="questions-container" v-loading="loading">
      <div v-for="(question, index) in questions" :key="question.id" class="question-item">
        <h4>{{ index + 1 }}. {{ question.text }}</h4>
        
        <!-- 选择题 -->
        <el-radio-group 
          v-if="question.type === 'choice'" 
          v-model="answers[question.id]"
          class="question-options"
        >
          <el-radio 
            v-for="option in question.options" 
            :key="option" 
            :label="option"
          >
            {{ option }}
          </el-radio>
        </el-radio-group>
        
        <!-- 填空题 -->
        <el-input
          v-else-if="question.type === 'fill_blank'"
          v-model="answers[question.id]"
          placeholder="请输入答案..."
          class="question-input"
        />
        
        <!-- 叙述题 -->
        <el-input
          v-else-if="question.type === 'narrative'"
          v-model="answers[question.id]"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 6 }"
          placeholder="请详细描述..."
          class="question-textarea"
        />
        
        <!-- 默认文本框 -->
        <el-input
          v-else
          v-model="answers[question.id]"
          placeholder="请输入答案..."
          class="question-input"
        />
      </div>
      
      <div class="actions">
        <el-button 
          @click="submitAnswers" 
          type="primary" 
          size="large"
          :loading="submitting"
          :disabled="!hasAnsweredAllRequired || loading"
        >
          提交答案
        </el-button>
        <el-button 
          @click="showFeedbackDialog = true"
          size="large"
          :disabled="submitting || loading"
        >
          我想补充一些信息
        </el-button>
      </div>
    </el-card>
    
    <!-- 补充信息对话框 -->
    <el-dialog 
      v-model="showFeedbackDialog" 
      title="补充信息" 
      width="600px"
      :loading="feedbackSubmitting"
      @close="feedbackText = ''"
    >
      <el-input
        v-model="feedbackText"
        type="textarea"
        :autosize="{ minRows: 4, maxRows: 8 }"
        placeholder="请补充您的额外要求或修改意见..."
        maxlength="1000"
        show-word-limit
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showFeedbackDialog = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="submitFeedback"
            :loading="feedbackSubmitting"
          >
            确认提交
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { apiService } from '@/utils/api'

const route = useRoute()
const router = useRouter()
const sessionId = route.params.sessionId

const questions = ref([])
const answers = ref({})
const loading = ref(true)
const submitting = ref(false)
const showFeedbackDialog = ref(false)
const feedbackText = ref('')
const feedbackSubmitting = ref(false)

onMounted(() => {
  document.title = '需求澄清问答 - ClarityAI'
  
  // 解析 URL 中的后端地址参数
  const urlParams = new URLSearchParams(window.location.search)
  const encodedApiUrl = urlParams.get('api')
  if (encodedApiUrl) {
    try {
      const apiUrl = decodeURIComponent(atob(encodedApiUrl))
      localStorage.setItem('clarityai_api_url', apiUrl)
      ElMessage.success('已自动配置后端服务器地址')
      // 清除 URL 中的参数
      window.history.replaceState({}, '', window.location.pathname + window.location.hash)
    } catch (error) {
      console.error('Error parsing API URL:', error)
    }
  }
})

// 计算是否已回答所有必填问题
const hasAnsweredAllRequired = computed(() => {
  return questions.value.length > 0 && questions.value.every(q => {
    const answer = answers.value[q.id]
    return answer !== undefined && answer !== null && answer.toString().trim() !== ''
  })
})

onMounted(async () => {
  try {
    // 从后端获取问题
    console.log('Session ID:', sessionId)
    
    const response = await apiService.getSessionData(sessionId)
    questions.value = response.data.questions || []
    
    // 初始化答案对象
    questions.value.forEach(q => {
      answers.value[q.id] = ''
    })
  } catch (error) {
    console.error('Error loading questions:', error)
    ElMessage.error('加载问题失败')
  } finally {
    loading.value = false
  }
})

const submitAnswers = async () => {
  submitting.value = true
  
  try {
    // 准备答案数据 - 按照问题顺序排列
    const answerList = questions.value.map(q => ({
      answer: answers.value[q.id] || ''
    }))
    
    // 提交答案
    const response = await apiService.submitAnswers(sessionId, answerList)
    const newSessionId = response.data.session_id
    
    // 跳转到结果页面
    router.push({ name: 'Results', params: { sessionId: newSessionId } })
  } catch (error) {
    console.error('Error submitting answers:', error)
    ElMessage.error('提交答案失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

const submitFeedback = async () => {
  if (!feedbackText.value.trim()) {
    ElMessage.warning('请输入您的补充信息')
    return
  }
  
  feedbackSubmitting.value = true
  
  try {
    // 提交反馈
    const response = await apiService.continueWithFeedback(sessionId, feedbackText.value)
    const newSessionId = response.data.session_id
    questions.value = response.data.questions
    
    // 清空之前答案
    answers.value = {}
    
    // 初始化新问题的答案
    questions.value.forEach(q => {
      answers.value[q.id] = ''
    })
    
    // 关闭对话框
    showFeedbackDialog.value = false
    feedbackText.value = ''
    
    ElMessage.success('已收到您的补充信息，正在生成新问题...')
  } catch (error) {
    console.error('Error submitting feedback:', error)
    ElMessage.error('提交补充信息失败，请稍后重试')
  } finally {
    feedbackSubmitting.value = false
  }
}
</script>

<style scoped>
.questions {
  max-width: 800px;
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

.questions-container {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.question-item {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.question-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.question-item h4 {
  margin-bottom: 15px;
  color: #34495e;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.question-input,
.question-textarea {
  max-width: 600px;
}

.actions {
  margin-top: 30px;
  display: flex;
  gap: 15px;
  justify-content: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>