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
        <div class="flex flex-wrap gap-3 items-end">
          <div class="flex-1 min-w-40">
            <p class="text-xs text-gray-500 mb-1">{{ t('apikeys.testerSelectKey') }}</p>
            <el-select v-model="tester.tokenValue" class="w-full" :placeholder="t('apikeys.testerSelectKeyPlaceholder')">
              <el-option
                v-for="tk in tokens"
                :key="tk.token"
                :label="tk.name || tk.token_name"
                :value="tk.token"
              />
            </el-select>
          </div>
          <div class="flex-1 min-w-40">
            <p class="text-xs text-gray-500 mb-1">{{ t('apikeys.testerModel') }}</p>
            <el-input v-model="tester.model" placeholder="e.g. Qwen2.5-72B" />
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
            :disabled="!tester.input.trim() || !tester.tokenValue || !tester.model"
            @click="sendTesterMessage"
          >
            {{ t('models.send') }}
          </el-button>
          <el-button text @click="testerMessages = []" :icon="Delete" />
        </div>

        <p v-if="!tester.tokenValue || !tester.model" class="text-xs text-amber-500">
          {{ t('apikeys.testerHint') }}
        </p>
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

const createForm = reactive({ name: '' })

const API_BASE = `${window.location.protocol}//${window.location.host}/api/v1`

const pythonExample = computed(() => `from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="${API_BASE}"
)

response = client.chat.completions.create(
    model="your-model-id",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)`)

const curlExample = computed(() => `curl ${API_BASE}/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "your-model-id",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`)

onMounted(fetchTokens)

async function fetchTokens() {
  if (!auth.username) return
  loading.value = true
  try {
    const res = await listTokens(auth.username, 'git')
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
    const res = await createToken('git', createForm.name.trim())
    const data = res.data?.data ?? (res.data as any)
    const token = data?.token
    if (token) {
      newToken.value = token
    } else {
      ElMessage.warning('Key created but token not returned — check existing keys')
    }
    createForm.name = ''
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
    await deleteToken('git', row.token_name)
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
const testerOpen = ref(false)
const testerLoading = ref(false)
const testerMessagesEl = ref<HTMLElement | null>(null)
const testerMessages = ref<Array<{ role: string; content: string; _error?: boolean }>>([])
const tester = reactive({ tokenValue: '', model: '', input: '' })

async function sendTesterMessage() {
  const text = tester.input.trim()
  if (!text || !tester.tokenValue || !tester.model) return
  tester.input = ''

  testerMessages.value.push({ role: 'user', content: text })
  const aiMsg = { role: 'assistant', content: '', _error: false }
  testerMessages.value.push(aiMsg)
  testerLoading.value = true
  await scrollTester()

  try {
    const res = await fetch('/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tester.tokenValue}`,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        model: tester.model,
        messages: testerMessages.value.filter(m => !m._error).slice(0, -1).map(m => ({ role: m.role, content: m.content })),
        stream: true,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      aiMsg.content = `Error ${res.status}: ${err.message || err.msg || res.statusText}`
      aiMsg._error = true
      return
    }

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      for (const line of decoder.decode(value, { stream: true }).split('\n')) {
        const d = line.replace(/^data: /, '').trim()
        if (!d || d === '[DONE]') continue
        try {
          const chunk = JSON.parse(d)?.choices?.[0]?.delta?.content ?? ''
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
