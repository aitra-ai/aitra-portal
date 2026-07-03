<template>
  <div class="flex h-full">
    <!-- Chat Playground (always visible) -->
    <div class="flex-1 flex flex-col bg-white">
      <!-- Header -->
      <div class="flex items-center gap-3 px-6 py-3 border-b border-gray-200 bg-white flex-wrap">
        <!-- Model Selector -->
        <el-select
          v-if="!compareMode"
          v-model="selectedModelId"
          filterable
          class="!w-56"
          size="default"
          :placeholder="t('models.selectModel')"
          @change="onModelSelect"
        >
          <el-option
            v-for="m in models"
            :key="m.id"
            :label="m.id"
            :value="m.id"
          >
            <div class="flex items-center justify-between w-full">
              <span>{{ m.id }}</span>
              <span class="text-xs text-gray-400 ml-2">{{ m.owned_by }}</span>
            </div>
          </el-option>
        </el-select>

        <!-- Skill Selector -->
        <el-select
          v-if="skills.length > 0"
          v-model="selectedSkillId"
          :placeholder="t('skills.selectSkill')"
          clearable
          class="!w-48 ml-1"
          size="small"
          @change="onSkillChange"
        >
          <el-option
            v-for="skill in skills"
            :key="skill.id"
            :label="`${skill.icon} ${skill.name}`"
            :value="skill.id"
          />
        </el-select>

        <div class="flex-1" />

        <!-- Compare toggle -->
        <el-button size="small" :type="compareMode ? 'primary' : 'default'" @click="toggleCompareMode">
          {{ compareMode ? t('compare.exitCompare') : t('compare.compare') }}
        </el-button>

        <!-- Chat history -->
        <el-popover placement="bottom-end" :width="260" trigger="click">
          <template #reference>
            <el-button size="small" text>{{ t('compare.history') }}</el-button>
          </template>
          <div v-if="chatHistoryList.length === 0" class="text-center text-gray-400 text-sm py-3">{{ t('compare.noHistory') }}</div>
          <div v-else class="max-h-60 overflow-y-auto space-y-1">
            <div
              v-for="h in chatHistoryList"
              :key="h.id"
              class="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm"
              @click="loadChatHistory(h.id)"
            >
              <div class="truncate flex-1 text-gray-700">{{ h.title }}</div>
              <el-button text size="small" class="!text-gray-300 hover:!text-red-400 shrink-0" @click.stop="deleteChatHistory(h.id)">✕</el-button>
            </div>
          </div>
        </el-popover>

        <el-button size="small" :type="showParamsPanel ? 'primary' : 'default'" text @click="showParamsPanel = !showParamsPanel">
          {{ showParamsPanel ? '▲' : '▼' }} {{ t('models.params') }}
        </el-button>
        <el-button size="small" text class="!text-gray-400" @click="clearChat" :icon="Delete">
          {{ t('models.clearChat') }}
        </el-button>
        <!-- Advanced params (top_p, frequency_penalty) -->
        <el-popover placement="bottom-end" :width="240" trigger="click">
          <template #reference>
            <el-button size="small" text :icon="Setting">{{ t('models.advanced') }}</el-button>
          </template>
          <div class="space-y-3 p-1">
            <div>
              <div class="text-sm text-gray-600 mb-1">top_p: {{ topP }}</div>
              <el-slider v-model="topP" :min="0" :max="1" :step="0.05" />
            </div>
            <div>
              <div class="text-sm text-gray-600 mb-1">frequency_penalty: {{ frequencyPenalty }}</div>
              <el-slider v-model="frequencyPenalty" :min="-2" :max="2" :step="0.1" />
            </div>
          </div>
        </el-popover>
      </div>

      <!-- ═══ Single Model Chat ═══ -->
      <template v-if="!compareMode">
        <!-- Params Panel (collapsible) -->
        <div v-if="showParamsPanel" class="border-b border-gray-100 bg-gray-50 px-6 py-3 transition-all">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
            <div class="md:col-span-2">
              <label class="text-xs font-medium text-gray-500 mb-1 block">System Prompt</label>
              <el-input v-model="systemPrompt" type="textarea" :rows="2" size="small" :placeholder="t('promptTemplates.placeholder')" />
            </div>
            <div class="space-y-2">
              <div>
                <label class="text-xs font-medium text-gray-500">{{ t('models.temperature') }}: {{ temperature }}</label>
                <el-slider v-model="temperature" :min="0" :max="2" :step="0.1" size="small" />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-500">{{ t('models.maxTokens') }}</label>
                <el-input-number v-model="maxTokens" :min="128" :max="8192" :step="128" size="small" class="w-full" />
              </div>
            </div>
          </div>
        </div>

        <!-- Messages -->
        <div ref="messagesEl" class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div v-if="messages.length === 0 && !activeSkill" class="flex items-center justify-center h-full">
            <div class="text-center text-gray-400">
              <el-icon class="text-5xl mb-3 text-gray-200"><ChatDotRound /></el-icon>
              <p class="text-sm">{{ t('models.subtitle') }}</p>
            </div>
          </div>
          <!-- Conversation starters for active skill -->
          <div v-if="activeSkill?.conversation_starters?.length && messages.filter(m => m.role === 'user').length === 0" class="flex flex-wrap gap-2 justify-center py-4">
            <el-button
              v-for="starter in activeSkill.conversation_starters"
              :key="starter"
              size="small"
              round
              @click="inputText = starter; sendMessage()"
            >{{ starter }}</el-button>
          </div>
          <template v-for="(msg, i) in messages" :key="i">
            <div v-if="msg.role === 'user'" class="flex justify-end">
              <div class="chat-bubble-user text-sm leading-relaxed whitespace-pre-wrap">{{ msg.content }}</div>
            </div>
            <div v-else class="flex justify-start gap-3">
              <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                <span class="text-white text-xs font-bold">AI</span>
              </div>
              <div class="chat-bubble-ai text-sm leading-relaxed markdown-body" v-if="msg.content" v-html="renderMarkdown(msg.content)"></div>
              <div class="chat-bubble-ai text-sm leading-relaxed" v-else>
                <span class="text-gray-400 italic">{{ t('models.thinking') }}</span>
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
      </template>

      <!-- ═══ Compare Mode (Split View) ═══ -->
      <template v-else>
        <div class="flex-1 flex overflow-hidden">
          <!-- Left Panel -->
          <div class="flex-1 flex flex-col border-r border-gray-200">
            <div class="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <span class="text-xs font-semibold text-blue-600 uppercase">A</span>
              <el-select v-model="compareModelA" :placeholder="t('compare.selectModel')" size="small" class="!flex-1">
                <el-option v-for="m in models" :key="'a-' + m.id" :label="m.id" :value="m.id" />
              </el-select>
            </div>
            <div ref="compareElA" class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              <div v-if="compareMessagesA.length === 0" class="flex items-center justify-center h-full text-gray-300 text-sm">
                {{ t('compare.waitingForInput') }}
              </div>
              <template v-for="(msg, i) in compareMessagesA" :key="'a-' + i">
                <div v-if="msg.role === 'user'" class="flex justify-end">
                  <div class="chat-bubble-user text-sm leading-relaxed whitespace-pre-wrap">{{ msg.content }}</div>
                </div>
                <div v-else class="flex justify-start gap-2">
                  <div class="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                    <span class="text-white text-[10px] font-bold">A</span>
                  </div>
                  <div class="chat-bubble-ai text-sm leading-relaxed markdown-body" v-if="msg.content" v-html="renderMarkdown(msg.content)"></div>
                  <div class="chat-bubble-ai text-sm leading-relaxed" v-else>
                    <span class="text-gray-400 italic">{{ t('models.thinking') }}</span>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Right Panel -->
          <div class="flex-1 flex flex-col">
            <div class="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <span class="text-xs font-semibold text-green-600 uppercase">B</span>
              <el-select v-model="compareModelB" :placeholder="t('compare.selectModel')" size="small" class="!flex-1">
                <el-option v-for="m in models" :key="'b-' + m.id" :label="m.id" :value="m.id" />
              </el-select>
            </div>
            <div ref="compareElB" class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              <div v-if="compareMessagesB.length === 0" class="flex items-center justify-center h-full text-gray-300 text-sm">
                {{ t('compare.waitingForInput') }}
              </div>
              <template v-for="(msg, i) in compareMessagesB" :key="'b-' + i">
                <div v-if="msg.role === 'user'" class="flex justify-end">
                  <div class="chat-bubble-user text-sm leading-relaxed whitespace-pre-wrap">{{ msg.content }}</div>
                </div>
                <div v-else class="flex justify-start gap-2">
                  <div class="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                    <span class="text-white text-[10px] font-bold">B</span>
                  </div>
                  <div class="chat-bubble-ai text-sm leading-relaxed markdown-body" v-if="msg.content" v-html="renderMarkdown(msg.content)"></div>
                  <div class="chat-bubble-ai text-sm leading-relaxed" v-else>
                    <span class="text-gray-400 italic">{{ t('models.thinking') }}</span>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Shared Input for Compare -->
        <div class="px-6 py-4 border-t border-gray-200 bg-white">
          <div class="flex gap-3 items-end">
            <el-input
              v-model="inputText"
              type="textarea"
              :rows="2"
              :autosize="{ minRows: 2, maxRows: 5 }"
              :placeholder="t('compare.inputPlaceholder')"
              resize="none"
              @keydown.enter.exact.prevent="sendCompareMessage"
              @keydown.shift.enter="() => {}"
              class="flex-1"
            />
            <el-button
              type="primary"
              :loading="compareStreamingA || compareStreamingB"
              :disabled="!inputText.trim() || !compareModelA || !compareModelB"
              @click="sendCompareMessage"
            >
              <el-icon v-if="!compareStreamingA && !compareStreamingB"><Promotion /></el-icon>
              {{ t('models.send') }}
            </el-button>
          </div>
        </div>
      </template>
    </div>

    <!-- Save Prompt Template Dialog -->
    <el-dialog v-model="showSavePromptDialog" :title="t('promptTemplates.saveTitle')" width="360px">
      <el-input v-model="newTemplateName" :placeholder="t('promptTemplates.namePlaceholder')" maxlength="50" />
      <template #footer>
        <el-button @click="showSavePromptDialog = false">{{ t('apikeys.cancel') }}</el-button>
        <el-button type="primary" :disabled="!newTemplateName.trim()" @click="savePromptTemplate">{{ t('promptTemplates.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- External API Config removed — managed via Admin backend -->
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, ArrowRight, Delete, Setting, Upload } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { chatCompletionsStream } from '../api/models'
import api from '../api/index'
import { listTokens, createToken } from '../api/tokens'
import type { Model, ChatMessage } from '../api/models'
import { renderMarkdown } from '../utils/markdown'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

// ── Models & Chat (External API removed — managed via Admin backend) ──

// (External API dead code cleaned up — all functions moved to Admin backend)

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
  JSON.parse(localStorage.getItem(STORAGE_KEY.value) || '{"enabled":false,"name":"","baseUrl":"","apiKey":"","manualModels":""}')
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
  localStorage.setItem(STORAGE_KEY.value, JSON.stringify(externalApi))
  showApiConfig.value = false
  connectingApi.value = false
  await fetchModels()
  ElMessage.success(t('models.apiConnected'))
}

// ── Sync external API key + model list to platform aigateway ─────────────
const syncingToPlatform = ref(false)

async function syncToPlatform() {
  if (!apiForm.apiKey) return
  syncingToPlatform.value = true
  try {
    // Determine provider from form name / base URL
    const providerMap: Record<string, string> = {
      'Claude (Anthropic)': 'anthropic',
      'OpenAI': 'openai',
      'OpenRouter': 'openrouter',
      'DeepSeek': 'deepseek',
    }
    const baseUrlLower = apiForm.baseUrl.toLowerCase()
    let provider = providerMap[apiForm.name] ?? ''
    if (!provider) {
      if (baseUrlLower.includes('anthropic')) provider = 'anthropic'
      else if (baseUrlLower.includes('openai')) provider = 'openai'
      else if (baseUrlLower.includes('openrouter')) provider = 'openrouter'
      else if (baseUrlLower.includes('deepseek')) provider = 'deepseek'
    }

    // Build auth header JSON for this provider
    const authHeader = provider === 'anthropic'
      ? JSON.stringify({ 'x-api-key': apiForm.apiKey, 'anthropic-version': '2023-06-01' })
      : JSON.stringify({ Authorization: `Bearer ${apiForm.apiKey}` })

    const endpoint = provider === 'anthropic'
      ? 'https://api.anthropic.com/v1/messages'
      : `${apiForm.baseUrl.replace(/\/$/, '')}/chat/completions`

    // Step 1: Fetch actual available models from provider
    let providerModels: string[] = []
    try {
      const mods = await fetchExternalModels(apiForm.baseUrl, apiForm.apiKey)
      providerModels = mods.map(m => m.id)
    } catch {
      // Fall back to manual model list if provider API unavailable
      providerModels = apiForm.manualModels.split(',').map(m => m.trim()).filter(Boolean)
    }

    if (providerModels.length === 0) {
      ElMessage.warning('No models found from provider — check API key or add models manually')
      return
    }

    // Step 2: Delete all existing records for this provider
    const existingRes = await api.get<{ data: any[] }>('/admin/llm_configs')
    const existing: any[] = existingRes.data.data ?? []
    const toDelete = existing.filter(c => c.provider === provider)
    for (const cfg of toDelete) {
      await api.delete(`/admin/llm_configs/${cfg.id}`)
    }

    // Step 3: Create fresh records for every available model
    for (const modelId of providerModels) {
      await api.post('/admin/llm_configs', {
        model_name: modelId,
        api_endpoint: endpoint,
        provider,
        auth_header: authHeader,
        enabled: true,
      })
    }

    ElMessage.success(t('models.syncSuccess') + ` (${providerModels.length} models)`)
  } catch (e: any) {
    const msg = e?.response?.data?.msg || e.message || t('common.error')
    ElMessage.error(t('models.syncError') + ': ' + msg)
  } finally {
    syncingToPlatform.value = false
  }
}

function clearExternalApi() {
  Object.assign(externalApi, { enabled: false, name: '', baseUrl: '', apiKey: '', manualModels: '' })
  localStorage.removeItem(STORAGE_KEY.value)
  fetchModels()
}

// ── Models & Chat ────────────────────────────────────────────────────
const models = ref<(Model & { _external?: boolean })[]>([])
const loadingModels = ref(false)
const selectedModel = ref<(Model & { _external?: boolean }) | null>(null)
const selectedModelId = ref('')

function onModelSelect(modelId: string) {
  const found = models.value.find(m => m.id === modelId)
  if (found) {
    selectedModel.value = found
    localStorage.setItem('last_model', modelId)
    messages.value = []
  }
}
const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const streaming = ref(false)
const messagesEl = ref<HTMLElement | null>(null)
const showParamsPanel = ref(true)
const systemPrompt = ref('')
const temperature = ref(0.7)
const maxTokens = ref(2048)
const topP = ref(1.0)
const frequencyPenalty = ref(0)
const showPromptBar = ref(false)

// ── Prompt Templates (localStorage) ──────────────────────────────
interface PromptTemplate {
  name: string
  content: string  // system_prompt — compatible with AISkill structure
}

const PROMPT_TPL_KEY = 'aitra_prompt_templates'
const MAX_TEMPLATES = 20
const promptTemplates = ref<PromptTemplate[]>([])
const showSavePromptDialog = ref(false)
const newTemplateName = ref('')

function loadPromptTemplates() {
  try {
    const raw = localStorage.getItem(PROMPT_TPL_KEY)
    promptTemplates.value = raw ? JSON.parse(raw) : []
  } catch {
    promptTemplates.value = []
  }
}

function savePromptTemplate() {
  const name = newTemplateName.value.trim()
  if (!name || !systemPrompt.value.trim()) return

  // Update if exists, else prepend
  const existing = promptTemplates.value.findIndex(t => t.name === name)
  if (existing >= 0) {
    promptTemplates.value[existing].content = systemPrompt.value
  } else {
    promptTemplates.value.unshift({ name, content: systemPrompt.value })
    if (promptTemplates.value.length > MAX_TEMPLATES) {
      promptTemplates.value = promptTemplates.value.slice(0, MAX_TEMPLATES)
    }
  }
  localStorage.setItem(PROMPT_TPL_KEY, JSON.stringify(promptTemplates.value))
  showSavePromptDialog.value = false
  newTemplateName.value = ''
  ElMessage.success(t('promptTemplates.saved'))
}

function loadPromptTemplate(tpl: PromptTemplate) {
  systemPrompt.value = tpl.content
}

function deletePromptTemplate(name: string) {
  promptTemplates.value = promptTemplates.value.filter(t => t.name !== name)
  localStorage.setItem(PROMPT_TPL_KEY, JSON.stringify(promptTemplates.value))
}

// ── Compare Mode ─────────────────────────────────────────────────
const compareMode = ref(false)
const compareModelA = ref('')
const compareModelB = ref('')
const compareMessagesA = ref<ChatMessage[]>([])
const compareMessagesB = ref<ChatMessage[]>([])
const compareStreamingA = ref(false)
const compareStreamingB = ref(false)
const compareElA = ref<HTMLElement | null>(null)
const compareElB = ref<HTMLElement | null>(null)

function toggleCompareMode() {
  compareMode.value = !compareMode.value
  if (compareMode.value) {
    // Pre-fill model A with current selection
    if (selectedModel.value) compareModelA.value = selectedModel.value.id
    compareMessagesA.value = []
    compareMessagesB.value = []
  }
}

function exitPlayground() {
  compareMode.value = false
  selectedModel.value = null
}

async function sendCompareMessage() {
  const text = inputText.value.trim()
  if (!text || !compareModelA.value || !compareModelB.value) return
  if (!await requireLogin(t('models.actionChat'))) return

  inputText.value = ''

  // Add user message to both panels
  compareMessagesA.value.push({ role: 'user', content: text })
  compareMessagesB.value.push({ role: 'user', content: text })
  const assistantA: ChatMessage = { role: 'assistant', content: '' }
  const assistantB: ChatMessage = { role: 'assistant', content: '' }
  compareMessagesA.value.push(assistantA)
  compareMessagesB.value.push(assistantB)

  const apiMessagesA: ChatMessage[] = []
  const apiMessagesB: ChatMessage[] = []
  if (systemPrompt.value) {
    apiMessagesA.push({ role: 'system', content: systemPrompt.value })
    apiMessagesB.push({ role: 'system', content: systemPrompt.value })
  }
  apiMessagesA.push(...compareMessagesA.value.slice(0, -1))
  apiMessagesB.push(...compareMessagesB.value.slice(0, -1))

  const platformToken = await getPlatformToken()

  // Stream both in parallel
  compareStreamingA.value = true
  compareStreamingB.value = true

  const scrollA = async () => { await nextTick(); if (compareElA.value) compareElA.value.scrollTop = compareElA.value.scrollHeight }
  const scrollB = async () => { await nextTick(); if (compareElB.value) compareElB.value.scrollTop = compareElB.value.scrollHeight }

  chatCompletionsStream(
    { model: compareModelA.value, messages: apiMessagesA, temperature: temperature.value, max_tokens: maxTokens.value, top_p: topP.value, frequency_penalty: frequencyPenalty.value },
    (chunk) => { assistantA.content += chunk; scrollA() },
    () => { compareStreamingA.value = false; saveChatHistoryAuto() },
    (err) => { assistantA.content = `Error: ${err.message}`; compareStreamingA.value = false },
    platformToken ?? undefined
  )

  chatCompletionsStream(
    { model: compareModelB.value, messages: apiMessagesB, temperature: temperature.value, max_tokens: maxTokens.value, top_p: topP.value, frequency_penalty: frequencyPenalty.value },
    (chunk) => { assistantB.content += chunk; scrollB() },
    () => { compareStreamingB.value = false; saveChatHistoryAuto() },
    (err) => { assistantB.content = `Error: ${err.message}`; compareStreamingB.value = false },
    platformToken ?? undefined
  )
}

// ── Chat History (localStorage) ──────────────────────────────────
interface ChatHistoryEntry {
  id: string
  title: string
  model: string
  messages: ChatMessage[]
  systemPrompt: string
  timestamp: number
}

const HISTORY_KEY = 'aitra_chat_history'
const MAX_HISTORY = 20

const chatHistoryList = ref<ChatHistoryEntry[]>([])

function loadChatHistoryList() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    chatHistoryList.value = raw ? JSON.parse(raw) : []
  } catch {
    chatHistoryList.value = []
  }
}

