<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside class="w-56 bg-slate-900 text-white flex flex-col shrink-0">
      <!-- Logo -->
      <div class="flex items-center gap-2.5 px-5 py-5 border-b border-slate-700">
        <div class="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
             style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)">
          <span class="font-black text-sm text-white tracking-tight">AI</span>
        </div>
        <div class="flex flex-col leading-none">
          <span class="font-bold text-white text-base tracking-wide">aitra</span>
          <span class="text-slate-400 text-[9px] tracking-widest uppercase">
            {{ isAdminArea ? t('layout.adminPanel') : t('layout.aiPlatform') }}
          </span>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <!-- User area nav -->
        <template v-if="!isAdminArea">
          <template v-for="item in userNavItems" :key="item.to">
            <a
              v-if="item.external"
              :href="item.to"
              target="_blank"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <el-icon :size="16"><component :is="item.icon" /></el-icon>
              <span>{{ t(item.label) }}</span>
            </a>
            <router-link
              v-else
              :to="item.to"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              active-class="bg-blue-600 text-white hover:bg-blue-600"
            >
              <el-icon :size="16"><component :is="item.icon" /></el-icon>
              <span>{{ t(item.label) }}</span>
            </router-link>
          </template>

          <!-- Admin switch (only for admins) -->
          <template v-if="auth.isAdmin">
            <div class="my-2 border-t border-slate-700" />
            <button
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              @click="router.push('/admin/services')"
            >
              <el-icon :size="16"><Setting /></el-icon>
              <span>{{ t('layout.goAdmin') }}</span>
              <el-icon :size="12" class="ml-auto opacity-50"><ArrowRight /></el-icon>
            </button>
          </template>
        </template>

        <!-- Admin area nav -->
        <template v-else>
          <!-- Back to app -->
          <button
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors mb-1"
            @click="router.push('/app/playground')"
          >
            <el-icon :size="16"><ArrowLeft /></el-icon>
            <span>{{ t('layout.backToApp') }}</span>
          </button>
          <div class="my-2 border-t border-slate-700" />

          <router-link
            v-for="item in adminNavItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            active-class="bg-orange-600 text-white hover:bg-orange-600"
          >
            <el-icon :size="16"><component :is="item.icon" /></el-icon>
            <span>{{ t(item.label) }}</span>
          </router-link>
        </template>
      </nav>

      <!-- User info footer -->
      <div class="px-4 py-4 border-t border-slate-700">
        <template v-if="auth.isLoggedIn">
          <!-- Avatar + username -->
          <button
            class="flex items-center gap-2 mb-2 w-full hover:opacity-80 transition-opacity text-left"
            @click="router.push('/profile')"
          >
            <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-semibold shrink-0">
              {{ avatarLetter }}
            </div>
            <span class="text-sm text-slate-300 truncate">{{ auth.username }}</span>
          </button>

          <!-- Balance (user area only) -->
          <template v-if="!isAdminArea">
            <router-link to="/app/billing" class="block mb-2 px-1 rounded-md hover:bg-slate-700/50 transition-colors cursor-pointer py-1 -mx-1 no-underline">
              <div v-if="balanceLoading" class="text-xs text-slate-500">{{ t('common.loadingBalance') }}</div>
              <div v-else class="flex items-center justify-between">
                <span class="text-xs text-slate-400">{{ t('common.balance') }}</span>
                <span :class="['text-xs font-mono font-semibold', balance <= 1 ? 'text-red-400' : 'text-emerald-400']">
                  ${{ balance.toFixed(4) }}
                </span>
              </div>
              <div class="mt-1 h-1 rounded-full bg-slate-700 overflow-hidden" :title="monthlyBudget > 0 ? `$${monthlySpend.toFixed(2)} / $${monthlyBudget.toFixed(2)} this month` : ''">
                <div
                  class="h-full rounded-full transition-all"
                  :class="budgetBarColor"
                  :style="{ width: budgetPercent + '%' }"
                />
              </div>
            </router-link>
          </template>

          <el-button size="small" text class="!text-slate-400 !px-0 text-xs" @click="handleLogout">
            <el-icon class="mr-1"><SwitchButton /></el-icon>{{ t('common.logout') }}
          </el-button>
        </template>
        <template v-else>
          <el-button size="small" class="w-full mb-2" type="primary" @click="router.push('/register')">
            {{ t('nav.register') }}
          </el-button>
          <el-button size="small" class="w-full !ml-0" @click="router.push('/login')">
            {{ t('nav.login') }}
          </el-button>
        </template>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <!-- Breadcrumb home -->
          <router-link to="/" class="text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1">
            <el-icon class="text-xs"><House /></el-icon>
            <span class="hidden sm:inline">{{ t('home.nav.home') }}</span>
          </router-link>
          <!-- Admin badge -->
          <el-tag v-if="isAdminArea" type="warning" size="small" effect="dark">Admin</el-tag>
        </div>
        <el-select v-model="currentLang" size="small" style="width: 100px" @change="changeLang">
          <el-option value="zh" label="中文" />
          <el-option value="en" label="English" />
        </el-select>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-auto">
        <router-view />
      </main>
    </div>

    <!-- Onboarding for new users -->
    <OnboardingDialog v-model="showOnboarding" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api/index'
