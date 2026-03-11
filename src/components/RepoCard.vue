<template>
  <router-link :to="cardLink" class="block">
    <!-- Grid card -->
    <div
      v-if="layout === 'grid'"
      class="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group flex flex-col"
    >
      <div class="flex items-start justify-between mb-3">
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0"
          :class="avatarGradient"
        >
          {{ avatarChar }}
        </div>
        <el-tag size="small" :type="item.private ? 'warning' : 'success'">
          {{ item.private ? 'Private' : 'Public' }}
        </el-tag>
      </div>
      <h3 class="font-semibold text-gray-900 mb-0.5 truncate text-sm group-hover:text-blue-600 transition-colors">
        {{ item.nickname || item.name }}
      </h3>
      <p class="text-xs text-gray-400 mb-2 truncate">{{ item.path }}</p>
      <p class="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed flex-1">
        {{ item.description || t('modelHub.noDescription') }}
      </p>
      <div class="flex items-center justify-between text-xs text-gray-400">
        <div class="flex items-center gap-3">
          <span class="flex items-center gap-1">
            <el-icon><Star /></el-icon>{{ item.likes ?? 0 }}
          </span>
          <span v-if="type !== 'space'" class="flex items-center gap-1">
            <el-icon><Download /></el-icon>{{ item.downloads ?? 0 }}
          </span>
        </div>
        <span>{{ relativeDate }}</span>
      </div>
    </div>

    <!-- List row -->
    <div
      v-else
      class="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-4 hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div
        class="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
        :class="avatarGradient"
      >
        {{ avatarChar }}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-0.5">
          <span class="font-semibold text-gray-900 text-sm">{{ item.nickname || item.name }}</span>
          <el-tag size="small" :type="item.private ? 'warning' : 'success'" class="shrink-0">
            {{ item.private ? 'Private' : 'Public' }}
          </el-tag>
        </div>
        <p class="text-xs text-gray-400 truncate">{{ item.path }}</p>
      </div>
      <p class="text-xs text-gray-500 truncate max-w-xs hidden lg:block">
        {{ item.description || '—' }}
      </p>
      <div class="flex items-center gap-4 text-xs text-gray-400 shrink-0">
        <span class="flex items-center gap-1"><el-icon><Star /></el-icon>{{ item.likes ?? 0 }}</span>
        <span v-if="type !== 'space'" class="flex items-center gap-1">
          <el-icon><Download /></el-icon>{{ item.downloads ?? 0 }}
        </span>
        <span>{{ relativeDate }}</span>
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface RepoItem {
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

const props = defineProps<{
  item: RepoItem
  type: 'model' | 'dataset' | 'space'
  layout?: 'grid' | 'list'
}>()

const { t } = useI18n()

const cardLink = computed(() => {
  const [ns, nm] = props.item.path.split('/')
  if (props.type === 'dataset') return `/datasets/${ns}/${nm}`
  if (props.type === 'space') return `/spaces/${ns}/${nm}`
  return '#'
})

const avatarChar = computed(() =>
  (props.item.nickname || props.item.name || '?').charAt(0).toUpperCase()
)

const avatarGradient = computed(() => {
  if (props.type === 'model') return 'bg-gradient-to-br from-blue-500 to-purple-600'
  if (props.type === 'dataset') return 'bg-gradient-to-br from-green-500 to-teal-600'
  return 'bg-gradient-to-br from-orange-500 to-pink-600'
})

const relativeDate = computed(() => {
  if (!props.item.updated_at) return ''
  const d = new Date(props.item.updated_at)
  const days = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (days === 0) return t('modelHub.today')
  if (days === 1) return t('modelHub.yesterday')
  if (days < 30) return t('modelHub.daysAgo', { n: days })
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
})
</script>