function saveChatHistoryAuto() {
  if (compareMode.value) return // Don't auto-save compare sessions for now
  if (messages.value.length < 2) return

  const firstUserMsg = messages.value.find(m => m.role === 'user')
  if (!firstUserMsg) return

  const id = `chat_${Date.now()}`
  const title = firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '')

  // Check if we already have a recent entry for this conversation (same first message + model)
  const existing = chatHistoryList.value.find(
    h => h.model === selectedModel.value?.id && h.messages[0]?.content === firstUserMsg.content
  )
  if (existing) {
    existing.messages = [...messages.value]
    existing.timestamp = Date.now()
  } else {
    chatHistoryList.value.unshift({
      id,
      title,
      model: selectedModel.value?.id ?? '',
      messages: [...messages.value],
      systemPrompt: systemPrompt.value,
      timestamp: Date.now(),
    })
    // Trim to max
    if (chatHistoryList.value.length > MAX_HISTORY) {
      chatHistoryList.value = chatHistoryList.value.slice(0, MAX_HISTORY)
    }
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(chatHistoryList.value))
}

function loadChatHistory(id: string) {
  const entry = chatHistoryList.value.find(h => h.id === id)
  if (!entry) return
  // Find and select the model
  const found = models.value.find(m => m.id === entry.model)
  if (found) {
    selectedModel.value = found
  } else {
    selectedModel.value = { id: entry.model, object: 'model', created: 0, owned_by: 'unknown' }
  }
  messages.value = [...entry.messages]
  systemPrompt.value = entry.systemPrompt
  compareMode.value = false
}

