<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('apikeys.title') }}</h1>
        <p class="text-gray-500 mt-1">{{ t('apikeys.subtitle') }}</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
        {{ t('apikeys.create') }}
      </el-button>
    </div>

    <!-- New token alert -->
    <el-alert
      v-if="newToken"
      type="success"
      class="mb-6"
      :closable="false"
    >
      <template #title>
        <span class="font-medium">{{ t('apikeys.createSuccess') }}</span>
      </template>
      <div class="mt-2">
        <p class="text-sm text-amber-700 mb-2">{{ t('apikeys.tokenVisible') }}</p>
        <div class="flex items-center gap-2 bg-amber-50 rounded-lg p-3 font-mono text-sm break-all">
          <span class="flex-1">{{ newToken }}</span>
          <el-button size="small" text @click="copyText(newToken!)">
            <el-icon><CopyDocument /></el-icon>
          </el-button>
        </div>
        <el-button size="small" class="mt-2" @click="newToken = null">{{ t('apikeys.confirm') }}</el-button>
      </div>
    </el-alert>

    <!-- Keys table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center py-16">
        <el-icon class="animate-spin text-blue-500 text-2xl"><Loading /></el-icon>
      </div>

      <div v-else-if="tokens.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-400">
        <el-icon class="text-5xl mb-3 text-gray-200"><Key /></el-icon>
        <p class="mb-4">{{ t('apikeys.noKeys') }}</p>
        <el-button type="primary" @click="showCreateDialog = true">{{ t('apikeys.createFirst') }}</el-button>
      </div>

      <el-table v-else :data="tokens" style="width: 100%">
        <el-table-column :label="t('apikeys.name')" prop="token_name" min-width="160">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-icon class="text-blue-400"><Key /></el-icon>
              <span class="font-medium">{{ row.token_name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('apikeys.token')" min-width="200">
          <template #default="{ row }">
            <div class="flex items-center gap-2 font-mono text-sm text-gray-500">
              <span>{{ maskToken(row.token) }}</span>
              <el-button size="small" text @click="copyText(row.token)">
                <el-icon><CopyDocument /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="t('apikeys.createdAt')" min-width="160">
          <template #default="{ row }">
            <span class="text-sm text-gray-500">{{ formatDate(row.created_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('apikeys.actions')" width="120" align="right">
          <template #default="{ row }">
            <el-popconfirm
              :title="t('apikeys.deleteConfirm')"
              :confirm-button-text="t('apikeys.confirm')"
              :cancel-button-text="t('apikeys.cancel')"
              @confirm="deleteKey(row)"
            >
              <template #reference>
                <el-button size="small" type="danger" text>
                  <el-icon><Delete /></el-icon>
                  {{ t('apikeys.delete') }}
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Code example -->
    <div class="mt-6 bg-white rounded-xl border border-gray-200 p-5">
      <h3 class="font-semibold text-gray-800 mb-3">{{ t('apikeys.codeExample') }}</h3>
      <el-tabs>
        <el-tab-pane label="Python">
          <pre class="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed">{{ pythonExample }}</pre>
        </el-tab-pane>
        <el-tab-pane label="cURL">
          <pre class="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed">{{ curlExample }}</pre>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- API Tester -->
    <div class="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 class="font-semibold text-gray-800">{{ t('apikeys.testerTitle') }}</h3>
          <p class="text-xs text-gray-400 mt-0.5">{{ t('apikeys.testerSubtitle') }}</p>
        </div>
        <el-button text size="small" @click="testerOpen = !testerOpen">
          {{ testerOpen ? t('apikeys.testerHide') : t('apikeys.testerShow') }}
        </el-button>
      </div>

      <div v-if="testerOpen" class="p-5 space-y-4">
        <!-- Config row -->
        <!-- API source toggle -->
        <div class="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
          <el-radio-group v-model="tester.mode" size="small" @change="onModeChange">
            <el-radio-button value="platform">{{ t('apikeys.testerModePlatform') }}</el-radio-button>
            <el-radio-button value="external" :disabled="!externalApiConfig.enabled">
              {{ externalApiConfig.enabled ? externalApiConfig.name || 'External' : t('apikeys.testerModeExternalOff') }}
            </el-radio-button>
            <el-radio-button value="custom">{{ t('apikeys.testerModeCustom') }}</el-radio-button>
          </el-radio-group>
          <span v-if="tester.mode === 'platform'" class="text-xs text-gray-400 ml-2">
            {{ t('apikeys.testerModePlatformTip') }}
          </span>
        </div>

        <div class="flex flex-wrap gap-3 items-end">
          <!-- Key selector (platform mode) / api key input (other modes) -->
          <div class="flex-1 min-w-44">
            <p class="text-xs text-gray-500 mb-1">
              {{ tester.mode === 'platform' ? t('apikeys.testerSelectKey') : t('apikeys.testerApiKey') }}
            </p>
            <el-select v-if="tester.mode === 'platform'" v-model="tester.tokenValue" class="w-full" :placeholder="t('apikeys.testerSelectKeyPlaceholder')" @change="onTokenChange">
              <el-option v-for="tk in tokens" :key="tk.token" :label="tk.name || tk.token_name" :value="tk.token" />
            </el-select>
            <el-input v-else v-model="tester.apiKey" type="password" show-password :placeholder="t('apikeys.apiKeyPlaceholder')" />
          </div>

          <!-- Base URL (external/custom) -->
          <div v-if="tester.mode !== 'platform'" class="flex-1 min-w-52">
            <p class="text-xs text-gray-500 mb-1">Base URL</p>
            <el-input v-model="tester.baseUrl" placeholder="https://api.openai.com/v1" :readonly="tester.mode === 'external'" />
          </div>

          <!-- Model -->
          <div class="flex-1 min-w-40">
            <p class="text-xs text-gray-500 mb-1">{{ t('apikeys.testerModel') }}</p>
            <el-select
              v-if="tester.mode === 'platform'"
              v-model="tester.model"
              filterable
              :loading="loadingPlatformModels"
              :placeholder="t('apikeys.testerModelPlaceholder')"
              class="w-full"
              @focus="fetchPlatformModels"
            >
              <el-option
                v-for="m in platformModels"
                :key="m.id"
                :label="m.id"
                :value="m.id"
              >
                <span>{{ m.id }}</span>
                <span class="text-xs text-gray-400 ml-2">{{ m.owned_by }}</span>
              </el-option>
            </el-select>
            <el-input v-else v-model="tester.model" placeholder="gpt-4o" />
          </div>
        </div>

        <!-- Chat messages -->
        <div
          ref="testerMessagesEl"
          class="bg-gray-50 rounded-xl p-4 space-y-3 overflow-y-auto"
          style="min-height:160px; max-height:320px"
        >
          <div v-if="testerMessages.length === 0" class="flex items-center justify-center h-24 text-gray-400 text-sm">
            {{ t('apikeys.testerEmpty') }}
          </div>
          <template v-for="(msg, i) in testerMessages" :key="i">
            <div v-if="msg.role === 'user'" class="flex justify-end">
              <div class="bg-blue-500 text-white text-sm rounded-2xl rounded-tr-sm px-4 py-2 max-w-[75%] whitespace-pre-wrap">
                {{ msg.content }}
              </div>
            </div>
            <div v-else class="flex justify-start gap-2">
              <div class="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0 mt-0.5">AI</div>
              <div class="bg-white border border-gray-200 text-sm rounded-2xl rounded-tl-sm px-4 py-2 max-w-[75%] whitespace-pre-wrap" :class="msg._error ? 'border-red-200 text-red-500' : ''">
                <span v-if="msg.content">{{ msg.content }}</span>
                <span v-else class="text-gray-300 italic">{{ t('models.thinking') }}</span>
              </div>
            </div>
          </template>
        </div>

        <!-- Input -->
        <div class="flex gap-2">
          <el-input
            v-model="tester.input"
            :placeholder="t('apikeys.testerInputPlaceholder')"
            :disabled="testerLoading"
            @keydown.enter.exact.prevent="sendTesterMessage"
            @keydown.shift.enter="() => {}"
            class="flex-1"
          />
          <el-button
            type="primary"
            :loading="testerLoading"
            :disabled="!tester.input.trim() || !tester.model || (tester.mode === 'platform' ? !tester.tokenValue : !tester.apiKey)"
            @click="sendTesterMessage"
          >
            {{ t('models.send') }}
          </el-button>
          <el-button text @click="testerMessages = []" :icon="Delete" />
        </div>

        <p v-if="testerHintMsg" class="text-xs text-amber-500">{{ testerHintMsg }}</p>
      </div>
    </div>

    <!-- Create dialog -->
    <el-dialog v-model="showCreateDialog" :title="t('apikeys.create')" width="400px">
      <el-form :model="createForm" label-position="top">
        <el-form-item :label="t('apikeys.name')">
          <el-input
            v-model="createForm.name"
            :placeholder="t('apikeys.namePlaceholder')"
            @keyup.enter="handleCreate"
          />
        </el-form-item>
        <el-form-item :label="t('apikeys.allowedModels')">
          <el-select
            v-model="createForm.allowedModels"
            multiple
            filterable
            clearable
            :placeholder="t('apikeys.allModelsAllowed')"
            class="w-full"
          >
            <el-option v-for="m in availableModels" :key="m" :label="m" :value="m" />
          </el-select>
          <p class="text-xs text-gray-400 mt-1">{{ t('apikeys.allowedModelsHint') }}</p>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">{{ t('apikeys.cancel') }}</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">
          {{ t('apikeys.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { listTokens, createToken, deleteToken } from '../api/tokens'
import type { Token } from '../api/tokens'
import { useAuthStore } from '../stores/auth'

const { t } = useI18n()
const auth = useAuthStore()

const tokens = ref<Token[]>([])
const loading = ref(false)
const creating = ref(false)
const showCreateDialog = ref(false)
const newToken = ref<string | null>(null)

const createForm = reactive({ name: '', allowedModels: [] as string[] })
const availableModels = ref<string[]>([])

async function fetchAvailableModels() {
  try {
    const res = await api.get('/public/llm_configs')
    availableModels.value = (res.data?.data ?? []).filter((m: any) => m.enabled).map((m: any) => m.model_name)
  } catch { /* ignore */ }
}

const AIGATEWAY_BASE = `${window.location.protocol}//${window.location.host}`

const pythonExample = computed(() => `from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="${AIGATEWAY_BASE}/v1"
)

response = client.chat.completions.create(
    model="your-model-id",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)`)

const curlExample = computed(() => `curl ${AIGATEWAY_BASE}/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "your-model-id",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`)

onMounted(() => {
  fetchTokens()
  fetchAvailableModels()
})

async function fetchTokens() {
  if (!auth.username) return
  loading.value = true
  try {
    const res = await listTokens(auth.username, 'aigateway')
    // API returns null when no tokens exist
    tokens.value = res.data?.data ?? []
  } catch {
    // non-critical — just show empty
    tokens.value = []
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (!createForm.name.trim()) return
  creating.value = true
  try {
    const res = await createToken('aigateway', createForm.name.trim(), undefined, createForm.allowedModels)
    const data = res.data?.data ?? (res.data as any)
    const token = data?.token
    if (token) {
      newToken.value = token
    } else {
      ElMessage.warning('Key created but token not returned — check existing keys')
    }
    createForm.name = ''
    createForm.allowedModels = []
    showCreateDialog.value = false
    await fetchTokens()
  } catch (e: any) {
    const msg = e?.response?.data?.msg || t('common.error')
    ElMessage.error(msg)
  } finally {
    creating.value = false
  }
}

async function deleteKey(row: Token) {
  try {
    await deleteToken('aigateway', row.token_name)
    ElMessage.success(t('apikeys.deleteSuccess'))
    await fetchTokens()
  } catch {
    ElMessage.error(t('common.error'))
  }
}

function maskToken(token: string) {
  if (!token) return '—'
  return token.slice(0, 8) + '••••••••' + token.slice(-4)
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString()
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success(t('apikeys.copySuccess'))
  })
}

// ── API Tester ──────────────────────────────────────────────────────
// Key is per-user — prevents one user's API keys from leaking to another's session
const EXTERNAL_KEY = computed(() =>
  auth.username ? `external_api_config_${auth.username}` : 'external_api_config_guest'
)
const externalApiConfig = reactive(
  JSON.parse(localStorage.getItem(EXTERNAL_KEY.value) || '{"enabled":false,"name":"","baseUrl":"","apiKey":"","manualModels":""}')
)

const testerOpen = ref(false)
const testerLoading = ref(false)
const testerMessagesEl = ref<HTMLElement | null>(null)
const testerMessages = ref<Array<{ role: string; content: string; _error?: boolean }>>([])

// Platform model list for dropdown
const platformModels = ref<Array<{ id: string; owned_by: string }>>([])
const loadingPlatformModels = ref(false)

async function fetchPlatformModels() {
  if (platformModels.value.length > 0 || !tester.tokenValue) return
  loadingPlatformModels.value = true
  try {
    const res = await fetch('/v1/models', {
      headers: { Authorization: `Bearer ${tester.tokenValue}` },
    })
    if (res.ok) {
      const data = await res.json()
      platformModels.value = data.data ?? []
      // Auto-select first model if none selected
      if (!tester.model && platformModels.value.length > 0) {
        tester.model = platformModels.value[0].id
      }
    }
  } catch { /* ignore */ } finally {
    loadingPlatformModels.value = false
  }
}

const tester = reactive({
  mode: 'platform' as 'platform' | 'external' | 'custom',
  tokenValue: '',
  apiKey: externalApiConfig.apiKey || '',
  baseUrl: externalApiConfig.baseUrl || '',
  model: '',
  input: '',
})

const testerHintMsg = computed(() => {
  if (tester.mode === 'platform' && (!tester.tokenValue || !tester.model))
    return t('apikeys.testerHint')
  if (tester.mode !== 'platform' && (!tester.apiKey || !tester.model))
    return t('apikeys.testerHint')
  return ''
})

function onTokenChange() {
  platformModels.value = []  // reset so it re-fetches with new token
  tester.model = ''
  nextTick(() => fetchPlatformModels())
}

function onModeChange(mode: string) {
  platformModels.value = []
  if (mode === 'external' && externalApiConfig.enabled) {
    tester.apiKey = externalApiConfig.apiKey
    tester.baseUrl = externalApiConfig.baseUrl
    // Pre-fill first manual model if any
    const first = externalApiConfig.manualModels?.split(',')[0]?.trim()
    if (first && !tester.model) tester.model = first
  } else if (mode === 'platform') {
    tester.baseUrl = ''
  }
}

function isAnthropicUrl(url: string) { return url.includes('anthropic.com') }

function testerHeaders(baseUrl: string, apiKey: string): Record<string, string> {
  if (isAnthropicUrl(baseUrl)) {
    return {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    }
  }
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }
}

async function sendTesterMessage() {
  const text = tester.input.trim()
  if (!text || !tester.model) return
  if (tester.mode === 'platform' && !tester.tokenValue) return
  if (tester.mode !== 'platform' && !tester.apiKey) return

  tester.input = ''
  testerMessages.value.push({ role: 'user', content: text })
  const aiMsg = reactive({ role: 'assistant', content: '', _error: false })
  testerMessages.value.push(aiMsg)
  testerLoading.value = true
  await scrollTester()

  try {
    let url: string
    let headers: Record<string, string>
    let body: object

    const history = testerMessages.value.filter(m => !m._error).slice(0, -1)
      .map(m => ({ role: m.role, content: m.content }))

    if (tester.mode === 'platform') {
      // Platform: aigateway is proxied at /v1 → port 8094
      url = '/v1/chat/completions'
      headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tester.tokenValue}` }
      body = { model: tester.model, messages: history, stream: true }
    } else {
      // External or Custom
      const base = tester.baseUrl.replace(/\/$/, '')
      const isAnthropic = isAnthropicUrl(base)
      url = isAnthropic ? `${base}/messages` : `${base}/chat/completions`
      headers = testerHeaders(base, tester.apiKey)
      body = isAnthropic
        ? { model: tester.model, messages: history.filter(m => m.role !== 'system'), stream: true, max_tokens: 2048 }
        : { model: tester.model, messages: history, stream: true }
    }

    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      aiMsg.content = `Error ${res.status}: ${err.error?.message || err.message || err.msg || res.statusText}`
      aiMsg._error = true
      return
    }

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    const isAnthropic = tester.mode !== 'platform' && isAnthropicUrl(tester.baseUrl)
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      for (const line of decoder.decode(value, { stream: true }).split('\n')) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ') || trimmed === 'data: [DONE]') continue
        try {
          const json = JSON.parse(trimmed.slice(6))
          const chunk = json.choices?.[0]?.delta?.content
            ?? json.delta?.text
            ?? ''
          if (chunk) { aiMsg.content += chunk; await scrollTester() }
        } catch { /* skip */ }
      }
    }
    
  } catch (e: any) {
    aiMsg.content = e.message
    aiMsg._error = true
  } finally {
    testerLoading.value = false
  }
}

async function scrollTester() {
  await nextTick()
  if (testerMessagesEl.value) testerMessagesEl.value.scrollTop = testerMessagesEl.value.scrollHeight
}
</script>
