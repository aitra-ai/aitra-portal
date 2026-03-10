<template>
  <div class="min-h-screen bg-white">
    <!-- Navbar -->
    <nav class="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">C</span>
          </div>
          <span class="font-bold text-lg text-gray-900">CSG Portal</span>
        </div>

        <!-- Nav links -->
        <div class="hidden md:flex items-center gap-1">
          <a href="#" class="px-4 py-1.5 text-sm rounded-full bg-blue-50 text-blue-600 font-medium">
            {{ t('home.nav.home') }}
          </a>
          <a href="#features" class="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            {{ t('home.nav.modelHub') }}
          </a>
          <a href="#openclaw" class="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            {{ t('home.nav.appHub') }}
          </a>
        </div>

        <!-- Right actions -->
        <div class="flex items-center gap-3">
          <el-select v-model="currentLang" size="small" style="width: 90px" @change="changeLang">
            <el-option value="zh" label="中文" />
            <el-option value="en" label="English" />
          </el-select>
          <el-button type="primary" @click="router.push('/login')">
            {{ t('login.submit') }}
          </el-button>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <section class="bg-gradient-to-b from-blue-50 to-white py-24 px-6 text-center">
      <div class="max-w-4xl mx-auto">
        <div class="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          {{ t('home.hero.badge') }}
        </div>
        <h1 class="text-5xl md:text-6xl font-extrabold text-gray-900 mb-5 leading-tight">
          {{ t('home.hero.title1') }}
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            {{ t('home.hero.titleHighlight') }}
          </span>
          {{ t('home.hero.title2') }}
        </h1>
        <p class="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          {{ t('home.hero.subtitle') }}
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <el-button type="primary" size="large" class="!px-8 !text-base !h-12" @click="router.push('/register')">
            {{ t('home.hero.cta1') }}
          </el-button>
          <el-button size="large" class="!px-8 !text-base !h-12" @click="router.push('/models')">
            {{ t('home.hero.cta2') }}
          </el-button>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="py-12 border-y border-gray-100 bg-white">
      <div class="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
        <div v-for="stat in stats" :key="stat.label">
          <div class="text-3xl font-bold text-gray-900 mb-1">{{ stat.value }}</div>
          <div class="text-sm text-gray-500">{{ t(stat.label) }}</div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="py-20 px-6 bg-white">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-14">
          <h2 class="text-3xl font-bold text-gray-900 mb-3">{{ t('home.features.title') }}</h2>
          <p class="text-gray-500 text-lg max-w-2xl mx-auto">{{ t('home.features.subtitle') }}</p>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <div
            v-for="feat in features"
            :key="feat.title"
            class="bg-white border border-gray-200 rounded-2xl p-7 hover:shadow-lg hover:border-blue-200 transition-all"
          >
            <div :class="`w-12 h-12 ${feat.bgColor} rounded-xl flex items-center justify-center mb-5`">
              <el-icon :size="22" :class="feat.iconColor"><component :is="feat.icon" /></el-icon>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">{{ t(feat.title) }}</h3>
            <p class="text-gray-500 text-sm mb-4 leading-relaxed">{{ t(feat.desc) }}</p>
            <ul class="space-y-2">
              <li
                v-for="point in feat.points"
                :key="point"
                class="flex items-center gap-2 text-sm text-gray-600"
              >
                <el-icon class="text-green-500 shrink-0"><CircleCheck /></el-icon>
                {{ t(point) }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- OpenClaw section -->
    <section id="openclaw" class="py-20 px-6 bg-gradient-to-br from-slate-900 to-slate-700 text-white">
      <div class="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <div class="flex-1">
          <div class="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <span>⚡</span> OpenClaw Integration
          </div>
          <h2 class="text-3xl font-bold mb-4">{{ t('home.openclaw.title') }}</h2>
          <p class="text-slate-300 mb-6 leading-relaxed">{{ t('home.openclaw.desc') }}</p>
          <el-button type="primary" size="large" @click="router.push('/register')">
            {{ t('home.hero.cta1') }}
          </el-button>
        </div>
        <div class="flex-1">
          <div class="bg-slate-800 rounded-2xl p-5 font-mono text-sm text-green-400 leading-relaxed">
            <div class="text-slate-400 mb-3 text-xs"># openclaw config.yaml</div>
            <div>model:</div>
            <div class="ml-4">provider: <span class="text-yellow-300">openai_compatible</span></div>
            <div class="ml-4">base_url: <span class="text-blue-300">"https://csg.example.com/api/v1"</span></div>
            <div class="ml-4">api_key: <span class="text-purple-300">"your-api-key"</span></div>
            <div class="ml-4">model: <span class="text-green-300">"Qwen2.5-72B"</span></div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-20 px-6 text-center bg-blue-50">
      <div class="max-w-2xl mx-auto">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">{{ t('home.cta.title') }}</h2>
        <p class="text-gray-500 mb-8">{{ t('home.cta.desc') }}</p>
        <el-button type="primary" size="large" class="!px-10 !h-12 !text-base" @click="router.push('/register')">
          {{ t('home.cta.btn') }}
        </el-button>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-8 border-t border-gray-100 text-center text-sm text-gray-400">
      © {{ new Date().getFullYear() }} CSG Portal · Powered by OpenCSG
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const router = useRouter()
const currentLang = ref(locale.value)

function changeLang(lang: string) {
  locale.value = lang
  localStorage.setItem('lang', lang)
}

const stats = [
  { value: '100+', label: 'home.stats.models' },
  { value: '10K+', label: 'home.stats.users' },
  { value: '99.9%', label: 'home.stats.uptime' },
]

const features = [
  {
    title: 'home.features.modelHub.title',
    desc: 'home.features.modelHub.desc',
    icon: 'Box',
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    points: [
      'home.features.modelHub.p1',
      'home.features.modelHub.p2',
      'home.features.modelHub.p3',
      'home.features.modelHub.p4',
    ],
  },
  {
    title: 'home.features.apiAccess.title',
    desc: 'home.features.apiAccess.desc',
    icon: 'Key',
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
    points: [
      'home.features.apiAccess.p1',
      'home.features.apiAccess.p2',
      'home.features.apiAccess.p3',
      'home.features.apiAccess.p4',
    ],
  },
]
</script>
