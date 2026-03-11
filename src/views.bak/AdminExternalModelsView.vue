<template>
  <div class="p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-6 flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('admin.extModels.title') }}</h1>
        <p class="text-gray-500 mt-1 text-sm">{{ t('admin.extModels.subtitle') }}</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openAddDialog">
        {{ t('admin.extModels.addModel') }}
      </el-button>
    </div>

    <!-- Config tip -->
    <el-alert type="success" :closable="false" class="mb-6" show-icon>
      <template #title>
        <span class="font-medium">{{ t('admin.extModels.configTip') }}</span>
      </template>
      <div class="mt-1 text-xs font-mono text-gray-600 whitespace-pre">{{ configSnippet }}</div>
    </el-alert>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <el-icon class="animate-spin text-blue-500 text-3xl"><Loading /></el-icon>
    </div>

    <!-- Empty state -->
    <el-empty
      v-else-if="configs.length === 0"
      :description="t('admin.extModels.noModels')"
      class="py-16"
    >
      <el-button type="primary" :icon="Plus" @click="openAddDialog">
        {{ t('admin.extModels.addModel') }}
      </el-button>
    </el-empty>

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
            <div class="text-sm text-gray-500 mt-0.5 capitalize">
              {{ t('admin.extModels.provider') }}: {{ model.provider || guessProvider(model.model_name) }}
            </div>
            <div class="text-xs text-gray-400 mt-0.5 font-mono truncate">{{ model.api_endpoint }}</div>
          </div>
          <el-tag
            :type="model.enabled ? 'success' : 'info'"
            size="small"
            class="ml-2 shrink-0"
          >
            {{ model.enabled ? t('admin.extModels.enabled') : t('admin.extModels.disabled') }}
          </el-tag>
        </div>
        <div class="mt-4 flex gap-2">
          <el-button size="small" @click="openEditDialog(model)">
            {{ t('admin.extModels.configure') }}
          </el-button>
          <el-button size="small" type="danger" plain @click="deleteModel(model)">
            {{ t('admin.extModels.delete') }}
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- Add / Edit dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isAdding ? t('admin.extModels.addModel') : (t('admin.extModels.configure') + ': ' + (editingModel?.model_name ?? ''))"
      width="540px"
      destroy-on-close
    >
      <div class="space-y-4">
        <!-- Quick presets (only for add) -->
        <div v-if="isAdding">
          <div class="text-sm text-gray-600 mb-2">{{ t('admin.extModels.quickFill') }}</div>
          <div class="flex flex-wrap gap-2">
            <el-button
              v-for="preset in PROVIDER_PRESETS"
              :key="preset.name"
              size="small"
              :type="form.provider === preset.provider ? 'primary' : 'default'"
              @click="applyPreset(preset)"
            >{{ preset.name }}</el-button>
          </div>
        </div>

        <!-- Fields -->
        <el-form :model="form" label-position="top" class="space-y-0">
          <el-form-item v-if="isAdding" :label="t('admin.extModels.modelName')" required>
            <el-input v-model="form.model_name" placeholder="claude-opus-4-5" />
          </el-form-item>

          <el-form-item v-if="isAdding" :label="t('admin.extModels.endpoint')">
            <el-input v-model="form.api_endpoint" placeholder="https://api.openai.com/v1" />
          </el-form-item>

          <el-form-item v-if="isAdding" :label="t('admin.extModels.providerLabel')">
            <el-input v-model="form.provider" placeholder="openai" />
          </el-form-item>

          <el-form-item :label="t('admin.extModels.authHeader')">
            <el-input
              v-model="form.auth_header"
              type="textarea"
              :rows="4"
              :placeholder="t('admin.extModels.authHeaderPlaceholder')"
            />
            <p class="text-xs text-gray-400 mt-1">{{ t('admin.extModels.authHeaderHint') }}</p>
          </el-form-item>

          <div class="flex items-center gap-3 pt-1">
            <span class="text-sm text-gray-700">{{ t('admin.extModels.enabledSwitch') }}</span>
            <el-switch v-model="form.enabled" />
          </div>
        </el-form>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="dialogVisible = false">{{ t('admin.extModels.cancel') }}</el-button>
          <el-button type="primary" :loading="saving" @click="saveForm">
            {{ t('admin.extModels.save') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, Plus } from '@element-plus/icons-vue'
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

interface Preset {
  name: string
  provider: string
  endpoint: string
  authTemplate: string
}

const configSnippet = `[aigateway]
anthropic_api_key = "sk-ant-api03-..."
openai_api_key    = "sk-..."
openrouter_api_key = "sk-or-..."
deepseek_api_key  = "sk-..."`

const PROVIDER_PRESETS: Preset[] = [
  {
    name: 'OpenAI Chat',
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    authTemplate: JSON.stringify({ Authorization: 'Bearer YOUR_API_KEY' }),
  },
  {
    name: 'Anthropic',
    provider: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    authTemplate: JSON.stringify({ 'x-api-key': 'YOUR_API_KEY', 'anthropic-version': '2023-06-01' }),
  },
  {
    name: 'OpenRouter',
    provider: 'openrouter',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    authTemplate: JSON.stringify({ Authorization: 'Bearer YOUR_API_KEY' }),
  },
  {
    name: 'DeepSeek',
    provider: 'deepseek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    authTemplate: JSON.stringify({ Authorization: 'Bearer YOUR_API_KEY' }),
  },
]

const loading = ref(false)
const saving = ref(false)
const configs = ref<LLMConfig[]>([])
const dialogVisible = ref(false)
const isAdding = ref(false)
const editingModel = ref<LLMConfig | null>(null)

const form = reactive({
  model_name: '',
  api_endpoint: '',
  provider: '',
  auth_header: '',
  enabled: true,
})

function resetForm() {
  form.model_name = ''
  form.api_endpoint = ''
  form.provider = ''
  form.auth_header = ''
  form.enabled = true
}

function guessProvider(modelName: string): string {
  if (modelName.includes('claude')) return 'anthropic'
  if (modelName.includes('gpt') || modelName.includes('o1') || modelName.includes('o3')) return 'openai'
  if (modelName.includes('deepseek')) return 'deepseek'
  return 'unknown'
}

function applyPreset(preset: Preset) {
  form.provider = preset.provider
  form.api_endpoint = preset.endpoint
  form.auth_header = preset.authTemplate
}

function openAddDialog() {
  isAdding.value = true
  editingModel.value = null
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(model: LLMConfig) {
  isAdding.value = false
  editingModel.value = model
  form.auth_header = model.auth_header || ''
  form.enabled = model.enabled
  dialogVisible.value = true
}

async function deleteModel(model: LLMConfig) {
  try {
    await ElMessageBox.confirm(
      t('admin.extModels.deleteConfirm', { name: model.model_name }),
      t('admin.extModels.delete'),
      { type: 'warning', confirmButtonText: t('admin.extModels.delete'), cancelButtonText: t('admin.extModels.cancel') }
    )
  } catch {
    return
  }
  try {
    await api.delete(`/api/v1/admin/llm_configs/${model.id}`)
    ElMessage.success(t('admin.extModels.deleteSuccess'))
    await loadConfigs()
  } catch {
    ElMessage.error('Failed to delete model')
  }
}

async function saveForm() {
  saving.value = true
  try {
    if (isAdding.value) {
      if (!form.model_name || !form.api_endpoint) {
        ElMessage.warning(t('admin.extModels.requiredFields'))
        return
      }
      await api.post('/api/v1/admin/llm_configs', {
        model_name: form.model_name,
        api_endpoint: form.api_endpoint,
        provider: form.provider,
        auth_header: form.auth_header,
        enabled: form.enabled,
      })
      ElMessage.success(t('admin.extModels.addSuccess'))
    } else {
      if (!editingModel.value) return
      await api.put(`/api/v1/admin/llm_configs/${editingModel.value.id}`, {
        auth_header: form.auth_header,
        enabled: form.enabled,
      })
      ElMessage.success(t('admin.extModels.saveSuccess'))
    }
    dialogVisible.value = false
    await loadConfigs()
  } catch {
    ElMessage.error('Failed to save')
  } finally {
    saving.value = false
  }
}

async function loadConfigs() {
  loading.value = true
  try {
    const res = await api.get<{ data: LLMConfig[] }>('/api/v1/admin/llm_configs')
    configs.value = res.data.data ?? []
  } catch {
    ElMessage.error('Failed to load configs')
  } finally {
    loading.value = false
  }
}

onMounted(loadConfigs)
</script>
