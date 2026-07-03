<template>
  <div class="min-h-screen bg-gray-50">
    <TopNav />

    <div class="max-w-4xl mx-auto px-6 py-12">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ t('docs.title') }}</h1>
        <p class="text-gray-500">{{ t('docs.subtitle') }}</p>
      </div>

      <!-- Step 1: Get API Key -->
      <section class="mb-10">
        <div class="flex items-center gap-3 mb-4">
          <span class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</span>
          <h2 class="text-xl font-semibold text-gray-900">{{ t('docs.step1.title') }}</h2>
        </div>
        <p class="text-gray-600 mb-3 ml-11">{{ t('docs.step1.desc') }}</p>
        <div class="ml-11">
          <el-button v-if="auth.isLoggedIn" type="primary" size="small" @click="router.push('/app/apikeys')">
            {{ t('docs.step1.goApiKeys') }}
          </el-button>
          <el-button v-else type="primary" size="small" @click="router.push('/register')">
            {{ t('docs.step1.signUp') }}
          </el-button>
        </div>
      </section>

      <!-- Step 2: Authentication -->
      <section class="mb-10">
        <div class="flex items-center gap-3 mb-4">
          <span class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</span>
          <h2 class="text-xl font-semibold text-gray-900">{{ t('docs.step2.title') }}</h2>
        </div>
        <p class="text-gray-600 mb-3 ml-11">{{ t('docs.step2.desc') }}</p>
        <div class="ml-11 bg-gray-900 rounded-lg p-4 text-sm">
          <code class="text-green-400">Authorization: Bearer YOUR_API_KEY</code>
        </div>
      </section>

      <!-- Step 3: Make a request -->
      <section class="mb-10">
        <div class="flex items-center gap-3 mb-4">
          <span class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">3</span>
          <h2 class="text-xl font-semibold text-gray-900">{{ t('docs.step3.title') }}</h2>
        </div>
        <p class="text-gray-600 mb-4 ml-11">{{ t('docs.step3.desc') }}</p>

        <!-- Language tabs -->
        <div class="ml-11">
          <el-tabs v-model="codeLang" class="code-tabs">
            <el-tab-pane label="Python" name="python">
              <pre class="bg-gray-900 text-green-400 rounded-lg p-5 text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap">{{ pythonCode }}</pre>
            </el-tab-pane>
            <el-tab-pane label="TypeScript" name="typescript">
              <pre class="bg-gray-900 text-green-400 rounded-lg p-5 text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap">{{ tsCode }}</pre>
            </el-tab-pane>
            <el-tab-pane label="cURL" name="curl">
              <pre class="bg-gray-900 text-green-400 rounded-lg p-5 text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap">{{ curlCode }}</pre>
            </el-tab-pane>
          </el-tabs>
        </div>
      </section>

      <!-- Available Models -->
      <section class="mb-10">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ t('docs.models.title') }}</h2>
        <p class="text-gray-600 mb-4">{{ t('docs.models.desc') }}</p>

        <div v-if="modelsLoading" class="py-8 text-center text-gray-400">
          <el-icon class="animate-spin text-blue-500 text-2xl"><Loading /></el-icon>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div v-for="m in models" :key="m.id"
            class="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors">
            <div class="font-mono text-sm font-medium text-gray-900 mb-1">{{ m.model_name }}</div>
            <div class="flex items-center gap-2 text-xs text-gray-500">
              <span class="capitalize">{{ m.provider }}</span>
              <template v-if="m.price_input != null">
                <span>·</span>
                <span class="text-emerald-600">${{ m.price_input }}/1M in</span>
                <span class="text-orange-600">${{ m.price_output }}/1M out</span>
              </template>
            </div>
          </div>
        </div>
      </section>

      <!-- Request Builder -->
      <section class="mb-10">
        <h2 class="text-xl font-semibold text-gray-900 mb-2">{{ t('docs.builder.title') }}</h2>
        <p class="text-gray-600 mb-4">{{ t('docs.builder.desc') }}</p>

        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Left: Controls -->
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-gray-700 mb-1 block">{{ t('docs.builder.model') }}</label>
                <el-select v-model="builder.model" filterable class="w-full" :placeholder="t('docs.builder.selectModel')">
                  <el-option v-for="m in models" :key="m.model_name" :label="m.model_name" :value="m.model_name" />
                </el-select>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700 mb-1 block">{{ t('docs.builder.message') }}</label>
                <el-input v-model="builder.message" type="textarea" :rows="3" placeholder="Hello, how are you?" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-sm font-medium text-gray-700 mb-1 block">temperature</label>
                  <el-slider v-model="builder.temperature" :min="0" :max="2" :step="0.1" :show-tooltip="true" />
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700 mb-1 block">max_tokens</label>
                  <el-input-number v-model="builder.maxTokens" :min="1" :max="8192" :step="128" size="small" class="w-full" />
                </div>
              </div>
              <div v-if="auth.isLoggedIn">
                <label class="text-sm font-medium text-gray-700 mb-1 block">{{ t('docs.builder.apiKey') }}</label>
                <el-select v-model="builder.apiKey" :placeholder="t('docs.builder.selectKey')" clearable class="w-full">
                  <el-option v-for="k in userKeys" :key="k.token" :label="k.token_name" :value="k.token" />
                </el-select>
              </div>
            </div>

            <!-- Right: Generated Code -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <el-radio-group v-model="builder.lang" size="small">
                  <el-radio-button value="python">Python</el-radio-button>
                  <el-radio-button value="typescript">TypeScript</el-radio-button>
                  <el-radio-button value="curl">cURL</el-radio-button>
                </el-radio-group>
                <el-button size="small" text @click="copyBuilderCode">{{ t('common.copy') }}</el-button>
              </div>
              <pre class="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap" style="min-height: 200px">{{ generatedCode }}</pre>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section v-if="!auth.isLoggedIn" class="text-center py-10 bg-white rounded-xl border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ t('docs.cta.title') }}</h3>
        <p class="text-gray-500 mb-4">{{ t('docs.cta.desc') }}</p>
        <el-button type="primary" size="large" @click="router.push('/register')" class="!px-8">
          {{ t('home.cta.btn') }}
        </el-button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Loading } from '@element-plus/icons-vue'
