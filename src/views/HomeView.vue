<template>
  <div class="min-h-screen bg-gray-50">
    <TopNav />

    <!-- Hero -->
    <section class="bg-white border-b border-gray-100 py-16 px-6">
      <div class="max-w-4xl mx-auto text-center">
        <div class="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-6 border border-blue-100">
          <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          {{ t('home.hero.badge') }}
        </div>
        <h1 class="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
          {{ t('home.heroTitle') }}
        </h1>
        <p class="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
          {{ t('home.heroSubtitle') }}
        </p>

        <!-- CTA: 未登录 vs 已登录 -->
        <div class="flex items-center justify-center gap-3 flex-wrap">
          <template v-if="auth.isLoggedIn">
            <el-button size="large" type="primary" @click="router.push('/app/playground')" class="!px-8 !h-11">
              🚀 {{ t('home.cta.goWorkspace') }}
            </el-button>
            <el-button size="large" @click="router.push('/models')" class="!px-8 !h-11">
              {{ t('home.ctaBrowse') }}
            </el-button>
          </template>
          <template v-else>
            <el-button size="large" type="primary" @click="router.push('/register')" class="!px-8 !h-11">
              {{ t('home.cta.btn') }}
            </el-button>
            <el-button size="large" @click="router.push('/models')" class="!px-8 !h-11">
              {{ t('home.ctaBrowse') }}
            </el-button>
          </template>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="bg-white border-b border-gray-100 py-6 px-6">
      <div class="max-w-4xl mx-auto">
        <div class="grid grid-cols-3 gap-6 text-center">
          <div>
            <div class="text-2xl font-bold text-blue-600">{{ stats.aiModels }}</div>
            <div class="text-sm text-gray-500 mt-1">{{ t('home.stat.aiModels') }}</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-blue-600">{{ stats.modelRepos }}</div>
            <div class="text-sm text-gray-500 mt-1">{{ t('home.stat.modelRepos') }}</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-blue-600">{{ stats.datasets }}</div>
            <div class="text-sm text-gray-500 mt-1">{{ t('home.stat.datasets') }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Hub entry cards -->
    <section class="py-10 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
          <router-link
            to="/models"
            class="bg-white rounded-2xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
              <span class="text-2xl">🧠</span>
            </div>
            <h3 class="font-bold text-gray-900 mb-1">{{ t('home.hub.modelsTitle') }}</h3>
            <p class="text-sm text-gray-500 mb-3">{{ t('home.hub.modelsDesc') }}</p>
            <div class="flex items-center text-sm text-blue-600 font-medium">
              {{ t('home.viewAll') }}
              <el-icon class="ml-1 text-xs group-hover:translate-x-1 transition-transform"><ArrowRight /></el-icon>
            </div>
          </router-link>

          <router-link
            to="/datasets"
            class="bg-white rounded-2xl border border-gray-200 p-6 hover:border-green-300 hover:shadow-md transition-all group"
          >
            <div class="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
              <span class="text-2xl">📦</span>
            </div>
            <h3 class="font-bold text-gray-900 mb-1">{{ t('home.hub.datasetsTitle') }}</h3>
            <p class="text-sm text-gray-500 mb-3">{{ t('home.hub.datasetsDesc') }}</p>
            <div class="flex items-center text-sm text-green-600 font-medium">
              {{ t('home.viewAll') }}
              <el-icon class="ml-1 text-xs group-hover:translate-x-1 transition-transform"><ArrowRight /></el-icon>
            </div>
          </router-link>

          <router-link
            to="/spaces"
            class="bg-white rounded-2xl border border-gray-200 p-6 hover:border-purple-300 hover:shadow-md transition-all group"
          >
            <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
              <span class="text-2xl">🚀</span>
            </div>
            <h3 class="font-bold text-gray-900 mb-1">{{ t('home.hub.spacesTitle') }}</h3>
            <p class="text-sm text-gray-500 mb-3">{{ t('home.hub.spacesDesc') }}</p>
            <div class="flex items-center text-sm text-purple-600 font-medium">
              {{ t('home.viewAll') }}
              <el-icon class="ml-1 text-xs group-hover:translate-x-1 transition-transform"><ArrowRight /></el-icon>
            </div>
          </router-link>
        </div>

        <!-- Featured AI Models -->
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-xl font-bold text-gray-900">{{ t('home.featuredAiModels') }}</h2>
          <router-link
            to="/models"
            class="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            {{ t('home.viewAll') }}
            <el-icon class="text-xs"><ArrowRight /></el-icon>
          </router-link>
        </div>

        <div v-if="aiModelsLoading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          <div v-for="i in 6" :key="i" class="bg-white rounded-xl border border-gray-100 p-4 h-32 animate-pulse">
            <div class="h-4 bg-gray-100 rounded w-2/3 mb-3" />
            <div class="h-3 bg-gray-100 rounded w-full mb-2" />
            <div class="h-3 bg-gray-100 rounded w-4/5" />
          </div>
        </div>

        <div v-else-if="featuredModels.length === 0" class="text-sm text-gray-400 py-8 text-center bg-white rounded-xl border border-gray-100">
          {{ t('modelHub.empty') }}
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          <AiModelCard
            v-for="m in featuredModels"
            :key="m.id"
            :model="m"
            @try="handleTryModel"
          />
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-8 border-t border-gray-100 text-center text-xs text-gray-400 mt-4">
      © {{ new Date().getFullYear() }} aitra · AI Platform
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowRight } from '@element-plus/icons-vue'
import TopNav from '../components/TopNav.vue'
import AiModelCard from '../components/AiModelCard.vue'
import { useAuthStore } from '../stores/auth'
import api from '../api/index'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()

interface AIModel {
  id: number
  model_name: string
  api_endpoint: string
  provider: string
  enabled: boolean
}

const aiModels = ref<AIModel[]>([])
const aiModelsLoading = ref(false)
const modelRepoCount = ref(0)
const datasetCount = ref(0)

const featuredModels = computed(() => aiModels.value.slice(0, 6))

const stats = computed(() => ({
  aiModels:   aiModels.value.length  || '—',
  modelRepos: modelRepoCount.value   || '—',
  datasets:   datasetCount.value     || '—',
}))

function handleTryModel() {
  router.push(auth.isLoggedIn ? '/app/playground' : '/login')
}

async function fetchAiModels() {
  aiModelsLoading.value = true
  try {
    const res = await api.get<{ data: AIModel[] }>('/public/llm_configs')
    aiModels.value = (res.data?.data ?? []).filter(m => m.enabled)
  } catch {
    aiModels.value = []
  } finally {
    aiModelsLoading.value = false
  }
}

async function fetchCounts() {
  try {
    const [mRes, dRes] = await Promise.allSettled([
      api.get('/models?per=1&page=1'),
      api.get('/datasets?per=1&page=1'),
    ])
    if (mRes.status === 'fulfilled') modelRepoCount.value = (mRes.value.data as any)?.total ?? 0
    if (dRes.status === 'fulfilled') datasetCount.value = (dRes.value.data as any)?.total ?? 0
  } catch { /* non-critical */ }
}

onMounted(() => {
  fetchAiModels()
  fetchCounts()
})
</script>
