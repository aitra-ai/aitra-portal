<template>
  <div class="p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('admin.extModels.title') }}</h1>
      <p class="text-gray-500 mt-1 text-sm">{{ t('admin.extModels.subtitle') }}</p>
    </div>

    <!-- Info banner -->
    <el-alert
      :title="t('admin.extModels.notice')"
      type="info"
      :closable="false"
      class="mb-6"
      show-icon
    />

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <el-icon class="animate-spin text-blue-500 text-3xl"><Loading /></el-icon>
    </div>

    <!-- Model cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <el-card
        v-for="model in configs"
        :key="model.id"
        class="hover:shadow-md transition-shadow"
        shadow="hover"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-gray-900 truncate">{{ model.model_name }}</div>
            <div class="text-sm text-gray-500 mt-1 capitalize">
              {{ t('admin.extModels.provider') }}: {{ model.provider || guessProvider(model.model_name) }}
            </div>
          </div>
          <el-tag
            :type="model.enabled ? 'success' : 'info'"
            size="small"
            class="ml-2 shrink-0"
          >
            {{ model.enabled ? t('admin.extModels.enabled') : t('admin.extModels.disabled') }}
          </el-tag>
        </div>
        <div class="mt-4">
          <el-button size="small" @click="openDialog(model)">
            {{ t('admin.extModels.configure') }}
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- Configure dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="t('admin.extModels.configure') + ': ' + (editingModel?.model_name ?? '')"
      width="520px"
      destroy-on-close
    >
      <div v-if="editingModel" class="space-y-4">
        <!-- Quick fill buttons -->
        <div>
          <div class="text-sm text-gray-600 mb-2">{{ t('admin.extModels.quickFill') }}</div>
          <div class="flex gap-2">
            <el-button size="small" @click="fillTemplate('anthropic')">Anthropic</el-button>
            <el-button size="small" @click="fillTemplate('openai')">OpenAI</el-button>
          </div>
        </div>

        <!-- Auth header input -->
        <el-form-item :label="t('admin.extModels.authHeader')" label-position="top">
          <el-input
            v-model="editAuthHeader"
            type="textarea"
            :rows="4"
            :placeholder="t('admin.extModels.authHeaderPlaceholder')"
            show-password
          />
        </el-form-item>

        <!-- Enabled switch -->
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-700">{{ t('admin.extModels.enabledSwitch') }}</span>
          <el-switch v-model="editEnabled" />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="dialogVisible = false">{{ t('admin.extModels.cancel') }}</el-button>
          <el-button type="primary" :loading="saving" @click="saveConfig">
            {{ t('admin.extModels.save') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import api from '../api/index'

const { t } = useI18n()

interface LLMConfig {
  id: number
  model_name: string
  api_endpoint: string
  auth_header: string
  type: number
  enabled: boolean
  provider: string
}

const loading = ref(false)
const saving = ref(false)
const configs = ref<LLMConfig[]>([])
const dialogVisible = ref(false)
const editingModel = ref<LLMConfig | null>(null)
const editAuthHeader = ref('')
const editEnabled = ref(false)

const ANTHROPIC_TEMPLATE = JSON.stringify({ 'x-api-key': '', 'anthropic-version': '2023-06-01' })
const OPENAI_TEMPLATE = JSON.stringify({ Authorization: 'Bearer ' })

function guessProvider(modelName: string): string {
  if (modelName.includes('claude')) return 'anthropic'
  if (modelName.includes('gpt') || modelName.includes('o1') || modelName.includes('o3')) return 'openai'
  return 'unknown'
}

function fillTemplate(type: 'anthropic' | 'openai') {
  editAuthHeader.value = type === 'anthropic' ? ANTHROPIC_TEMPLATE : OPENAI_TEMPLATE
}

function openDialog(model: LLMConfig) {
  editingModel.value = model
  editAuthHeader.value = model.auth_header || ''
  editEnabled.value = model.enabled
  dialogVisible.value = true
}

async function loadConfigs() {
  loading.value = true
  try {
    const res = await api.get<{ data: LLMConfig[] }>('/api/v1/admin/llm_configs')
    configs.value = res.data.data ?? []
  } catch (err) {
    ElMessage.error('Failed to load configs')
  } finally {
    loading.value = false
  }
}

async function saveConfig() {
  if (!editingModel.value) return
  saving.value = true
  try {
    await api.put(`/api/v1/admin/llm_configs/${editingModel.value.id}`, {
      auth_header: editAuthHeader.value,
      enabled: editEnabled.value,
    })
    ElMessage.success(t('admin.extModels.saveSuccess'))
    dialogVisible.value = false
    await loadConfigs()
  } catch (err) {
    ElMessage.error('Failed to save config')
  } finally {
    saving.value = false
  }
}

onMounted(loadConfigs)
</script>
