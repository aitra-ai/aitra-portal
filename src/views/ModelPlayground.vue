<template>
  <div class="flex h-full">
    <!-- Model List (left panel) -->
    <div v-if="!selectedModel" class="flex-1 p-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">{{ t('models.title') }}</h1>
        <p class="text-gray-500 mt-1">{{ t('models.subtitle') }}</p>
      </div>

      <div v-if="loadingModels" class="flex items-center justify-center py-20">
        <el-icon class="animate-spin text-blue-500 text-3xl"><Loading /></el-icon>
      </div>

      <el-empty v-else-if="models.length === 0" :description="t('models.noModels')" />

      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div
          v-for="model in models"
          :key="model.id"
          class="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
          @click="openPlayground(model)"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <el-icon class="text-blue-500 text-xl"><Cpu /></el-icon>
            </div>
            <el-tag size="small" type="success">{{ model.owned_by || 'platform' }}</el-tag>
          </div>
          <h3 class="font-semibold text-gray-900 mb-1 truncate">{{ model.id }}</h3>
          <p class="text-xs text-gray-400 mb-4">{{ model.object }}</p>
          <el-button size="small" type="primary" class="w-full group-hover:opacity-100">
            {{ t('models.tryIt') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Chat Playground (right panel) -->
    <div v-else class="flex-1 flex flex-col bg-white">
      <!-- Chat header -->
      <div class="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-white">
        <el-button text @click="selectedModel = null" :icon="ArrowLeft">
          {{ t('models.backToList') }}
        </el-button>
        <div class="h-4 w-px bg-gray-300" />
        <el-icon class="text-blue-500"><Cpu /></el-icon>
        <span class="font-semibold text-gray-800">{{ selectedModel.id }}</span>
        <el-button size="small" text class="ml-auto !text-gray-400" @click="clearChat" :icon="Delete">
          {{ t('models.clearChat') }}
        </el-button>
        <!-- Settings toggle -->
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
      <div ref="messagesEl" class="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
        <div v-if="messages.length === 0" class="flex items-center justify-center h-full">
          <div class="text-center text-gray-400">
            <el-icon class="text-5xl mb-3 text-gray-200"><ChatDotRound /></el-icon>
            <p class="text-sm">{{ t('models.subtitle') }}</p>
          </div>
        </div>

        <template v-for="(msg, i) in messages" :key="i">
          <!-- User message -->
          <div v-if="msg.role === 'user'" class="flex justify-end">
            <div class="chat-bubble-user text-sm leading-relaxed whitespace-pre-wrap">{{ msg.content }}</div>
          </div>
          <!-- Assistant message -->
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

      <!-- Input area -->
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
            class="h-full"
          >
            <el-icon v-if="!streaming"><Promotion /></el-icon>
            {{ t('models.send') }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ArrowLeft, Delete, Setting } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { listModels, chatCompletionsStream } from '../api/models'
import type { Model, ChatMessage } from '../api/models'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const models = ref<Model[]>([])
const loadingModels = ref(false)
const selectedModel = ref<Model | null>(null)

const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const streaming = ref(false)
const messagesEl = ref<HTMLElement | null>(null)

const systemPrompt = ref('')
const temperature = ref(0.7)
const maxTokens = ref(2048)

onMounted(fetchModels)

async function fetchModels() {
  loadingModels.value = true
  try {
    const res = await listModels()
    models.value = res.data?.data ?? []
  } catch {
    ElMessage.error(t('common.error'))
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
      {
        confirmButtonText: t('register.submit'),
        cancelButtonText: t('login.submit'),
        type: 'info',
        distinguishCancelAndClose: true,
      }
    )
    router.push('/register')
  } catch (action) {
    if (action === 'cancel') router.push('/login')
  }
  return false
}

function openPlayground(model: Model) {
  selectedModel.value = model
  messages.value = []
}

function clearChat() {
  messages.value = []
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || streaming.value || !selectedModel.value) return
  if (!await requireLogin(t('models.actionChat'))) return

  inputText.value = ''
  messages.value.push({ role: 'user', content: text })

  const assistantMsg: ChatMessage = { role: 'assistant', content: '' }
  messages.value.push(assistantMsg)
  streaming.value = true

  await scrollToBottom()

  const apiMessages: ChatMessage[] = []
  if (systemPrompt.value) {
    apiMessages.push({ role: 'system', content: systemPrompt.value })
  }
  // all messages except the empty assistant one we just added
  apiMessages.push(...messages.value.slice(0, -1))

  chatCompletionsStream(
    {
      model: selectedModel.value.id,
      messages: apiMessages,
      temperature: temperature.value,
      max_tokens: maxTokens.value,
    },
    (chunk) => {
      assistantMsg.content += chunk
      scrollToBottom()
    },
    () => {
      streaming.value = false
    },
    (err) => {
      assistantMsg.content = `Error: ${err.message}`
      streaming.value = false
    }
  )
}

async function scrollToBottom() {
  await nextTick()
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
}
</script>