import OnboardingDialog from '../components/OnboardingDialog.vue'
import {
  SwitchButton, House, ChatDotRound, Key, Cpu,
  DataAnalysis, Connection, Tools, Search, Monitor, Grid, Link,
  Setting, ArrowRight, ArrowLeft, Timer, Document, Wallet,
} from '@element-plus/icons-vue'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const currentLang = ref(locale.value)

// ─── Context detection ────────────────────────────────────────────────────
const isAdminArea = computed(() => route.path.startsWith('/admin'))

// ─── User nav items ───────────────────────────────────────────────────────
const userNavItems = [
  { to: '/app/model-dashboard', label: 'nav.modelDashboard', icon: Grid },
  { to: '/app/playground', label: 'nav.playground', icon: ChatDotRound },
  { to: '/app/apikeys',    label: 'nav.apikeys',    icon: Key },
  { to: '/app/billing',    label: 'nav.usage',      icon: DataAnalysis },
  { to: '/docs',           label: 'nav.docs',       icon: Document, external: true },
  { to: '/models',         label: 'nav.modelHub',   icon: Connection, external: true },
]

// ─── Admin nav items ──────────────────────────────────────────────────────
const adminNavItems = [
  { to: '/admin/services', label: 'nav.adminServices',  icon: Tools },
  { to: '/admin/models',   label: 'nav.externalModels', icon: Connection },
  { to: '/admin/audit',    label: 'nav.usageAudit',     icon: Search },
  { to: '/admin/gpu',      label: 'nav.adminGPU',       icon: Monitor },
  { to: '/admin/mcp',          label: 'nav.adminMCP',        icon: Link },
  { to: '/admin/skills',      label: 'nav.adminSkills',     icon: Cpu },
  { to: '/admin/sandbox',      label: 'nav.adminSandbox',    icon: Grid },
  { to: '/admin/rate-limits',  label: 'nav.adminRateLimits', icon: Timer },
  { to: '/admin/credits',      label: 'nav.adminCredits',    icon: Wallet },
]

// ─── Balance & Budget ─────────────────────────────────────────────────────
const balance = ref(0)
const monthlyBudget = ref(0)
const monthlySpend = ref(0)
const balanceLoading = ref(false)

const budgetPercent = computed(() => {
  if (monthlyBudget.value > 0) return Math.min(100, (monthlySpend.value / monthlyBudget.value) * 100)
  return Math.min(100, (balance.value / 10) * 100)
})

const budgetBarColor = computed(() => {
  if (budgetPercent.value >= 100) return 'bg-red-500'
  if (budgetPercent.value >= 80) return 'bg-yellow-500'
  return 'bg-emerald-500'
})

async function fetchBalance() {
  if (!auth.isLoggedIn) return
  balanceLoading.value = true
  try {
    const res = await api.get('/user/balance')
    balance.value = res.data?.data?.balance_usd ?? 0
  } catch { balance.value = 0 }
  finally { balanceLoading.value = false }
  // Also fetch budget
  try {
    const res = await api.get('/user/settings/budget')
    const data = res.data?.data
    if (data) {
      monthlyBudget.value = data.monthly_budget_usd ?? 0
      monthlySpend.value = data.current_spend_usd ?? 0
    }
  } catch { /* no budget set */ }
}

const showOnboarding = ref(false)

onMounted(() => {
  fetchBalance()
  // Show onboarding for new users
  if (auth.isLoggedIn && !localStorage.getItem(`onboarding_done_${auth.username}`)) {
    showOnboarding.value = true
  }
})

// ─── Misc ─────────────────────────────────────────────────────────────────
const avatarLetter = computed(() =>
  (auth.username || 'U').charAt(0).toUpperCase()
)

function changeLang(lang: string) {
  locale.value = lang
  localStorage.setItem('lang', lang)
}

function handleLogout() {
  auth.logout()
  router.push('/')
}
</script>
