<template>
  <header class="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
    <div class="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
      <!-- Logo + Nav -->
      <div class="flex items-center gap-8">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-2 shrink-0">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center"
               style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)">
            <span class="text-white font-black text-[10px] tracking-tight">AI</span>
          </div>
          <span class="font-bold text-gray-900 text-base tracking-wide">aitra</span>
        </router-link>

        <!-- Nav tabs -->
        <nav class="hidden sm:flex items-center gap-1">
          <router-link
            v-for="tab in navTabs"
            :key="tab.to"
            :to="tab.to"
            class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            :class="isActive(tab.to)
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
          >{{ tab.label }}</router-link>
        </nav>
      </div>

      <!-- Right side -->
      <div class="flex items-center gap-2">
        <!-- Language selector -->
        <el-select v-model="currentLang" size="small" style="width: 90px" @change="changeLang">
          <el-option value="zh" label="中文" />
          <el-option value="en" label="English" />
        </el-select>

        <!-- Logged in -->
        <template v-if="auth.isLoggedIn">
          <el-dropdown trigger="click" @command="handleCommand">
            <button class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
              <div class="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                {{ avatarLetter }}
              </div>
              <span class="hidden sm:inline">{{ auth.username }}</span>
              <el-icon class="text-gray-400 text-xs"><ArrowDown /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon class="mr-1"><User /></el-icon>{{ t('nav.profile') }}
                </el-dropdown-item>
                <el-dropdown-item command="playground" divided>
                  <el-icon class="mr-1"><ChatDotRound /></el-icon>{{ t('nav.playground') }}
                </el-dropdown-item>
                <el-dropdown-item command="apikeys">
                  <el-icon class="mr-1"><Key /></el-icon>{{ t('nav.apikeys') }}
                </el-dropdown-item>
                <el-dropdown-item v-if="auth.isAdmin" command="adminModels" divided>
                  <el-icon class="mr-1"><Setting /></el-icon>{{ t('nav.externalModels') }}
                </el-dropdown-item>
                <el-dropdown-item command="logout" :divided="!auth.isAdmin">
                  <el-icon class="mr-1"><SwitchButton /></el-icon>{{ t('common.logout') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>

        <!-- Guest -->
        <template v-else>
          <el-button size="small" @click="router.push('/login')">{{ t('nav.login') }}</el-button>
          <el-button size="small" type="primary" @click="router.push('/register')">{{ t('nav.register') }}</el-button>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { User } from '@element-plus/icons-vue'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const currentLang = ref(locale.value)

const navTabs = computed(() => [
  { to: '/models', label: t('nav.modelSquare') },
  { to: '/datasets', label: t('nav.datasets') },
  { to: '/spaces', label: t('nav.spaces') },
])

const avatarLetter = computed(() =>
  (auth.username || 'U').charAt(0).toUpperCase()
)

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}

function changeLang(lang: string) {
  locale.value = lang
  localStorage.setItem('lang', lang)
}

function handleCommand(cmd: string) {
  if (cmd === 'profile') router.push('/profile')
  else if (cmd === 'playground') router.push('/app/playground')
  else if (cmd === 'apikeys') router.push('/app/apikeys')
  else if (cmd === 'adminModels') router.push('/admin/models')
  else if (cmd === 'logout') {
    auth.logout()
    router.push('/')
  }
}
</script>
