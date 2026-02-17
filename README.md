# ClarityAI Web

AI 驱动的需求对齐工具 - 前端界面

## 📖 项目简介

ClarityAI 是一个智能需求对齐工具的前端界面，通过美观直观的交互设计，帮助用户轻松完成需求澄清过程。采用 Vue 3 + Element Plus 构建，支持响应式布局和流畅的动画效果。

## ✨ 核心功能

- 🏠 **首页**：简洁的想法输入界面，功能介绍卡片展示
- 💬 **智能问答**：多种题型支持（选择题、填空题、叙述题）
- 📊 **报告查看**：Markdown 渲染的需求分析报告
- 📄 **文档导出**：一键下载完整报告或最终报告（Markdown 格式）
- 📋 **项目总览**：时间线展示完整的需求对齐过程
- 🔗 **项目分享**：生成带后端配置的分享链接
- ⚙️ **灵活配置**：支持切换官方/自定义服务器地址
- 📱 **响应式设计**：适配各种屏幕尺寸
- 🎨 **精美动效**：流畅的按钮和卡片交互动画

## 🛠️ 技术栈

- **框架**：Vue 3.5.27
- **构建工具**：Vite 7.3.1
- **UI 组件库**：Element Plus 2.7.7
- **状态管理**：Pinia 3.0.4
- **路由**：Vue Router 5.0.1
- **HTTP 客户端**：Axios 1.7.2
- **Markdown 渲染**：Markdown-it

## 📦 安装步骤

### 1. 克隆项目

```bash
git clone https://github.com/YCXHL/ClarityAI-Frontend.git
cd ClarityAI-Frontend
```

### 2. 安装依赖

```bash
npm i
```

### 3. 配置环境变量（可选）

创建 `.env.development` 文件：

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173` 查看应用。

### 5. 构建生产版本

```bash
npm run build
```

构建产物将在 `dist/` 目录中生成。

### 6. 预览生产构建

```bash
npm run preview
```

## 🎨 页面结构

### 1. 首页 (`/`)
- 项目 Logo 和导航栏
- 想法输入区域
- 核心功能介绍卡片
- 页脚链接

### 2. 问题回答页 (`/questions/:sessionId`)
- 问题列表展示
- 多种题型交互
- 补充信息反馈
- 提交答案

### 3. 结果页 (`/results/:sessionId`)
- Markdown 渲染的报告
- 下载完整报告/最终报告
- 分享项目
- 查看项目总览
- 继续细化需求

### 4. 项目总览页 (`/overview/:sessionId`)
- 项目基本信息
- 原始想法展示
- 时间线形式的需求对齐过程
- 可折叠的问答和报告
- 下载完整对齐过程

## 📁 项目结构

```
ClarityAI-web/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/
│   │   ├── global.css           # 全局样式
│   │   └── button-animations.css # 按钮动效
│   ├── components/              # 可复用组件
│   ├── router/
│   │   └── index.js             # 路由配置
│   ├── stores/                  # Pinia 状态管理
│   ├── utils/
│   │   └── api.js               # API 服务
│   ├── views/
│   │   ├── HomeView.vue         # 首页
│   │   ├── QuestionsView.vue    # 问题回答页
│   │   ├── ResultsView.vue      # 结果页
│   │   └── OverviewView.vue     # 项目总览页
│   ├── App.vue                  # 根组件
│   └── main.js                  # 入口文件
├── .env.development             # 开发环境变量
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## ⚙️ 配置说明

### 后端服务器配置

在设置页面可以配置后端服务器地址：

1. **官方服务器**：`http://localhost:5000/api`
2. **自定义服务器**：输入任意后端地址

配置会保存在浏览器 `localStorage` 中，下次访问自动生效。

### 分享链接格式

分享链接包含编码后的后端地址：
```
http://your-domain/overview/{sessionId}?api={encodedApiUrl}
```

打开链接时会自动配置后端服务器地址。

## 🎨 样式定制

### 全局样式

编辑 `src/assets/global.css` 修改全局样式变量。

### 按钮动效

编辑 `src/assets/button-animations.css` 修改按钮和交互动效。

### 主题色

在 `global.css` 中修改 CSS 变量：

```css
:root {
  --primary-color: #409eff;
  --success-color: #67c23a;
  --warning-color: #e6a23c;
  --danger-color: #f56c6c;
}
```

## 🔌 API 集成

前端通过 Axios 与后端通信，所有 API 调用封装在 `src/utils/api.js` 中：

```javascript
// 生成问题
apiService.generateQuestions(idea)

// 获取会话数据
apiService.getSessionData(sessionId)

// 提交答案
apiService.submitAnswers(sessionId, answers)

// 继续细化需求
apiService.continueWithFeedback(sessionId, feedback)

// 下载完整报告
apiService.downloadFullReport(sessionId)
```

## 📱 响应式设计

应用适配各种屏幕尺寸：

- **桌面端**：> 1024px，完整布局
- **平板端**：768px - 1024px，优化布局
- **移动端**：< 768px，单列布局

## 🎯 功能亮点

### 1. 智能表单
- 实时字数统计
- 输入验证
- 自动保存草稿

### 2. 流畅动效
- 按钮涟漪效果
- 卡片悬停动画
- 页面过渡效果

### 3. 错误处理
- Token 限额提示
- 网络错误处理
- 友好的错误消息

### 4. 本地存储
- 项目历史记录
- 服务器配置
- 最后访问时间

## 🐛 常见问题

### 1. 无法连接到后端
检查设置中的服务器地址配置是否正确。

### 2. Markdown 渲染异常
确保报告内容是有效的 Markdown 格式。

### 3. 分享链接无法打开
检查 URL 中的 `api` 参数是否正确编码。

## 📝 开发脚本

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码格式化
npm run format
```

## 📄 开源协议： GPL v3

## 👨‍💻 作者
Royan([Royan·小站](https://www.ycxhl.top))