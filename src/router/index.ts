import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { public: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { public: true },
    },
    {
      path: '/callback',
      name: 'callback',
      component: () => import('../views/CallbackView.vue'),
      meta: { public: true },
    },
    {
      path: '/app',
      component: () => import('../views/LayoutView.vue'),
      redirect: '/app/models',
      children: [
        {
          path: 'models',
          name: 'models',
          component: () => import('../views/ModelPlayground.vue'),
          meta: { public: true },
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
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isLoggedIn) return '/login'
  if ((to.path === '/login' || to.path === '/register') && auth.isLoggedIn) return '/app/models'
})

export default router
