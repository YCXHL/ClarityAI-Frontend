import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/questions/:sessionId',
      name: 'Questions',
      component: () => import('../views/QuestionsView.vue'),
      props: true
    },
    {
      path: '/results/:sessionId',
      name: 'Results',
      component: () => import('../views/ResultsView.vue'),
      props: true
    },
    {
      path: '/overview/:sessionId',
      name: 'Overview',
      component: () => import('../views/OverviewView.vue'),
      props: true
    }
  ],
})

export default router