import TopNav from '../components/TopNav.vue'
import { useAuthStore } from '../stores/auth'
import api from '../api/index'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const codeLang = ref('python')
const modelsLoading = ref(false)

interface Model {
  id: number
  model_name: string
  provider: string
  price_input?: number
  price_output?: number
}

const models = ref<Model[]>([])

const baseUrl = `${window.location.protocol}//${window.location.host}`

const pythonCode = `from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="${baseUrl}/v1"
)

response = client.chat.completions.create(
    model="claude-sonnet-4-6",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)`

const tsCode = `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "YOUR_API_KEY",
  baseURL: "${baseUrl}/v1",
});

const response = await client.chat.completions.create({
  model: "claude-sonnet-4-6",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(response.choices[0].message.content);`

const curlCode = `curl ${baseUrl}/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-sonnet-4-6",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`

// Request Builder
const builder = reactive({
  model: 'claude-sonnet-4-6',
  message: 'Hello!',
  temperature: 0.7,
  maxTokens: 1024,
  lang: 'python',
  apiKey: '',
})

const userKeys = ref<Array<{ token_name: string; token: string }>>([])

async function fetchUserKeys() {
  if (!auth.isLoggedIn) return
  try {
    const { listTokens } = await import('../api/tokens')
    const res = await listTokens(auth.username, 'aigateway')
    userKeys.value = res.data?.data ?? []
  } catch { /* ignore */ }
}

const apiKeyDisplay = computed(() => builder.apiKey || 'YOUR_API_KEY')

const generatedCode = computed(() => {
  const m = builder.model || 'claude-sonnet-4-6'
  const msg = builder.message || 'Hello!'
  const key = apiKeyDisplay.value

  if (builder.lang === 'python') {
    return `from openai import OpenAI

client = OpenAI(
    api_key="${key}",
    base_url="${baseUrl}/v1"
)

response = client.chat.completions.create(
    model="${m}",
    messages=[{"role": "user", "content": "${msg}"}],
    temperature=${builder.temperature},
    max_tokens=${builder.maxTokens}
)
print(response.choices[0].message.content)`
  } else if (builder.lang === 'typescript') {
    return `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "${key}",
  baseURL: "${baseUrl}/v1",
});

const response = await client.chat.completions.create({
  model: "${m}",
  messages: [{ role: "user", content: "${msg}" }],
  temperature: ${builder.temperature},
  max_tokens: ${builder.maxTokens},
});
console.log(response.choices[0].message.content);`
  } else {
    return `curl ${baseUrl}/v1/chat/completions \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${m}",
    "messages": [{"role": "user", "content": "${msg}"}],
    "temperature": ${builder.temperature},
    "max_tokens": ${builder.maxTokens}
  }'`
  }
})

function copyBuilderCode() {
  navigator.clipboard.writeText(generatedCode.value)
  import('element-plus').then(({ ElMessage }) => ElMessage.success(t('common.copy')))
}

async function fetchModels() {
  modelsLoading.value = true
  try {
    const res = await api.get<{ data: Model[] }>('/public/llm_configs')
    models.value = (res.data?.data ?? []).filter((m: any) => m.enabled)
  } catch {
    models.value = []
  } finally {
    modelsLoading.value = false
  }
}

onMounted(() => {
  fetchModels()
  fetchUserKeys()
})
</script>