function deleteChatHistory(id: string) {
  chatHistoryList.value = chatHistoryList.value.filter(h => h.id !== id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(chatHistoryList.value))
}

// Skills
interface AISkill {
  id: number
  name: string
  description: string
  system_prompt: string
  preferred_model: string
  icon: string
  welcome_message?: string
  conversation_starters?: string[]
  category?: string
  usage_count?: number
  tools?: any[]
}
const skills = ref<AISkill[]>([])
const selectedSkillId = ref<number | null>(null)
const activeSkill = ref<AISkill | null>(null)

async function fetchSkills() {
  try {
    const res = await api.get<{ data: AISkill[] }>('/public/skills')
    skills.value = res.data?.data ?? []
  } catch {
    skills.value = []
  }
}

function onSkillChange(skillId: number | null) {
  if (!skillId) {
    systemPrompt.value = ''
    activeSkill.value = null
    return
  }
  const skill = skills.value.find(s => s.id === skillId)
  if (skill) {
    activeSkill.value = skill
    systemPrompt.value = skill.system_prompt
    // Show welcome message
    if (skill.welcome_message) {
      messages.value = [{ role: 'assistant', content: skill.welcome_message }]
    } else {
      messages.value = []
    }
    // Switch to preferred model
    if (skill.preferred_model && models.value.length > 0) {
      const found = models.value.find(m => m.id === skill.preferred_model || m.id.includes(skill.preferred_model))
      if (found && selectedModel.value?.id !== found.id) {
        selectedModel.value = found
        selectedModelId.value = found.id
      }
    }
  }
}

