<template>
  <div>
    <TopNav />
  <div class="p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('mcpPublic.title') }}</h1>
      <p class="text-gray-500 mt-1">{{ t('mcpPublic.subtitle') }}</p>
    </div>

    <!-- Search -->
    <div class="flex flex-wrap gap-3 mb-6 items-center">
      <el-input
        v-model="searchQuery"
        :placeholder="t('mcpPublic.searchPlaceholder')"
        clearable
        class="!w-64"
        :prefix-icon="Search"
      />
      <div class="flex-1" />
      <span class="text-sm text-gray-400">{{ filteredServices.length }} {{ t('mcpPublic.servicesAvailable') }}</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <el-skeleton v-for="i in 6" :key="i" :rows="3" animated class="p-4 bg-white rounded-xl border border-gray-100" />
    </div>

    <!-- Empty -->
    <div v-else-if="filteredServices.length === 0" class="flex flex-col items-center justify-center py-20 text-gray-400">
      <el-icon class="text-5xl mb-3 text-gray-200"><Connection /></el-icon>
      <p>{{ t('mcpPublic.noServices') }}</p>
    </div>

    <!-- Service Cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="svc in filteredServices"
        :key="svc.id"
        class="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all flex flex-col"
      >
        <!-- Header with Icon -->
        <div class="flex items-start gap-3 mb-3">
          <span class="text-3xl shrink-0">{{ svc.icon || '🔌' }}</span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="text-base font-semibold text-gray-900">{{ svc.name }}</h3>
              <el-tag v-if="svc.category" size="small" type="info" class="shrink-0">{{ svc.category }}</el-tag>
            </div>
            <div class="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
              <span v-if="svc.owner">{{ svc.owner }}</span>
              <span>·</span>
              <span>{{ svc.protocol || 'stdio' }}</span>
            </div>
          </div>
        </div>

        <!-- Description -->
        <p class="text-sm text-gray-600 leading-relaxed mb-3 flex-1">{{ svc.description }}</p>

        <!-- Features -->
        <div v-if="svc.features && svc.features.length > 0" class="mb-4">
          <div class="grid grid-cols-2 gap-1">
            <div v-for="feat in svc.features" :key="feat" class="flex items-center gap-1.5 text-xs text-gray-500">
              <span class="w-1 h-1 rounded-full bg-blue-400 shrink-0"></span>
              {{ feat }}
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 mt-auto">
          <el-button size="small" type="primary" class="flex-1" @click="showConfig(svc)">
            {{ t('mcpPublic.viewConfig') }}
          </el-button>
          <el-button size="small" text @click="openUrl(svc.url)">
            {{ t('mcpPublic.viewSource') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Config Dialog -->
    <el-dialog v-model="configDialogVisible" :title="configService?.name" width="560px">
      <div v-if="configService" class="space-y-4">
        <h4 class="text-sm font-semibold text-gray-700">{{ t('mcpPublic.connectionConfig') }}</h4>
        <el-tabs>
          <el-tab-pane label="Claude Desktop">
            <pre class="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap">{{ claudeConfig(configService) }}</pre>
          </el-tab-pane>
          <el-tab-pane label="Cursor">
            <pre class="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap">{{ cursorConfig(configService) }}</pre>
          </el-tab-pane>
          <el-tab-pane label="URL">
            <div class="bg-gray-900 rounded-lg p-4">
              <code class="text-green-400 text-sm">{{ configService.url }}</code>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, Connection, User } from '@element-plus/icons-vue'
import TopNav from '../components/TopNav.vue'
import api from '../api/index'

const { t } = useI18n()

interface MCPService {
  id: number
  name: string
  description: string
  url: string
  protocol: string
  owner: string
  icon?: string
  features?: string[]
  category?: string
}

const services = ref<MCPService[]>([])
const loading = ref(false)
const searchQuery = ref('')
const configDialogVisible = ref(false)
const configService = ref<MCPService | null>(null)

const filteredServices = computed(() => {
  if (!searchQuery.value) return services.value
  const q = searchQuery.value.toLowerCase()
  return services.value.filter(s =>
    s.name.toLowerCase().includes(q) ||
    (s.description || '').toLowerCase().includes(q)
  )
})

function shortenUrl(url: string) {
  try {
    const u = new URL(url)
    return u.hostname + u.pathname
  } catch {
    return url
  }
}

function showConfig(svc: MCPService) {
  configService.value = svc
  configDialogVisible.value = true
}

function openUrl(url: string) {
  window.open(url, '_blank')
}

function claudeConfig(svc: MCPService) {
  const config: any = {
    mcpServers: {
      [svc.name]: {
        url: svc.url,
        transport: svc.protocol === 'streamable' ? 'streamable-http' : 'sse',
      }
    }
  }
  return JSON.stringify(config, null, 2)
}

function cursorConfig(svc: MCPService) {
  const config: any = {
    mcpServers: {
      [svc.name]: {
        url: svc.url,
      }
    }
  }
  return JSON.stringify(config, null, 2)
}

// Featured MCP services shown when API has no data
const FEATURED_MCP: MCPService[] = [
  {
    id: -1,
    name: 'Brave Search',
    description: 'Real-time web search powered by Brave Search API. Let AI assistants search the web, get current information, news, and local results without leaving the conversation.',
    url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search',
    protocol: 'stdio',
    owner: 'Anthropic',
    icon: '🔍',
    category: 'Search',
    features: ['Web search with pagination', 'Local business search', 'News & current events', 'Filtered & safe search'],
  },
  {
    id: -2,
    name: 'GitHub',
    description: 'Full GitHub integration for AI-powered development workflows. Manage repositories, create issues & PRs, review code, search across repos, and automate development tasks.',
    url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
    protocol: 'stdio',
    owner: 'Anthropic',
    icon: '🐙',
    category: 'Development',
    features: ['Create & manage repos', 'Issues & Pull Requests', 'Code search & review', 'Branch & file operations'],
  },
  {
    id: -3,
    name: 'Filesystem',
    description: 'Secure local file system access with configurable permissions. Read, write, create, and manage files and directories with sandboxed access controls.',
    url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
    protocol: 'stdio',
    owner: 'Anthropic',
    icon: '📁',
    category: 'System',
    features: ['Read & write files', 'Directory listing & search', 'File move, copy & delete', 'Configurable access paths'],
  },
  {
    id: -4,
    name: 'PostgreSQL',
    description: 'Safe read-only access to PostgreSQL databases. Inspect schemas, run SELECT queries, and explore data — perfect for AI-assisted data analysis and report generation.',
    url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres',
    protocol: 'stdio',
    owner: 'Anthropic',
    icon: '🐘',
    category: 'Database',
    features: ['Schema inspection', 'Read-only SQL queries', 'Table & column discovery', 'Safe query execution'],
  },
  {
    id: -5,
    name: 'Slack',
    description: 'Connect AI assistants to your Slack workspace. Send messages, manage channels, search conversation history, and automate team communication workflows.',
    url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack',
    protocol: 'stdio',
    owner: 'Anthropic',
    icon: '💬',
    category: 'Communication',
    features: ['Send & read messages', 'Channel management', 'Conversation search', 'User & team info'],
  },
  {
    id: -6,
    name: 'Puppeteer',
    description: 'Browser automation for AI agents. Navigate web pages, fill forms, take screenshots, extract content, and interact with any web application programmatically.',
    url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer',
    protocol: 'stdio',
    owner: 'Anthropic',
    icon: '🌐',
    category: 'Automation',
    features: ['Page navigation & clicks', 'Screenshots & PDF export', 'Form filling & interaction', 'Content extraction'],
  },
  {
    id: -7,
    name: 'Google Maps',
    description: 'Location and mapping services for AI assistants. Search places, get directions, geocode addresses, and access detailed business information from Google Maps.',
    url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/google-maps',
    protocol: 'stdio',
    owner: 'Anthropic',
    icon: '🗺️',
    category: 'Location',
    features: ['Place search & details', 'Directions & routing', 'Geocoding & reverse', 'Distance calculation'],
  },
  {
    id: -8,
    name: 'Memory',
    description: 'Persistent knowledge graph memory for AI assistants. Store entities, relationships, and observations across conversations — giving AI long-term memory.',
    url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
    protocol: 'stdio',
    owner: 'Anthropic',
    icon: '🧠',
    category: 'AI',
    features: ['Entity & relation storage', 'Knowledge graph queries', 'Cross-session memory', 'Observation tracking'],
  },
  {
    id: -9,
    name: 'Fetch',
    description: 'HTTP request tool for AI assistants. Fetch any URL, extract readable content from web pages, and convert HTML to clean markdown for processing.',
    url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch',
    protocol: 'stdio',
    owner: 'Anthropic',
    icon: '📡',
    category: 'Network',
    features: ['HTTP GET/POST requests', 'HTML → Markdown conversion', 'Content extraction', 'Custom headers & auth'],
  },
]

async function fetchServices() {
  loading.value = true
  try {
    const res = await api.get('/v1/mcp/resources', { params: { per: 100, page: 1 } })
    const data = res.data?.data ?? []
    services.value = data.length > 0 ? data : FEATURED_MCP
  } catch {
    services.value = FEATURED_MCP
  } finally {
    loading.value = false
  }
}

onMounted(fetchServices)
</script>
