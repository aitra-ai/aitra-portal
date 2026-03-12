<template>
  <div class="min-h-screen bg-gray-50">
    <TopNav />

    <section class="py-6 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900">{{ t('spaceHub.title') }}</h1>
          <p class="text-gray-500 text-sm mt-1">{{ t('spaceHub.subtitle') }}</p>
        </div>

        <!-- Featured Sandbox Spaces -->
        <div v-if="featuredLoading" class="flex justify-center py-16">
          <el-icon class="animate-spin text-blue-500 text-4xl"><Loading /></el-icon>
        </div>

        <div v-else-if="featuredSpaces.length > 0">
          <h2 class="text-base font-semibold text-gray-700 mb-3">
            🚀 {{ t('spaceHub.featured') }}
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
            <div
              v-for="sp in featuredSpaces"
              :key="sp.id"
              class="bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer overflow-hidden"
              @click="openSpace(sp)"
            >
              <!-- Cover / Icon -->
              <div class="h-36 overflow-hidden relative">
                <img
                  v-if="sp.cover_url"
                  :src="sp.cover_url"
                  class="w-full h-full object-cover"
                  :alt="sp.display_name"
                />
                <div
                  v-else
                  class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                >
                  <span class="text-5xl">🚀</span>
                </div>
                <!-- Template badge -->
                <el-tag
                  size="small"
                  class="absolute top-2 right-2 opacity-90"
                >{{ sp.template }}</el-tag>
              </div>

              <!-- Body -->
              <div class="p-4">
                <div class="font-semibold text-gray-800 text-sm mb-1 truncate">{{ sp.display_name }}</div>
                <p class="text-gray-400 text-xs line-clamp-2 mb-3 min-h-[2rem]">{{ sp.description }}</p>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-400 font-mono truncate max-w-[120px]">{{ sp.space_path }}</span>
                  <el-button type="primary" size="small" @click.stop="openSpace(sp)">
                    {{ t('sandbox.launch') }}
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <el-empty
          v-else-if="!featuredLoading"
          :description="t('spaceHub.noFeatured')"
          class="py-24"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Loading } from '@element-plus/icons-vue'
import TopNav from '../components/TopNav.vue'
import { listFeaturedSpaces, type FeaturedSpace } from '../api/sandbox'

const { t } = useI18n()
const router = useRouter()

const featuredSpaces = ref<FeaturedSpace[]>([])
const featuredLoading = ref(false)

async function loadFeaturedSpaces() {
  featuredLoading.value = true
  try {
    const res = await listFeaturedSpaces()
    const data = (res.data as any)?.data ?? res.data
    featuredSpaces.value = Array.isArray(data) ? data.filter((s: FeaturedSpace) => s.enabled) : []
  } catch {
    featuredSpaces.value = []
  } finally {
    featuredLoading.value = false
  }
}

function openSpace(sp: FeaturedSpace) {
  const [ns, name] = sp.space_path.split('/')
  if (ns && name) {
    router.push({ name: 'spaceDetail', params: { namespace: ns, name } })
  }
}

onMounted(loadFeaturedSpaces)
</script>
