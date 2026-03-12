import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ── Public ──────────────────────────────────────────────────────
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { public: true },
    },
    {
      path: '/models',
      name: 'modelHub',
      component: () => import('../views/ModelHubView.vue'),
      meta: { public: true },
    },
    {
      path: '/datasets',
      name: 'datasetHub',
      component: () => import('../views/DatasetHubView.vue'),
      meta: { public: true },
    },
    {
      path: '/spaces',
      name: 'spaceHub',
      component: () => import('../views/SpaceHubView.vue'),
      meta: { public: true },
    },
    {
      path: '/spaces/:namespace/:name',
      name: 'spaceDetail',
      component: () => import('../views/SpaceDetailView.vue'),
      meta: { public: true },
    },
    {
      path: '/datasets/:namespace/:name',
      name: 'datasetDetail',
      component: () => import('../views/DatasetDetailView.vue'),
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

    // ── Profile ─────────────────────────────────────────────────────
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
    },

    // ── App (authenticated) ─────────────────────────────────────────
    {
      path: '/app',
      component: () => import('../views/LayoutView.vue'),
      redirect: '/app/playground',
      children: [
        {
          path: 'playground',
          name: 'playground',
          component: () => import('../views/ModelPlayground.vue'),
        },
        // Legacy alias: /app/models → /app/playground
        {
          path: 'models',
          redirect: '/app/playground',
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
        {
          path: 'deployments',
          name: 'deployments',
          component: () => import('../views/DeploymentsView.vue'),
        },
        {
          path: 'billing',
          name: 'billing',
          component: () => import('../views/UsageView.vue'),
        },
      ],
    },

    // ── Admin (authenticated + admin role) ─────────────────────────
    {
      path: '/admin',
      component: () => import('../views/LayoutView.vue'),
      redirect: '/admin/services',
      children: [
        {
          path: 'services',
          name: 'adminServices',
          component: () => import('../views/AdminServicesView.vue'),
          meta: { requireAdmin: true },
        },
        {
          path: 'models',
          name: 'adminExternalModels',
          component: () => import('../views/AdminExternalModelsView.vue'),
          meta: { requireAdmin: true },
        },
        // Legacy alias: /admin/external-models → /admin/models
        {
          path: 'external-models',
          redirect: '/admin/models',
        },
        {
          path: 'audit',
          name: 'adminAudit',
          component: () => import('../views/AdminAuditView.vue'),
          meta: { requireAdmin: true },
        },
        {
          path: 'gpu',
          name: 'adminGPU',
          component: () => import('../views/AdminGPUSkusView.vue'),
          meta: { requireAdmin: true },
        },
        {
          path: 'sandbox',
          name: 'adminSandbox',
          component: () => import('../views/AdminSandboxView.vue'),
          meta: { requireAdmin: true },
        },
      ],
    },

    // ── 404 ─────────────────────────────────────────────────────────
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isLoggedIn) return '/login'
  if (to.meta.requireAdmin && !auth.isAdmin) return '/app/playground'
  // Redirect away from login/register if already logged in, but keep home/datasets/spaces accessible
  if ((to.path === '/login' || to.path === '/register') && auth.isLoggedIn) return '/'
})

export default router