onMounted(async () => {
  loadChatHistoryList()
  loadPromptTemplates()
  await Promise.all([fetchModels(), fetchSkills()])
  // Auto-select model: query param > localStorage > first available
  const modelPath = route.query.model as string
  const lastModel = localStorage.getItem('last_model')
  if (modelPath && models.value.length > 0) {
    const found = models.value.find(m => m.id === modelPath || m.id.includes(modelPath.split('/')[1] ?? modelPath))
    if (found) {
      selectedModel.value = found
      selectedModelId.value = found.id
    } else {
      const parts = modelPath.split('/')
      const virtual = { id: parts[1] || modelPath, object: 'model', created: 0, owned_by: parts[0] || 'platform' }
      selectedModel.value = virtual as any
      selectedModelId.value = virtual.id
    }
  } else if (lastModel && models.value.find(m => m.id === lastModel)) {
    const found = models.value.find(m => m.id === lastModel)!
    selectedModel.value = found
    selectedModelId.value = found.id
  } else if (models.value.length > 0) {
    selectedModel.value = models.value[0]
    selectedModelId.value = models.value[0].id
  }

  // Auto-select skill from query param (from Skills page "Try it" button)
  const skillParam = route.query.skill as string
  if (skillParam && skills.value.length > 0) {
    const skillId = parseInt(skillParam, 10)
    if (!isNaN(skillId)) {
      selectedSkillId.value = skillId
      onSkillChange(skillId)
    }
  }
})

