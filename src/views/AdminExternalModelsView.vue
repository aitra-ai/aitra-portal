<template>
  <div class="p-6 max-w-6xl mx-auto">
    <el-tabs v-model="activeTab">
      <!-- ── Tab 1: External Models ───────────────────────────────── -->
      <el-tab-pane :label="t('admin.extModels.title')" name="models">
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
      </el-tab-pane>

      <!-- ── Tab 2: Billing Config ────────────────────────────────── -->
      <el-tab-pane :label="t('billing.title')" name="billing">
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ t('billing.title') }}</h1>
          </div>
          <el-button type="primary" :icon="Plus" @click="openAddBillingDialog">
            {{ t('billing.addConfig') }}
          </el-button>
        </div>

        <!-- Billing table -->
        <div v-if="billingLoading" class="flex justify-center py-16">
          <el-icon class="animate-spin text-blue-500 text-3xl"><Loading /></el-icon>
        </div>
        <el-empty
          v-else-if="billingConfigs.length === 0"
          :description="t('billing.noConfig')"
          class="py-16"
        >
          <el-button type="primary" :icon="Plus" @click="openAddBillingDialog">
            {{ t('billing.addConfig') }}
          </el-button>
        </el-empty>
        <el-table v-else :data="billingConfigs" stripe class="w-full">
          <el-table-column prop="model_id" :label="t('billing.modelId')" min-width="180">
            <template #default="{ row }">
              <span class="font-mono text-sm">{{ row.model_id }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="provider" :label="t('usage.provider')" width="130" />
          <el-table-column prop="price_input" :label="t('billing.priceInput')" width="190" align="right">
            <template #default="{ row }">
              <span class="font-mono text-sm">${{ row.price_input }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="price_output" :label="t('billing.priceOutput')" width="190" align="right">
            <template #default="{ row }">
              <span class="font-mono text-sm">${{ row.price_output }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('apikeys.actions')" width="140" align="center">
            <template #default="{ row }">
              <el-button size="small" @click="openEditBillingDialog(row)">{{ t('billing.editConfig') }}</el-button>
              <el-button size="small" type="danger" plain @click="deleteBillingConfig(row)">{{ t('admin.extModels.delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- Add/Edit billing dialog -->
        <el-dialog
          v-model="billingDialogVisible"
          :title="isAddingBilling ? t('billing.addConfig') : t('billing.editConfig')"
          width="480px"
          destroy-on-close
        >
          <el-form :model="billingForm" label-position="top">
            <el-form-item v-if="isAddingBilling" :label="t('billing.modelId')" required>
              <el-select
                v-model="billingForm.model_id"
                filterable
                allow-create
                :placeholder="t('billing.modelId')"
                class="w-full"
              >
                <el-option
                  v-for="m in configs"
                  :key="m.model_name"
                  :label="m.model_name"
                  :value="m.model_name"
                />
              </el-select>
            </el-form-item>
            <el-form-item v-if="isAddingBilling" :label="t('usage.provider')" required>
              <el-input v-model="billingForm.provider" placeholder="anthropic" />
            </el-form-item>
            <el-form-item :label="t('billing.priceInput')" required>
              <el-input-number
                v-model="billingForm.price_input"
                :min="0"
                :precision="6"
                :step="0.1"
                class="w-full"
              />
            </el-form-item>
            <el-form-item :label="t('billing.priceOutput')" required>
              <el-input-number
                v-model="billingForm.price_output"
                :min="0"
                :precision="6"
                :step="0.1"
                class="w-full"
              />
            </el-form-item>
          </el-form>
          <template #footer>
            <div class="flex justify-end gap-2">
              <el-button @click="billingDialogVisible = false">{{ t('admin.extModels.cancel') }}</el-button>
              <el-button type="primary" :loading="billingSaving" @click="saveBillingForm">
                {{ t('admin.extModels.save') }}
              </el-button>
            </div>
          </template>
        </el-dialog>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, Plus } from '@element-plus/icons-vue'
import api from '../api/index'

const { t } = useI18n()

const activeTab = ref('models')

// ── Types ──────────────────────────────────────────────────────────
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

interface BillingConfig {
  id: number
  model_id: string
  provider: string
  price_input: number
  price_output: number
  created_at: string
  updated_at: string
}

// ── Constants ──────────────────────────────────────────────────────
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

// ── External Models state ──────────────────────────────────────────
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

// ── Billing Config state ───────────────────────────────────────────
const billingLoading = ref(false)
const billingSaving = ref(false)
const billingConfigs = ref<BillingConfig[]>([])
const billingDialogVisible = ref(false)
const isAddingBilling = ref(false)
const editingBilling = ref<BillingConfig | null>(null)

const billingForm = reactive({
  model_id: '',
  provider: '',
  price_input: 0,
  price_output: 0,
})

function resetBillingForm() {
  billingForm.model_id = ''
  billingForm.provider = ''
  billingForm.price_input = 0
  billingForm.price_output = 0
}

function openAddBillingDialog() {
  isAddingBilling.value = true
  editingBilling.value = null
  resetBillingForm()
  billingDialogVisible.value = true
}

function openEditBillingDialog(config: BillingConfig) {
  isAddingBilling.value = false
  editingBilling.value = config
  billingForm.model_id = config.model_id
  billingForm.provider = config.provider
  billingForm.price_input = config.price_input
  billingForm.price_output = config.price_output
  billingDialogVisible.value = true
}

async function deleteBillingConfig(config: BillingConfig) {
  try {
    await ElMessageBox.confirm(
      `${t('billing.confirmDelete')} ${config.model_id}?`,
      t('admin.extModels.delete'),
      { type: 'warning', confirmButtonText: t('admin.extModels.delete'), cancelButtonText: t('admin.extModels.cancel') }
    )
  } catch {
    return
  }
  try {
    await api.delete(`/api/v1/admin/billing/${config.id}`)
    ElMessage.success(t('billing.deleteSuccess'))
    await loadBillingConfigs()
  } catch {
    ElMessage.error('Failed to delete billing config')
  }
}

async function saveBillingForm() {
  billingSaving.value = true
  try {
    if (isAddingBilling.value) {
      if (!billingForm.model_id || !billingForm.provider) {
        ElMessage.warning(t('admin.extModels.requiredFields'))
        return
      }
      await api.post('/api/v1/admin/billing', {
        model_id: billingForm.model_id,
        provider: billingForm.provider,
        price_input: billingForm.price_input,
        price_output: billingForm.price_output,
      })
      ElMessage.success(t('billing.saveSuccess'))
    } else {
      if (!editingBilling.value) return
      await api.put(`/api/v1/admin/billing/${editingBilling.value.id}`, {
        price_input: billingForm.price_input,
        price_output: billingForm.price_output,
      })
      ElMessage.success(t('billing.saveSuccess'))
    }
    billingDialogVisible.value = false
    await loadBillingConfigs()
  } catch {
    ElMessage.error('Failed to save billing config')
  } finally {
    billingSaving.value = false
  }
}

async function loadBillingConfigs() {
  billingLoading.value = true
  try {
    const res = await api.get<{ data: BillingConfig[] }>('/api/v1/admin/billing')
    billingConfigs.value = res.data.data ?? []
  } catch {
    ElMessage.error('Failed to load billing configs')
  } finally {
    billingLoading.value = false
  }
}

onMounted(() => {
  loadConfigs()
  loadBillingConfigs()
})
</script>
