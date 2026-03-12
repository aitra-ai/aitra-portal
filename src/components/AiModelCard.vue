<template>
  <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer" @click="emit('try')">
    <div class="flex items-center gap-2">
      <span
        class="text-xs font-semibold px-2 py-0.5 rounded-full"
        :style="badgeStyle"
      >{{ model.provider || 'AI' }}</span>
      <span v-if="!model.enabled" class="text-xs text-gray-400">(disabled)</span>
    </div>
    <p class="text-sm font-medium text-gray-800 truncate flex-1" :title="model.model_name">
      {{ model.model_name }}
    </p>
    <el-button size="small" type="primary" class="w-full mt-auto">
      {{ t('home.tryNow') }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface AiModel {
  id: number
  model_name: string
  provider: string
  enabled: boolean
}

const props = defineProps<{
  model: AiModel
}>()

const emit = defineEmits<{ (e: 'try'): void }>()

const { t } = useI18n()

const PROVIDER_COLORS: Record<string, { bg: string; text: string }> = {
  anthropic:  { bg: '#d97706', text: '#fff' },
  openai:     { bg: '#10b981', text: '#fff' },
  google:     { bg: '#3b82f6', text: '#fff' },
  mistral:    { bg: '#8b5cf6', text: '#fff' },
  meta:       { bg: '#1d4ed8', text: '#fff' },
  deepseek:   { bg: '#0ea5e9', text: '#fff' },
  openrouter: { bg: '#6366f1', text: '#fff' },
}

const badgeStyle = computed(() => {
  const key = (props.model.provider || '').toLowerCase()
  const c = PROVIDER_COLORS[key] ?? { bg: '#6b7280', text: '#fff' }
  return { backgroundColor: c.bg, color: c.text }
})
</script>