// Platform API token cache (auto-created on first chat)
let _platformToken: string | null = null

async function getPlatformToken(): Promise<string | null> {
  if (!auth.isLoggedIn) return null
  if (_platformToken) return _platformToken
  try {
    const res = await listTokens(auth.username, 'aigateway')
    const tokens = res.data?.data ?? []
    if (tokens.length > 0) {
      _platformToken = tokens[0].token
      return _platformToken
    }
  } catch { /* no existing token */ }
  // Auto-create platform token for this user
  try {
    const res = await createToken('aigateway', 'playground-auto')
    _platformToken = res.data?.data?.token ?? null
    return _platformToken
  } catch {
    return null
  }
}

async function fetchModels() {
  loadingModels.value = true
  try {
    {
      // Load platform models from admin-configured list
      const res = await api.get('/public/llm_configs')
      const publicModels: Array<{ model_name: string; provider: string; enabled: boolean }> = res.data?.data ?? []
      models.value = publicModels
        .filter(m => m.enabled)
        .map(m => ({
          id: m.model_name,
          object: 'model',
          created: 0,
          owned_by: m.provider,
        })) as (Model & { _external?: boolean })[]
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

function clearChat() {
  messages.value = []
  compareMessagesA.value = []
  compareMessagesB.value = []
}

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

  {
    // Platform API — get or auto-create token
    const platformToken = await getPlatformToken()
    chatCompletionsStream(
      { model: selectedModel.value.id, messages: apiMessages, temperature: temperature.value, max_tokens: maxTokens.value, top_p: topP.value, frequency_penalty: frequencyPenalty.value, ...(activeSkill.value ? { skill: activeSkill.value.name } : {}) },
      (chunk) => { assistantMsg.content += chunk; scrollToBottom() },
      () => { streaming.value = false; saveChatHistoryAuto() },
      (err) => { assistantMsg.content = `Error: ${err.message}`; streaming.value = false },
      platformToken ?? undefined
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
        top_p: topP.value,
      }
    : {
        model: selectedModel.value!.id,
        messages: apiMessages,
        stream: true,
        temperature: temperature.value,
        max_tokens: maxTokens.value,
        top_p: topP.value,
        frequency_penalty: frequencyPenalty.value,
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
