<template>
  <div class="flex h-full">
    <!-- Model List (left panel) -->
    <div v-if="!selectedModel" class="flex-1 p-6">
      <div class="flex items-start justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ t('models.title') }}</h1>
          <p class="text-gray-500 mt-1 text-sm">{{ t('models.subtitle') }}</p>
        </div>
        <el-button :icon="Setting" @click="showApiConfig = true" size="small">
          {{ externalApi.enabled ? t('models.externalApiActive') : t('models.connectApi') }}
          <el-badge v-if="externalApi.enabled" is-dot class="ml-1" />
        </el-button>
      </div>

      <!-- External API banner -->
      <el-alert
        v-if="externalApi.enabled"
        :title="t('models.externalApiBanner', { name: externalApi.name || externalApi.baseUrl })"
        type="success"
        :closable="false"
        class="mb-4"
        show-icon
      >
        <template #default>
          <el-button text size="small" @click="clearExternalApi">{{ t('models.disconnectApi') }}</el-button>
        </template>
      </el-alert>

      <div v-if="loadingModels" class="flex justify-center py-20">
        <el-icon class="animate-spin text-blue-500 text-3xl"><Loading /></el-icon>
      </div>

      <el-empty v-else-if="models.length === 0" :description="t('models.noModels')" class="py-16">
        <el-button type="primary" @click="showApiConfig = true">{{ t('models.connectApi') }}</el-button>
      </el-empty>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div
          v-for="model in models"
          :key="model.id"
          class="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
          @click="openPlayground(model)"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              :class="model._external ? 'bg-purple-50' : 'bg-blue-50'">
              <el-icon :class="model._external ? 'text-purple-500' : 'text-blue-500'" class="text-xl">
                <component :is="model._external ? 'Connection' : 'Cpu'" />
              </el-icon>
            </div>
            <el-tag size="small" :type="model._external ? 'warning' : 'success'">
              {{ model._external ? (externalApi.name || 'External') : (model.owned_by || 'platform') }}
            </el-tag>
          </div>
          <h3 class="font-semibold text-gray-900 mb-1 truncate text-sm">{{ model.id }}</h3>
          <p class="text-xs text-gray-400 mb-4">{{ model.object || 'language model' }}</p>
          <el-button size="small" type="primary" class="w-full">
            {{ t('models.tryIt') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Chat Playground -->
    <div v-else class="flex-1 flex flex-col bg-white">
      <!-- Header -->
      <div class="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-white">
        <el-button text @click="selectedModel = null" :icon="ArrowLeft">
          {{ t('models.backToList') }}
        </el-button>
        <div class="h-4 w-px bg-gray-300" />
        <el-icon :class="selectedModel._external ? 'text-purple-500' : 'text-blue-500'">
          <component :is="selectedModel._external ? 'Connection' : 'Cpu'" />
        </el-icon>
        <span class="font-semibold text-gray-800 text-sm truncate">{{ selectedModel.id }}</span>
        <el-tag v-if="selectedModel._external" size="small" type="warning" class="shrink-0">
          {{ externalApi.name || 'External' }}
        </el-tag>
        <el-button size="small" text class="ml-auto !text-gray-400" @click="clearChat" :icon="Delete">
          {{ t('models.clearChat') }}
        </el-button>
        <el-popover placement="bottom-end" :width="280" trigger="click">
          <template #reference>
            <el-button size="small" text :icon="Setting">{{ t('models.settings') }}</el-button>
          </template>
          <div class="space-y-4 p-1">
            <div>
              <div class="text-sm text-gray-600 mb-2">{{ t('models.systemPrompt') }}</div>
              <el-input v-model="systemPrompt" type="textarea" :rows="3" size="small" />
            </div>
            <div>
              <div class="text-sm text-gray-600 mb-1">{{ t('models.temperature') }}: {{ temperature }}</div>
              <el-slider v-model="temperature" :min="0" :max="2" :step="0.1" />
            </div>
            <div>
              <div class="text-sm text-gray-600 mb-1">{{ t('models.maxTokens') }}</div>
              <el-input-number v-model="maxTokens" :min="128" :max="8192" :step="128" size="small" class="w-full" />
            </div>
          </div>
        </el-popover>
      </div>

      <!-- Messages -->
      <div ref="messagesEl" class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <div v-if="messages.length === 0" class="flex items-center justify-center h-full">
          <div class="text-center text-gray-400">
            <el-icon class="text-5xl mb-3 text-gray-200"><ChatDotRound /></el-icon>
            <p class="text-sm">{{ t('models.subtitle') }}</p>
          </div>
        </div>
        <template v-for="(msg, i) in messages" :key="i">
          <div v-if="msg.role === 'user'" class="flex justify-end">
            <div class="chat-bubble-user text-sm leading-relaxed whitespace-pre-wrap">{{ msg.content }}</div>
          </div>
          <div v-else class="flex justify-start gap-3">
            <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
              <span class="text-white text-xs font-bold">AI</span>
            </div>
            <div class="chat-bubble-ai text-sm leading-relaxed whitespace-pre-wrap">
              <span v-if="msg.content">{{ msg.content }}</span>
              <span v-else class="text-gray-400 italic">{{ t('models.thinking') }}</span>
            </div>
          </div>
        </template>
      </div>

      <!-- Input -->
      <div class="px-6 py-4 border-t border-gray-200 bg-white">
        <div class="flex gap-3 items-end">
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="2"
            :autosize="{ minRows: 2, maxRows: 5 }"
            :placeholder="t('models.inputPlaceholder')"
            resize="none"
            @keydown.enter.exact.prevent="sendMessage"
            @keydown.shift.enter="() => {}"
            class="flex-1"
          />
          <el-button
            type="primary"
            :loading="streaming"
            :disabled="!inputText.trim()"
            @click="sendMessage"
          >
            <el-icon v-if="!streaming"><Promotion /></el-icon>
            {{ t('models.send') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- External API Config Dialog -->
    <el-dialog
      v-model="showApiConfig"
      :title="t('models.apiConfigTitle')"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="space-y-4">
        <!-- Quick presets -->
        <div>
          <p class="text-sm text-gray-600 mb-2">{{ t('models.quickConnect') }}</p>
          <div class="flex flex-wrap gap-2">
            <el-button
              v-for="preset in API_PRESETS"
              :key="preset.name"
              size="small"
              :type="apiForm.name === preset.name ? 'primary' : 'default'"
              @click="applyPreset(preset)"
            >{{ preset.name }}</el-button>
          </div>
        </div>

        <el-divider />

        <el-form :model="apiForm" label-position="top">
          <el-form-item :label="t('models.apiProvider')">
            <el-input v-model="apiForm.name" :placeholder="t('models.apiProviderPlaceholder')" />
          </el-form-item>

          <el-form-item :label="t('models.apiBaseUrl')">
            <el-input v-model="apiForm.baseUrl" placeholder="https://api.openai.com/v1" />
          </el-form-item>

          <el-form-item :label="t('models.apiKey')">
            <el-input v-model="apiForm.apiKey" type="password" show-password :placeholder="t('models.apiKeyPlaceholder')" />
            <p v-if="apiForm.name === 'Claude (Anthropic)'" class="text-xs text-gray-400 mt-1">
              {{ t('models.claudeTip') }}
            </p>
          </el-form-item>

          <el-form-item :label="t('models.manualModels')">
            <el-input
              v-model="apiForm.manualModels"
              type="textarea"
              :rows="3"
              :placeholder="t('models.manualModelsPlaceholder')"
            />
            <p class="text-xs text-gray-400 mt-1">{{ t('models.manualModelsTip') }}</p>
          </el-form-item>
        </el-form>

        <el-alert v-if="apiTestResult" :title="apiTestResult.msg" :type="apiTestResult.ok ? 'success' : 'error'" :closable="false" show-icon />
      </div>

      <template #footer>
        <el-button @click="showApiConfig = false">{{ t('apikeys.cancel') }}</el-button>
        <el-button :loading="testingApi" @click="testAndConnect">{{ t('models.testAndConnect') }}</el-button>
        <el-button type="primary" :loading="connectingApi" @click="saveApiConfig">{{ t('models.saveConnect') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Delete, Setting } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { listModels, chatCompletionsStream } from '../api/models'
import type { Model, ChatMessage } from '../api/models'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

// ── External API config ──────────────────────────────────────────────
interface ExternalApiConfig {
  enabled: boolean
  name: string
  baseUrl: string
  apiKey: string
  manualModels: string
}

const STORAGE_KEY = 'external_api_config'

const API_PRESETS = [
  { name: 'Claude (Anthropic)', baseUrl: 'https://api.anthropic.com/v1', models: 'claude-opus-4-5,claude-sonnet-4-6,claude-3-5-sonnet-20241022,claude-3-5-haiku-20241022,claude-3-opus-20240229' },
  { name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', models: 'anthropic/claude-3.5-sonnet,anthropic/claude-3-haiku,openai/gpt-4o,openai/gpt-4o-mini,google/gemini-flash-1.5' },
  { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', models: 'gpt-4o,gpt-4o-mini,gpt-3.5-turbo' },
  { name: 'Ollama', baseUrl: 'http://localhost:11434/v1', models: 'llama3.2,qwen2.5,mistral' },
  { name: 'LM Studio', baseUrl: 'http://localhost:1234/v1', models: '' },
]

function isAnthropic(baseUrl: string) {
  return baseUrl.includes('anthropic.com')
}

function buildHeaders(baseUrl: string, apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (isAnthropic(baseUrl)) {
    headers['x-api-key'] = apiKey
    headers['anthropic-version'] = '2023-06-01'
    headers['anthropic-dangerous-direct-browser-access'] = 'true'
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`
    headers['HTTP-Referer'] = window.location.origin
    headers['X-Title'] = 'aitra'
  }
  return headers
}

const externalApi = reactive<ExternalApiConfig>(
  JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"enabled":false,"name":"","baseUrl":"","apiKey":"","manualModels":""}')
)

const showApiConfig = ref(false)
const testingApi = ref(false)
const connectingApi = ref(false)
const apiTestResult = ref<{ ok: boolean; msg: string } | null>(null)

const apiForm = reactive({
  name: externalApi.name,
  baseUrl: externalApi.baseUrl,
  apiKey: externalApi.apiKey,
  manualModels: externalApi.manualModels,
})

function applyPreset(preset: typeof API_PRESETS[0]) {
  apiForm.name = preset.name
  apiForm.baseUrl = preset.baseUrl
  apiForm.manualModels = preset.models || ''
  apiForm.apiKey = ''
  apiTestResult.value = null
}

async function fetchExternalModels(baseUrl: string, apiKey: string): Promise<Model[]> {
  const res = await fetch(`${baseUrl}/models`, {
    headers: buildHeaders(baseUrl, apiKey),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  // Anthropic returns { data: [{id, display_name, ...}] }, OpenAI returns { data: [{id, ...}] }
  const rawList = data.data || []
  const list: Model[] = rawList.map((m: any) => ({
    id: m.id,
    object: m.object || 'model',
    created: m.created || 0,
    owned_by: m.owned_by || apiForm.name,
    _external: true,
  }))
  return list
}

function parseManualModels(raw: string, providerName: string): Model[] {
  return raw.split(',').map(s => s.trim()).filter(Boolean).map(id => ({
    id,
    object: 'model',
    created: 0,
    owned_by: providerName,
    _external: true,
  }))
}

async function testAndConnect() {
  testingApi.value = true
  apiTestResult.value = null
  try {
    const mods = await fetchExternalModels(apiForm.baseUrl, apiForm.apiKey)
    apiTestResult.value = { ok: true, msg: t('models.testSuccess', { count: mods.length }) }
  } catch (e: any) {
    apiTestResult.value = { ok: false, msg: e.message || t('common.error') }
  } finally {
    testingApi.value = false
  }
}

async function saveApiConfig() {
  connectingApi.value = true
  Object.assign(externalApi, {
    enabled: true,
    name: apiForm.name,
    baseUrl: apiForm.baseUrl,
    apiKey: apiForm.apiKey,
    manualModels: apiForm.manualModels,
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(externalApi))
  showApiConfig.value = false
  connectingApi.value = false
  await fetchModels()
  ElMessage.success(t('models.apiConnected'))
}

function clearExternalApi() {
  Object.assign(externalApi, { enabled: false, name: '', baseUrl: '', apiKey: '', manualModels: '' })
  localStorage.removeItem(STORAGE_KEY)
  fetchModels()
}

// ── Models & Chat ────────────────────────────────────────────────────
const models = ref<(Model & { _external?: boolean })[]>([])
const loadingModels = ref(false)
const selectedModel = ref<(Model & { _external?: boolean }) | null>(null)
const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const streaming = ref(false)
const messagesEl = ref<HTMLElement | null>(null)
const systemPrompt = ref('')
const temperature = ref(0.7)
const maxTokens = ref(2048)

onMounted(async () => {
  await fetchModels()
  // Pre-select model from query param (coming from Model Hub)
  const modelPath = route.query.model as string
  if (modelPath && models.value.length > 0) {
    const found = models.value.find(m => m.id === modelPath || m.id.includes(modelPath.split('/')[1] ?? modelPath))
    if (found) openPlayground(found)
    else {
      // Model from hub may not be in playground list — add it as a virtual entry
      const parts = modelPath.split('/')
      openPlayground({ id: parts[1] || modelPath, object: 'model', created: 0, owned_by: parts[0] || 'platform' })
    }
  }
})

async function fetchModels() {
  loadingModels.value = true
  try {
    if (externalApi.enabled) {
      let list: Model[] = []
      // Try fetching model list
      try {
        list = await fetchExternalModels(externalApi.baseUrl, externalApi.apiKey)
      } catch {
        // Fall back to manual list
      }
      // Merge with manual entries
      if (externalApi.manualModels) {
        const manual = parseManualModels(externalApi.manualModels, externalApi.name)
        const existing = new Set(list.map(m => m.id))
        manual.forEach(m => { if (!existing.has(m.id)) list.push(m) })
      }
      models.value = list
    } else {
      const res = await listModels()
      models.value = (res.data?.data ?? []) as (Model & { _external?: boolean })[]
    }
  } catch {
    models.value = []
  } finally {
    loadingModels.value = false
  }
}

async function requireLogin(action: string): Promise<boolean> {
  if (auth.isLoggedIn) return true
  try {
    await ElMessageBox.confirm(
      t('models.loginRequired', { action }),
      t('models.loginRequiredTitle'),
      { confirmButtonText: t('register.submit'), cancelButtonText: t('login.submit'), type: 'info', distinguishCancelAndClose: true }
    )
    router.push('/register')
  } catch (a) {
    if (a === 'cancel') router.push('/login')
  }
  return false
}

function openPlayground(model: Model & { _external?: boolean }) {
  selectedModel.value = model
  messages.value = []
}

function clearChat() { messages.value = [] }

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || streaming.value || !selectedModel.value) return
  if (!selectedModel.value._external && !await requireLogin(t('models.actionChat'))) return

  inputText.value = ''
  messages.value.push({ role: 'user', content: text })
  const assistantMsg: ChatMessage = { role: 'assistant', content: '' }
  messages.value.push(assistantMsg)
  streaming.value = true
  await scrollToBottom()

  const apiMessages: ChatMessage[] = []
  if (systemPrompt.value) apiMessages.push({ role: 'system', content: systemPrompt.value })
  apiMessages.push(...messages.value.slice(0, -1))

  if (selectedModel.value._external) {
    await streamExternal(assistantMsg, apiMessages)
  } else {
    chatCompletionsStream(
      { model: selectedModel.value.id, messages: apiMessages, temperature: temperature.value, max_tokens: maxTokens.value },
      (chunk) => { assistantMsg.content += chunk; scrollToBottom() },
      () => { streaming.value = false },
      (err) => { assistantMsg.content = `Error: ${err.message}`; streaming.value = false }
    )
  }
}

async function streamExternal(assistantMsg: ChatMessage, apiMessages: ChatMessage[]) {
  const isAnthropicApi = isAnthropic(externalApi.baseUrl)
  const endpoint = isAnthropicApi
    ? `${externalApi.baseUrl}/messages`
    : `${externalApi.baseUrl}/chat/completions`

  // Anthropic uses /messages with different body format
  const body = isAnthropicApi
    ? {
        model: selectedModel.value!.id,
        messages: apiMessages.filter(m => m.role !== 'system'),
        system: apiMessages.find(m => m.role === 'system')?.content,
        stream: true,
        max_tokens: maxTokens.value,
        temperature: temperature.value,
      }
    : {
        model: selectedModel.value!.id,
        messages: apiMessages,
        stream: true,
        temperature: temperature.value,
        max_tokens: maxTokens.value,
      }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: buildHeaders(externalApi.baseUrl, externalApi.apiKey),
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      assistantMsg.content = `Error ${res.status}: ${err.error?.message || res.statusText}`
      streaming.value = false
      return
    }

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      for (const line of chunk.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed === 'data: [DONE]') continue

        // Anthropic SSE: "event: content_block_delta" + "data: {...}"
        if (isAnthropicApi) {
          if (!trimmed.startsWith('data: ')) continue
          try {
            const json = JSON.parse(trimmed.slice(6))
            // content_block_delta carries the text
            const text = json.delta?.text ?? json.delta?.partial_json ?? ''
            if (text) { assistantMsg.content += text; await scrollToBottom() }
          } catch { /* skip */ }
        } else {
          if (!trimmed.startsWith('data: ')) continue
          try {
            const json = JSON.parse(trimmed.slice(6))
            const text = json.choices?.[0]?.delta?.content ?? ''
            if (text) { assistantMsg.content += text; await scrollToBottom() }
          } catch { /* skip */ }
        }
      }
    }
  } catch (e: any) {
    assistantMsg.content = `Error: ${e.message}`
  } finally {
    streaming.value = false
  }
}

async function scrollToBottom() {
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}
</script>
