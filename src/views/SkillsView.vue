<template>
  <div>
    <TopNav />
    <div class="p-6 max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">{{ t('skillsPage.title') }}</h1>
        <p class="text-gray-500 mt-1">{{ t('skillsPage.subtitle') }}</p>
      </div>

      <!-- Search + Filter -->
      <div class="flex flex-wrap gap-3 mb-6 items-center">
        <el-input
          v-model="searchQuery"
          :placeholder="t('skillsPage.searchPlaceholder')"
          clearable
          class="!w-64"
          :prefix-icon="Search"
        />
        <el-select v-model="selectedCategory" :placeholder="t('skillsPage.allCategories')" clearable class="!w-40">
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select>
        <div class="flex-1" />
        <span class="text-sm text-gray-400">{{ filteredSkills.length }} {{ t('skillsPage.skillsAvailable') }}</span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <el-skeleton v-for="i in 6" :key="i" :rows="3" animated class="p-4 bg-white rounded-xl border border-gray-100" />
      </div>

      <!-- Empty -->
      <div v-else-if="filteredSkills.length === 0" class="flex flex-col items-center justify-center py-20 text-gray-400">
        <p class="text-4xl mb-3">⚡</p>
        <p>{{ t('skillsPage.noSkills') }}</p>
      </div>

      <!-- Skill Cards -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="skill in filteredSkills"
          :key="skill.id"
          class="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ skill.icon }}</span>
              <div>
                <h3 class="text-sm font-semibold text-gray-900">{{ skill.name }}</h3>
                <p class="text-xs text-gray-400 mt-0.5">{{ skill.description }}</p>
              </div>
            </div>
            <div class="flex items-center gap-1 shrink-0 ml-2">
              <el-tag v-if="skill.category" size="small" class="capitalize">{{ skill.category }}</el-tag>
              <span v-if="skill.usage_count" class="text-xs text-gray-400">{{ skill.usage_count }} {{ t('common.calls') }}</span>
            </div>
          </div>

          <!-- Preferred Model -->
          <div v-if="skill.preferred_model" class="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <el-icon class="text-gray-400"><Cpu /></el-icon>
            <span>{{ skill.preferred_model }}</span>
          </div>

          <!-- System Prompt Preview -->
          <div class="bg-gray-50 rounded-lg p-3 mb-4 text-xs text-gray-600 line-clamp-3 leading-relaxed">
            {{ skill.system_prompt }}
          </div>

          <!-- Conversation Starters Preview -->
          <div v-if="skill.conversation_starters?.length" class="flex flex-wrap gap-1 mb-3">
            <el-tag v-for="s in skill.conversation_starters.slice(0, 3)" :key="s" size="small" round type="info" class="!text-xs">{{ s }}</el-tag>
          </div>

          <!-- Actions -->
          <router-link :to="{ path: '/app/playground', query: { skill: skill.id } }">
            <el-button size="small" type="primary" class="w-full">
              {{ t('skillsPage.trySkill') }}
            </el-button>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, Cpu } from '@element-plus/icons-vue'
import TopNav from '../components/TopNav.vue'
import api from '../api/index'

const { t } = useI18n()

interface AISkill {
  id: number
  name: string
  description: string
  system_prompt: string
  preferred_model: string
  icon: string
  is_builtin: boolean
  category?: string
  usage_count?: number
  welcome_message?: string
  conversation_starters?: string[]
}

const skills = ref<AISkill[]>([])
const loading = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('')

const categories = computed(() => {
  const set = new Set(skills.value.map(s => s.category).filter(Boolean))
  return Array.from(set).sort()
})

const filteredSkills = computed(() => {
  let list = skills.value
  if (selectedCategory.value) {
    list = list.filter(s => s.category === selectedCategory.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    )
  }
  // Sort by usage_count descending
  return [...list].sort((a, b) => (b.usage_count ?? 0) - (a.usage_count ?? 0))
})

async function fetchSkills() {
  loading.value = true
  try {
    const res = await api.get<{ data: AISkill[] }>('/public/skills')
    skills.value = res.data?.data ?? []
  } catch {
    skills.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchSkills)
</script>
