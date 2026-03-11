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
          <span class="text-slate-400 text-[9px] tracking-widest uppercase">AI Platform</span>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-3 py-4 space-y-1">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          active-class="bg-blue-600 text-white hover:bg-blue-600"
        >
          <el-icon :size="16"><component :is="item.icon" /></el-icon>
          <span>{{ t(item.label) }}</span>
        </router-link>

        <!-- Divider before admin items -->
        <div v-if="auth.isAdmin" class="my-2 border-t border-slate-700" />

        <router-link
          v-for="item in adminItems"
          :key="item.to"
          v-show="auth.isAdmin"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          active-class="bg-blue-600 text-white hover:bg-blue-600"
        >
          <el-icon :size="16"><component :is="item.icon" /></el-icon>
          <span>{{ t(item.label) }}</span>
        </router-link>
      </nav>

      <!-- User info / Guest -->
      <div class="px-4 py-4 border-t border-slate-700">
        <template v-if="auth.isLoggedIn">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-semibold shrink-0">
              {{ avatarLetter }}
            </div>
            <span class="text-sm text-slate-300 truncate">{{ auth.username }}</span>
          </div>
          <!-- Credit balance -->
          <div class="mb-2 px-1">
            <div v-if="balanceLoading" class="text-xs text-slate-500">{{ t('common.loadingBalance') }}</div>
            <div v-else class="flex items-center justify-between">
              <span class="text-xs text-slate-400">{{ t('common.balance') }}</span>
              <span :class="['text-xs font-mono font-semibold', balance <= 1 ? 'text-red-400' : 'text-emerald-400']">
                ${{ balance.toFixed(4) }}
              </span>
            </div>
            <div class="mt-1 h-1 rounded-full bg-slate-700 overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="balance <= 1 ? 'bg-red-500' : 'bg-emerald-500'"
                :style="{ width: Math.min(100, (balance / 10) * 100) + '%' }"
              />
            </div>
          </div>
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
        <div class="flex items-center gap-4">
          <router-link to="/" class="text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1">
            <el-icon class="text-xs"><House /></el-icon>
            <span class="hidden sm:inline">{{ t('home.nav.home') }}</span>
          </router-link>
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api/index'
import {
  SwitchButton, House, ChatDotRound, Box, Files, Grid, Key, Cpu,
  DataAnalysis, Connection, Tools, Search, Monitor
} from '@element-plus/icons-vue'

const { t, locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const currentLang = ref(locale.value)

const baseNavItems = [
  { to: '/app/playground', label: 'nav.playground', icon: ChatDotRound },
  { to: '/models',         label: 'nav.models',     icon: Box },
  { to: '/datasets',       label: 'nav.datasets',   icon: Files },
  { to: '/spaces',         label: 'nav.spaces',     icon: Grid },
  { to: '/app/apikeys',    label: 'nav.apikeys',    icon: Key },
  { to: '/app/deployments',label: 'nav.deployments',icon: Cpu },
  { to: '/app/billing',    label: 'nav.usageStats', icon: DataAnalysis },
]

const adminItems = [
  { to: '/admin/models',   label: 'nav.externalModels', icon: Connection },
  { to: '/admin/services', label: 'nav.adminServices',  icon: Tools },
  { to: '/admin/audit',    label: 'nav.usageAudit',     icon: Search },
  { to: '/admin/gpu',      label: 'nav.adminGPU',       icon: Monitor },
  { to: '/admin/sandbox',  label: 'nav.adminSandbox',   icon: Grid },
]

const navItems = computed(() => baseNavItems)

// Credit balance
const balance = ref(0)
const balanceLoading = ref(false)
async function fetchBalance() {
  if (!auth.isLoggedIn) return
  balanceLoading.value = true
  try {
    const res = await api.get('/user/balance')
    balance.value = res.data?.data?.balance_usd ?? 0
  } catch { balance.value = 0 }
  finally { balanceLoading.value = false }
}
onMounted(fetchBalance)

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
