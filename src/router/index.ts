import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('../views/LayoutView.vue'),
      redirect: '/models',
      children: [
        {
          path: 'models',
          name: 'models',
          component: () => import('../views/ModelPlayground.vue'),
        },
        {
          path: 'apikeys',
          name: 'apikeys',
          component: () => import('../views/ApiKeysView.vue'),
        },
        {
          path: 'openclaw',
          name: 'openclaw',
          component: () => import('../views/OpenClawView.vue'),
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/models' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isLoggedIn) {
    return '/login'
  }
  if (to.path === '/login' && auth.isLoggedIn) {
    return '/models'
  }
})

export default router
