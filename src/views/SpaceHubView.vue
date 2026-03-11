<template>
  <div class="min-h-screen bg-gray-50">
    <TopNav />

    <section class="py-6 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="mb-5">
          <h1 class="text-2xl font-bold text-gray-900">{{ t('spaceHub.title') }}</h1>
          <p class="text-gray-500 text-sm mt-1">{{ t('spaceHub.subtitle') }}</p>
        </div>

        <HubToolbar
          v-model:search-query="searchQuery"
          v-model:sort-by="sortBy"
          v-model:view-mode="viewMode"
          :total="total"
          class="mb-4"
          @update:search-query="onSearchChange"
          @update:sort-by="onSortChange"
        />

        <div v-if="loading" class="flex justify-center py-24">
          <el-icon class="animate-spin text-blue-500 text-4xl"><Loading /></el-icon>
        </div>

        <el-empty
          v-else-if="spaces.length === 0"
          :description="searchQuery ? t('modelHub.noResults') : t('modelHub.empty')"
          class="py-24"
        >
          <el-button v-if="searchQuery" @click="clearSearch">{{ t('modelHub.clearSearch') }}</el-button>
        </el-empty>

        <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <RepoCard
            v-for="sp in spaces"
            :key="sp.path"
            :item="sp"
            type="space"
            layout="grid"
          />
        </div>

        <div v-else class="space-y-2">
          <RepoCard
            v-for="sp in spaces"
            :key="sp.path"
            :item="sp"
            type="space"
            layout="list"
          />
        </div>

        <div v-if="total > perPage" class="flex justify-center mt-8">
          <el-pagination
            v-model:current-page="page"
            :page-size="perPage"
            :total="total"
            layout="prev, pager, next"
            @current-change="fetchSpaces"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import TopNav from '../components/TopNav.vue'
import RepoCard from '../components/RepoCard.vue'
import HubToolbar from '../components/HubToolbar.vue'
import api from '../api/index'

const { t } = useI18n()

interface RepoItem {
  path: string
  name: string
  nickname?: string
  description?: string
  private: boolean
  likes?: number
  downloads?: number
  updated_at?: string
}

const spaces = ref<RepoItem[]>([])
const loading = ref(false)
const searchQuery = ref('')
const sortBy = ref('recently_update')
const viewMode = ref<'grid' | 'list'>('grid')
const page = ref(1)
const total = ref(0)
const perPage = 24

let searchTimer: ReturnType<typeof setTimeout>

function onSearchChange(val: string) {
  searchQuery.value = val
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; fetchSpaces() }, 400)
}

function onSortChange(val: string) {
  sortBy.value = val
  page.value = 1
  fetchSpaces()
}

function clearSearch() {
  searchQuery.value = ''
  page.value = 1
  fetchSpaces()
}

async function fetchSpaces() {
  loading.value = true
  try {
    const params = new URLSearchParams({ per: String(perPage), page: String(page.value), sort: sortBy.value })
    if (searchQuery.value) params.set('search', searchQuery.value)
    const res = await api.get<{ data: RepoItem[]; total: number }>(`/spaces?${params}`)
    spaces.value = res.data?.data ?? []
    total.value = res.data?.total ?? spaces.value.length
  } catch {
    spaces.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchSpaces)
</script>
