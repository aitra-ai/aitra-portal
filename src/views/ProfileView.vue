<template>
  <div class="min-h-screen bg-gray-50">
    <TopNav />

    <div class="max-w-3xl mx-auto px-6 py-10">
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-24">
        <el-icon class="animate-spin text-blue-500 text-4xl"><Loading /></el-icon>
      </div>

      <template v-else>
        <!-- Profile card -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <div class="flex items-center gap-6">
            <!-- Avatar -->
            <div class="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold shrink-0 shadow-md">
              {{ avatarLetter }}
            </div>
            <div class="flex-1 min-w-0">
              <h1 class="text-xl font-bold text-gray-900 truncate">{{ profile?.nickname || profile?.username }}</h1>
              <div class="text-sm text-gray-400 font-mono mt-0.5">@{{ profile?.username }}</div>
              <div v-if="profile?.email" class="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <el-icon><Message /></el-icon>{{ profile.email }}
              </div>
              <div class="flex gap-2 mt-2 flex-wrap">
                <el-tag
                  v-for="role in profile?.roles ?? []"
                  :key="role"
                  :type="role === 'admin' || role === 'super_user' ? 'danger' : 'info'"
                  size="small"
                >{{ role }}</el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick links -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <router-link
            to="/app/playground"
            class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors">
              <el-icon class="text-xl"><ChatDotRound /></el-icon>
            </div>
            <div>
              <div class="font-semibold text-gray-800 text-sm">{{ t('nav.playground') }}</div>
              <div class="text-xs text-gray-400">{{ t('profile.goPlayground') }}</div>
            </div>
          </router-link>

          <router-link
            to="/app/apikeys"
            class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-500 group-hover:bg-green-100 transition-colors">
              <el-icon class="text-xl"><Key /></el-icon>
            </div>
            <div>
              <div class="font-semibold text-gray-800 text-sm">{{ t('nav.apikeys') }}</div>
              <div class="text-xs text-gray-400">{{ t('profile.manageKeys') }}</div>
            </div>
          </router-link>

          <router-link
            to="/app/billing"
            class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div class="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500 group-hover:bg-purple-100 transition-colors">
              <el-icon class="text-xl"><DataAnalysis /></el-icon>
            </div>
            <div>
              <div class="font-semibold text-gray-800 text-sm">{{ t('nav.usageStats') }}</div>
              <div class="text-xs text-gray-400">{{ t('profile.viewUsage') }}</div>
            </div>
          </router-link>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loading, ChatDotRound, Key, DataAnalysis, Message } from '@element-plus/icons-vue'
import TopNav from '../components/TopNav.vue'
import { useAuthStore } from '../stores/auth'
import { getUserInfo } from '../api/auth'

const { t } = useI18n()
const auth = useAuthStore()

interface Profile {
  username: string
  nickname?: string
  email?: string
  roles?: string[]
}

const profile = ref<Profile | null>(null)
const loading = ref(false)

const avatarLetter = computed(() =>
  (profile.value?.nickname || profile.value?.username || 'U').charAt(0).toUpperCase()
)

onMounted(async () => {
  loading.value = true
  try {
    const res = await getUserInfo(auth.username)
    const data = (res.data as any)?.data ?? (res.data as any)
    profile.value = data ?? { username: auth.username, ...auth.userInfo }
  } catch {
    // Fallback to store data
    profile.value = { username: auth.username, ...auth.userInfo }
  } finally {
    loading.value = false
  }
})
</script>
