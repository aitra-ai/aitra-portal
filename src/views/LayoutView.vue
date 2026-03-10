<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside class="w-56 bg-slate-900 text-white flex flex-col shrink-0">
      <!-- Logo -->
      <div class="flex items-center gap-2 px-5 py-5 border-b border-slate-700">
        <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
          <span class="font-bold text-sm">C</span>
        </div>
        <span class="font-semibold text-base">CSG Portal</span>
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
      </nav>

      <!-- User info -->
      <div class="px-4 py-4 border-t border-slate-700">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-semibold">
            {{ avatarLetter }}
          </div>
          <span class="text-sm text-slate-300 truncate">{{ auth.username }}</span>
        </div>
        <el-button size="small" text class="!text-slate-400 !px-0 text-xs" @click="handleLogout">
          <el-icon class="mr-1"><SwitchButton /></el-icon>{{ t('common.logout') }}
        </el-button>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-end gap-3">
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
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const { t, locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const currentLang = ref(locale.value)

const navItems = [
  { to: '/models', label: 'nav.models', icon: 'ChatDotRound' },
  { to: '/apikeys', label: 'nav.apikeys', icon: 'Key' },
  { to: '/openclaw', label: 'nav.openclaw', icon: 'Grid' },
]

const avatarLetter = computed(() =>
  (auth.username || 'U').charAt(0).toUpperCase()
)

function changeLang(lang: string) {
  locale.value = lang
  localStorage.setItem('lang', lang)
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>
