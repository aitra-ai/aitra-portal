<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Top Nav (same as homepage) -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div class="flex items-center gap-8">
          <router-link to="/" class="flex items-center gap-2">
            <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-sm">C</span>
            </div>
            <span class="font-bold text-gray-900">aitra</span>
          </router-link>
          <nav class="flex items-center gap-1">
            <router-link to="/" class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors">
              {{ t('home.nav.home') }}
            </router-link>
            <router-link to="/models" class="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md">
              {{ t('home.nav.modelHub') }}
            </router-link>
          </nav>
        </div>
        <div class="flex items-center gap-3">
          <el-select v-model="currentLang" size="small" style="width: 90px" @change="changeLang">
            <el-option value="zh" label="中文" />
            <el-option value="en" label="English" />
          </el-select>
          <template v-if="auth.isLoggedIn">
            <el-button size="small" type="primary" @click="router.push('/app/models')">
              {{ t('home.nav.home') }} →
            </el-button>
          </template>
          <template v-else>
            <el-button size="small" @click="router.push('/login')">{{ t('nav.login') }}</el-button>
            <el-button size="small" type="primary" @click="router.push('/register')">{{ t('nav.register') }}</el-button>
          </template>
        </div>
      </div>
    </header>

    <!-- Page header -->
    <div class="bg-white border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-6 py-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-1">{{ t('modelHub.title') }}</h1>
        <p class="text-gray-500">{{ t('modelHub.subtitle') }}</p>

        <!-- Search + filter bar -->
        <div class="flex items-center gap-3 mt-6">
          <el-input
            v-model="searchQuery"
            :placeholder="t('modelHub.searchPlaceholder')"
            :prefix-icon="Search"
            clearable
            class="max-w-md"
            @input="onSearch"
          />
          <el-select v-model="sortBy" size="default" style="width: 140px" @change="fetchModels">
            <el-option value="trending" :label="t('modelHub.sortTrending')" />
            <el-option value="recently_update" :label="t('modelHub.sortRecent')" />
            <el-option value="most_download" :label="t('modelHub.sortDownload')" />
            <el-option value="most_like" :label="t('modelHub.sortLike')" />
          </el-select>
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button value="grid"><el-icon><Grid /></el-icon></el-radio-button>
            <el-radio-button value="list"><el-icon><List /></el-icon></el-radio-button>
          </el-radio-group>
          <span class="text-sm text-gray-400 ml-auto">
            {{ t('modelHub.total', { count: total }) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-7xl mx-auto px-6 py-8">
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-20">
        <el-icon class="animate-spin text-blue-500 text-4xl"><Loading /></el-icon>
      </div>

      <!-- Empty -->
      <el-empty v-else-if="models.length === 0" :description="t('modelHub.empty')" class="py-24">
        <template v-if="searchQuery">
          <el-button @click="searchQuery = ''; fetchModels()">{{ t('modelHub.clearSearch') }}</el-button>
        </template>
      </el-empty>

      <!-- Grid view -->
      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="model in models"
          :key="model.path"
          class="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
          @click="openModel(model)"
        >
          <!-- Avatar + badge -->
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shrink-0">
              {{ (model.nickname || model.name || '?').charAt(0).toUpperCase() }}
            </div>
            <div class="flex flex-col items-end gap-1">
              <el-tag v-if="model.private" size="small" type="warning">Private</el-tag>
              <el-tag v-else size="small" type="success">Public</el-tag>
            </div>
          </div>

          <!-- Name + path -->
          <h3 class="font-semibold text-gray-900 mb-0.5 truncate text-sm group-hover:text-blue-600 transition-colors">
            {{ model.nickname || model.name }}
          </h3>
          <p class="text-xs text-gray-400 mb-2 truncate">{{ model.path }}</p>

          <!-- Description -->
          <p class="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed min-h-[2.5rem]">
            {{ model.description || t('modelHub.noDescription') }}
          </p>

          <!-- Stats -->
          <div class="flex items-center gap-3 text-xs text-gray-400 mb-3">
            <span class="flex items-center gap-1">
              <el-icon><Star /></el-icon>{{ model.likes ?? 0 }}
            </span>
            <span class="flex items-center gap-1">
              <el-icon><Download /></el-icon>{{ model.downloads ?? 0 }}
            </span>
            <span class="ml-auto">{{ formatDate(model.updated_at) }}</span>
          </div>

          <!-- Try button -->
          <el-button size="small" type="primary" plain class="w-full opacity-0 group-hover:opacity-100 transition-opacity">
            <el-icon class="mr-1"><ChatDotRound /></el-icon>
            {{ t('models.tryIt') }}
          </el-button>
        </div>
      </div>

      <!-- List view -->
      <div v-else class="space-y-2">
        <div
          v-for="model in models"
          :key="model.path"
          class="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
          @click="openModel(model)"
        >
          <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {{ (model.nickname || model.name || '?').charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <span class="font-semibold text-gray-900 text-sm truncate">{{ model.nickname || model.name }}</span>
              <el-tag size="small" :type="model.private ? 'warning' : 'success'" class="shrink-0">
                {{ model.private ? 'Private' : 'Public' }}
              </el-tag>
            </div>
            <p class="text-xs text-gray-400 truncate">{{ model.path }}</p>
          </div>
          <p class="text-xs text-gray-500 truncate max-w-xs hidden lg:block">{{ model.description || '—' }}</p>
          <div class="flex items-center gap-4 text-xs text-gray-400 shrink-0">
            <span class="flex items-center gap-1"><el-icon><Star /></el-icon>{{ model.likes ?? 0 }}</span>
            <span class="flex items-center gap-1"><el-icon><Download /></el-icon>{{ model.downloads ?? 0 }}</span>
            <span>{{ formatDate(model.updated_at) }}</span>
          </div>
          <el-button size="small" type="primary" plain class="shrink-0">{{ t('models.tryIt') }}</el-button>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="total > perPage" class="flex justify-center mt-8">
        <el-pagination
          v-model:current-page="page"
          :page-size="perPage"
          :total="total"
          layout="prev, pager, next"
          @current-change="fetchModels"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import api from '../api/index'

const { t, locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const currentLang = ref(locale.value)

function changeLang(lang: string) {
  locale.value = lang
  localStorage.setItem('lang', lang)
}

interface ModelItem {
  path: string
  name: string
  nickname?: string
  description?: string
  private: boolean
  likes?: number
  downloads?: number
  updated_at?: string
  tags?: string[]
}

const models = ref<ModelItem[]>([])
const loading = ref(false)
const searchQuery = ref('')
const sortBy = ref('recently_update')
const viewMode = ref<'grid' | 'list'>('grid')
const page = ref(1)
const perPage = 24
const total = ref(0)

let searchTimer: ReturnType<typeof setTimeout>

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; fetchModels() }, 400)
}

function formatDate(s?: string) {
  if (!s) return ''
  const d = new Date(s)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return t('modelHub.today')
  if (days === 1) return t('modelHub.yesterday')
  if (days < 30) return t('modelHub.daysAgo', { n: days })
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

async function fetchModels() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      per: String(perPage),
      page: String(page.value),
      sort: sortBy.value,
    })
    if (searchQuery.value) params.set('search', searchQuery.value)

    const res = await api.get<{ data: ModelItem[]; total: number }>(`/models?${params}`)
    models.value = res.data?.data ?? []
    total.value = res.data?.total ?? models.value.length
  } catch {
    models.value = []
  } finally {
    loading.value = false
  }
}

function openModel(model: ModelItem) {
  // Navigate to playground with this model pre-selected
  router.push({ path: '/app/models', query: { model: model.path } })
}

onMounted(fetchModels)
</script>
