<template>
  <div class="min-h-screen bg-gray-50">
    <TopNav />

    <!-- Hero -->
    <section class="bg-white border-b border-gray-100 py-16 px-6">
      <div class="max-w-4xl mx-auto text-center">
        <div class="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-6 border border-blue-100">
          <span class="w-1.5 h-1.5 rounded-full bg-blue-500" />
          {{ t('home.hero.badge') }}
        </div>
        <h1 class="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
          {{ t('home.heroTitle') }}
        </h1>
        <p class="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
          {{ t('home.heroSubtitle') }}
        </p>
        <div class="flex items-center justify-center gap-3 flex-wrap">
          <el-button size="large" type="primary" @click="router.push('/models')" class="!px-8 !h-11">
            {{ t('home.ctaBrowse') }}
          </el-button>
          <el-button size="large" @click="router.push('/login')" class="!px-8 !h-11">
            {{ t('home.ctaTry') }}
          </el-button>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="bg-white border-b border-gray-100 py-6 px-6">
      <div class="max-w-4xl mx-auto">
        <div class="grid grid-cols-3 gap-6 text-center">
          <div>
            <div class="text-2xl font-bold text-blue-600">{{ stats.aiModels }}</div>
            <div class="text-sm text-gray-500 mt-1">{{ t('home.statsAiModels', { n: '' }).replace('{n} ', '') }}</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-blue-600">{{ stats.modelRepos }}</div>
            <div class="text-sm text-gray-500 mt-1">{{ t('home.statsModelRepos', { n: '' }).replace('{n} ', '') }}</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-blue-600">{{ stats.datasets }}</div>
            <div class="text-sm text-gray-500 mt-1">{{ t('home.statsDatasets', { n: '' }).replace('{n} ', '') }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured AI Models -->
    <section class="py-10 px-6">
      <div class="max-w-7xl mx-auto">
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

        <div v-if="aiModelsLoading" class="flex justify-center py-16">
          <el-icon class="animate-spin text-blue-500 text-3xl"><Loading /></el-icon>
        </div>
        <div v-else-if="featuredModels.length === 0" class="text-sm text-gray-400 py-8 text-center">
          {{ t('modelHub.empty') }}
        </div>
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          <AiModelCard
            v-for="m in featuredModels"
            :key="m.id"
            :model="m"
            :on-try="() => handleTryModel()"
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
  aiModels: aiModels.value.length || '—',
  modelRepos: modelRepoCount.value || '—',
  datasets: datasetCount.value || '—',
}))

function handleTryModel() {
  if (auth.isLoggedIn) {
    router.push('/app/playground')
  } else {
    router.push('/login')
  }
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
      api.get<{ total: number }>('/models?per=1&page=1'),
      api.get<{ total: number }>('/datasets?per=1&page=1'),
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
