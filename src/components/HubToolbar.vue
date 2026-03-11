<template>
  <div class="flex flex-col md:flex-row md:items-center gap-3">
    <!-- Left: total count -->
    <div class="flex-1 text-sm text-gray-500">
      <span v-if="total !== undefined">{{ totalLabel || t('modelHub.total', { count: total }) }}</span>
    </div>

    <!-- Right: controls -->
    <div class="flex items-center gap-2 flex-wrap">
      <el-input
        :model-value="searchQuery"
        :placeholder="t('modelHub.searchPlaceholder')"
        :prefix-icon="'Search'"
        clearable
        style="width: 220px"
        @update:model-value="$emit('update:searchQuery', $event)"
        @clear="$emit('update:searchQuery', '')"
      />
      <el-select
        :model-value="sortBy"
        size="default"
        style="width: 140px"
        @update:model-value="$emit('update:sortBy', $event)"
      >
        <el-option value="recently_update" :label="t('modelHub.sortRecent')" />
        <el-option value="trending"        :label="t('modelHub.sortTrending')" />
        <el-option value="most_download"   :label="t('modelHub.sortDownload')" />
        <el-option value="most_like"       :label="t('modelHub.sortLike')" />
      </el-select>
      <el-radio-group
        :model-value="viewMode"
        size="small"
        @update:model-value="$emit('update:viewMode', $event)"
      >
        <el-radio-button value="grid">
          <el-icon><Grid /></el-icon>
        </el-radio-button>
        <el-radio-button value="list">
          <el-icon><List /></el-icon>
        </el-radio-button>
      </el-radio-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  searchQuery: string
  sortBy: string
  viewMode: 'grid' | 'list'
  total?: number
  totalLabel?: string
}>()

defineEmits<{
  'update:searchQuery': [value: string]
  'update:sortBy': [value: string]
  'update:viewMode': [value: 'grid' | 'list']
}>()
</script>
