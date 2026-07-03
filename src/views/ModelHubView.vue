<template>
  <div class="min-h-screen bg-gray-50">
    <TopNav />

    <div class="max-w-7xl mx-auto px-6 py-6">
      <el-tabs v-model="activeTab">
        <!-- ─── TAB 1: Platform Models (deployed / configured) ─── -->
        <el-tab-pane :label="t('modelHub.tabs.platform')" name="platform">
          <div class="mb-4">
            <h2 class="text-lg font-bold text-gray-900 mb-1">{{ t('modelHub.title') }}</h2>
            <p class="text-gray-500 text-sm">{{ t('modelHub.subtitle') }}</p>
          </div>

          <!-- Search & filter bar -->
          <div class="flex flex-wrap gap-3 mb-6 items-center">
            <el-input
              v-model="platformSearch"
              :placeholder="t('modelHub.searchPlaceholder') || 'Search models...'"
              clearable
              class="!w-64"
            />
            <el-select
              v-model="platformProvider"
              :placeholder="t('modelHub.allProviders') || 'All Providers'"
              clearable
              class="!w-44"
            >
              <el-option
                v-for="p in platformProviders"
                :key="p"
                :label="capitalise(p)"
                :value="p"
              />
            </el-select>
            <div class="flex-1" />
            <span class="text-sm text-gray-400">
              {{ filteredPlatformModels.length }} {{ t('modelHub.modelsAvailable') || 'models available' }}
            </span>
          </div>

          <div v-if="platformLoading" class="flex justify-center py-24">
            <el-icon class="animate-spin text-blue-500 text-4xl"><Loading /></el-icon>
          </div>

          <el-empty
            v-else-if="filteredPlatformModels.length === 0"
            :description="platformSearch ? (t('modelHub.noResults') || 'No results') : (t('modelHub.empty') || 'No deployed models yet')"
            class="py-24"
          />

          <!-- Grouped by provider -->
          <template v-else>
            <div v-for="group in groupedPlatformModels" :key="group.provider" class="mb-8">
              <div class="flex items-center gap-2 mb-3">
                <span
                  class="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                  :style="{ backgroundColor: providerColor(group.provider) }"
                >{{ capitalise(group.provider) }}</span>
                <span class="text-xs text-gray-400">{{ group.models.length }} {{ group.models.length === 1 ? 'model' : 'models' }}</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div
                  v-for="m in group.models"
                  :key="m.id"
                  class="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div class="flex items-start justify-between mb-3">
                    <h4 class="font-semibold text-gray-900 text-sm truncate flex-1" :title="m.model_name">{{ m.model_name }}</h4>
                    <span
                      class="shrink-0 ml-2 w-2 h-2 rounded-full mt-1.5"
                      :class="m.enabled ? 'bg-green-400' : 'bg-gray-300'"
                    />
                  </div>
                  <p class="text-xs text-gray-500 mb-1">Provider: {{ capitalise(m.provider) }}</p>
                  <p class="text-xs text-gray-400 truncate mb-3" :title="m.api_endpoint">{{ shortenUrl(m.api_endpoint) }}</p>
                  <!-- Price -->
                  <div v-if="m.price_input != null && m.price_output != null" class="flex gap-3 text-xs mb-4">
                    <span class="text-emerald-600 font-medium">${{ m.price_input }}<span class="text-gray-400">/1M in</span></span>
                    <span class="text-orange-600 font-medium">${{ m.price_output }}<span class="text-gray-400">/1M out</span></span>
                  </div>
                  <el-button size="small" type="primary" class="w-full" :disabled="!m.enabled" @click="handleTryModel()">
                    {{ t('modelHub.aiServices.tryPlayground') || 'Try in Playground' }}
                  </el-button>
                </div>
              </div>
            </div>
          </template>
        </el-tab-pane>

        <!-- ─── TAB 2: AI Services ─── -->
        <el-tab-pane :label="t('modelHub.tabs.aiServices')" name="aiServices">
          <!-- Section A: External AI Models -->
          <div class="mb-10">
            <h3 class="text-base font-semibold text-gray-800 mb-4">
              {{ t('modelHub.aiServices.externalModels') }}
            </h3>

            <div v-if="aiModelsLoading" class="flex justify-center py-8">
              <el-icon class="animate-spin text-blue-500 text-2xl"><Loading /></el-icon>
            </div>

            <p v-else-if="aiModels.length === 0" class="text-sm text-gray-400 py-4">
              {{ t('modelHub.aiServices.noExternalModels') }}
            </p>

            <div
              v-else
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              <div
                v-for="m in aiModels"
                :key="m.id"
                class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2"
              >
                <div class="flex items-start justify-between gap-2">
                  <h4 class="font-semibold text-gray-900 text-sm truncate flex-1">{{ m.model_name }}</h4>
                  <span
                    :class="m.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                    class="text-xs px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
                  >
                    ● {{ m.enabled ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <p class="text-xs text-gray-500">Provider: {{ m.provider }}</p>
                <p class="text-xs text-gray-400 truncate">API: {{ m.api_endpoint }}</p>
                <el-button size="small" type="primary" plain class="mt-auto" @click="handleTryModel()">
                  {{ t('modelHub.aiServices.tryPlayground') }}
                </el-button>
              </div>
            </div>
          </div>

          <!-- Section B: GPU Deployments -->
          <div>
            <h3 class="text-base font-semibold text-gray-800 mb-4">
              {{ t('modelHub.aiServices.gpuDeployments') }}
            </h3>

            <p v-if="!auth.isLoggedIn" class="text-sm text-gray-400 py-4">
              {{ t('modelHub.aiServices.loginForDeployments') }}
            </p>

            <div v-else-if="gpuLoading" class="flex justify-center py-8">
              <el-icon class="animate-spin text-blue-500 text-2xl"><Loading /></el-icon>
            </div>

            <p v-else-if="gpuDeployments.length === 0" class="text-sm text-gray-400 py-4">
              {{ t('modelHub.aiServices.noDeployments') }}
            </p>

            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="d in gpuDeployments"
                :key="d.id"
                class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2"
              >
                <div class="flex items-start justify-between gap-2">
                  <h4 class="font-semibold text-gray-900 text-sm truncate flex-1">{{ d.deploy_name }}</h4>
                  <span
                    :class="gpuStatusClass(d.status)"
                    class="text-xs px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
                  >
                    ● {{ gpuStatusLabel(d.status) }}
                  </span>
                </div>
                <p class="text-xs text-gray-500">SKU: {{ d.sku_name }}</p>
                <p class="text-xs text-gray-400">Since: {{ formatDate(d.started_at) }}</p>
                <div class="flex gap-2 mt-auto">
                  <el-button
                    v-if="d.status === 'running'"
                    size="small"
                    @click="handleStopDeployment(d.id)"
                  >
                    {{ t('gpu.stop') }}
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    plain
                    @click="handleDeleteDeployment(d.id)"
                  >
                    {{ t('gpu.delete') }}
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- ─── TAB 3: Model Weights ─── -->
        <el-tab-pane :label="t('modelHub.tabs.weights')" name="weights">
          <div class="mb-4">
            <h2 class="text-lg font-bold text-gray-900 mb-1">{{ t('modelHub.weights.title') }}</h2>
            <p class="text-gray-500 text-sm">{{ t('modelHub.weights.subtitle') }}</p>
          </div>

          <div v-if="weightsLoading" class="flex justify-center py-12">
            <el-icon class="animate-spin text-blue-500 text-4xl"><Loading /></el-icon>
          </div>

          <el-empty
            v-else-if="weights.length === 0"
            :description="t('modelHub.weights.empty')"
            class="py-24"
          />

          <div v-else class="space-y-4">
            <div
              v-for="w in weights"
              :key="w.id"
              class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-blue-200 hover:shadow-md transition-all"
            >
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-900 text-base mb-1">{{ w.repo_path }}</h4>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-500">{{ t('modelHub.weights.from') }}:</span>
                    <a
                      :href="`https://huggingface.co/${w.hf_model_id}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-xs text-blue-500 hover:text-blue-700 hover:underline"
                    >
                      {{ w.hf_model_id }}
                    </a>
                  </div>
                </div>
                
                <!-- Status Badge -->
                <span
                  class="px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                  :class="{
                    'bg-green-100 text-green-700': w.status === 'done',
                    'bg-blue-100 text-blue-700 animate-pulse': w.status === 'syncing',
                    'bg-yellow-100 text-yellow-700': w.status === 'pending',
                    'bg-red-100 text-red-700': w.status === 'error'
                  }"
                >
                  {{ t(`modelHub.weights.status.${w.status}`) }}
                </span>
              </div>

              <!-- Progress info -->
              <div v-if="w.total_files > 0" class="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span>{{ w.synced_files }}/{{ w.total_files }} {{ t('modelHub.weights.files') }}</span>
                <span>{{ formatBytes(w.synced_size) }}/{{ formatBytes(w.total_size) }}</span>
              </div>

              <!-- Progress bar for syncing -->
              <div v-if="w.status === 'syncing' && w.total_files > 0" class="mb-3">
                <el-progress
                  :percentage="Math.round((w.synced_files / w.total_files) * 100)"
                  :show-text="false"
                  class="mb-1"
                />
                <p class="text-xs text-gray-500">{{ t('modelHub.weights.syncProgress') }}</p>
              </div>

              <!-- Error message -->
              <div v-if="w.status === 'error' && w.error_msg" class="mb-3">
                <p class="text-xs text-red-600 bg-red-50 p-2 rounded">{{ w.error_msg }}</p>
              </div>

              <!-- Actions -->
              <div class="flex items-center justify-between">
                <div class="text-xs text-gray-400">
                  {{ t('modelHub.weights.updated') }}: {{ timeAgo(w.updated_at) }}
                </div>
                <div class="flex gap-2">
                  <el-button
                    v-if="w.status === 'error' || w.status === 'pending'"
                    size="small"
                    type="primary"
                    :loading="retryingSyncIds.has(w.repo_id)"
                    @click="retrySync(w.repo_id)"
                  >
                    {{ w.status === 'pending' ? t('modelHub.weights.startSync') : t('modelHub.weights.retrySync') }}
                  </el-button>
                  <el-button
                    v-else-if="w.status === 'done'"
                    size="small"
                    type="success"
                    plain
                    disabled
                  >
                    {{ t('modelHub.weights.readyToDeploy') }}
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- ─── TAB 4: HF Sync ─── -->
        <el-tab-pane :label="t('modelHub.tabs.hfSync')" name="hfSync">
          <!-- Search bar -->
          <div class="mb-6">
            <h3 class="text-base font-semibold text-gray-800 mb-3">{{ t('modelHub.hfSync.title') }}</h3>
            <div class="flex gap-3">
              <el-input
                v-model="hfQuery"
                :placeholder="t('modelHub.hfSync.searchPlaceholder')"
                class="flex-1"
                clearable
                @keyup.enter="doHFSearch"
                @clear="clearHFSearch"
              />
              <el-button type="primary" :loading="hfSearching" @click="doHFSearch">
                {{ t('modelHub.hfSync.search') }}
              </el-button>
            </div>
          </div>

          <!-- ── Search results ── -->
          <template v-if="hfSearched || hfSearching">
            <div v-if="hfSearching" class="flex justify-center py-12">
              <el-icon class="animate-spin text-blue-500 text-4xl"><Loading /></el-icon>
            </div>
            <p v-else-if="hfResults.length === 0" class="text-sm text-gray-400 py-8 text-center">
              {{ t('modelHub.hfSync.noResults') }}
            </p>
            <div v-else>
              <div class="flex items-center justify-between mb-3">
                <span class="text-sm text-gray-500">
                  {{ t('modelHub.hfSync.searchResultsFor') }} "<strong>{{ hfLastQuery }}</strong>"
                </span>
                <button class="text-xs text-blue-500 hover:underline" @click="clearHFSearch">
                  {{ t('modelHub.hfSync.clearSearch') }}
                </button>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div
                  v-for="hm in hfResults"
                  :key="hm.id"
                  class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
                  @click="openHFModel(hm.id)"
                >
                  <h4 class="font-semibold text-gray-900 text-sm leading-snug break-all">{{ hm.id }}</h4>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span v-if="hm.pipeline_tag" class="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{{ hm.pipeline_tag }}</span>
                  </div>
                  <div class="flex items-center gap-3 text-xs text-gray-500">
                    <span>❤ {{ formatNum(hm.likes) }}</span>
                    <span>⬇ {{ formatNum(hm.downloads) }}</span>
                    <span v-if="hm.gated" class="text-orange-500">{{ t('modelHub.hfSync.gated') }}</span>
                  </div>
                  <p class="text-xs text-gray-400 line-clamp-2">{{ hm.tags?.slice(0, 4).join(', ') }}</p>
                  <el-button size="small" type="primary" class="mt-auto" @click.stop="openImportDialog(hm)">
                    {{ t('modelHub.hfSync.importBtn') }}
                  </el-button>
                </div>
              </div>
            </div>
          </template>

          <!-- ── Trending section (shown when not searching) ── -->
          <template v-else>
            <!-- Trending header row -->
            <div class="flex flex-wrap items-center gap-3 mb-4">
              <span class="text-sm font-semibold text-gray-700">🔥 {{ t('modelHub.hfSync.trending') }}</span>

              <!-- Sort tabs -->
              <div class="flex gap-1.5">
                <button
                  v-for="s in trendingSortOptions"
                  :key="s.value"
                  class="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                  :class="hfTrendingSort === s.value
                    ? 'bg-blue-50 border-blue-400 text-blue-600'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-500'"
                  @click="setTrendingSort(s.value as HFTrendingSort)"
                >
                  {{ s.icon }} {{ s.label }}
                </button>
              </div>

              <!-- Limit picker -->
              <div class="flex items-center gap-1.5 ml-auto text-xs text-gray-500">
                <span>{{ t('modelHub.hfSync.show') }}</span>
                <select
                  v-model="hfTrendingLimit"
                  class="border border-gray-200 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-blue-400"
                  @change="() => loadTrending(true)"
                >
                  <option :value="20">Top 20</option>
                  <option :value="50">Top 50</option>
                  <option :value="100">Top 100</option>
                </select>
              </div>

              <!-- Refresh -->
              <button
                class="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors"
                :disabled="hfTrendingLoading"
                @click="() => loadTrending(true)"
              >
                <span :class="{ 'animate-spin': hfTrendingLoading }">↻</span>
                {{ t('common.refresh') }}
              </button>

              <!-- Cache indicator -->
              <span v-if="hfTrendingCachedAt" class="text-xs text-gray-300">
                {{ t('modelHub.hfSync.cachedAt') }} {{ formatCacheTime(hfTrendingCachedAt) }}
              </span>
            </div>

            <!-- Trending loading skeleton -->
            <div v-if="hfTrendingLoading && hfTrending.length === 0" class="flex justify-center py-16">
              <el-icon class="animate-spin text-blue-500 text-4xl"><Loading /></el-icon>
            </div>

            <!-- Trending error -->
            <div v-else-if="hfTrendingError" class="py-8 text-center">
              <p class="text-sm text-red-400 mb-3">{{ hfTrendingError }}</p>
              <el-button size="small" @click="() => loadTrending(true)">{{ t('common.retry') }}</el-button>
            </div>

            <!-- Trending list (rank-style, not grid) -->
            <div v-else-if="hfTrending.length" class="space-y-2">
              <div
                v-for="(hm, idx) in hfTrending"
                :key="hm.id"
                class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-4 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
                @click="openHFModel(hm.id)"
              >
                <!-- Rank -->
                <span
                  class="text-sm font-bold w-7 text-center shrink-0"
                  :class="idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-gray-300'"
                >
                  #{{ idx + 1 }}
                </span>

                <!-- Model info -->
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold text-gray-900 truncate">
                    <span class="text-gray-400">{{ hm.id.split('/')[0] }}/</span>{{ hm.id.split('/').slice(1).join('/') || hm.id }}
                  </div>
                  <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span v-if="hm.pipeline_tag" class="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{{ hm.pipeline_tag }}</span>
                    <span v-if="hm.tags?.includes('transformers')" class="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">transformers</span>
                    <span v-if="hm.gated" class="text-xs bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full">{{ t('modelHub.hfSync.gated') }}</span>
                  </div>
                </div>

                <!-- Stats -->
                <div class="flex items-center gap-4 shrink-0 text-sm text-gray-500">
                  <span
                    v-if="hfTrendingSort === 'trendingScore' && hm.trendingScore != null"
                    class="flex items-center gap-1 text-orange-500 font-semibold"
                    title="Trending score"
                  >
                    🔥 {{ formatNum(hm.trendingScore) }}
                  </span>
                  <span class="flex items-center gap-1" title="Likes">
                    <span class="text-red-400">❤</span> {{ formatNum(hm.likes) }}
                  </span>
                  <span class="flex items-center gap-1" title="Downloads (30 days)">
                    <span>⬇</span> {{ formatNum(hm.downloads) }}
                  </span>
                  <span v-if="hm.lastModified || hm.createdAt" class="hidden sm:flex items-center gap-1 text-xs text-gray-400" title="Last updated">
                    🕒 {{ timeAgo(hm.lastModified || hm.createdAt) }}
                  </span>
                </div>

                <!-- Import button -->
                <el-button
                  size="small"
                  type="primary"
                  class="shrink-0"
                  @click.stop="openImportDialog(hm)"
                >
                  {{ t('modelHub.hfSync.importBtn') }}
                </el-button>
              </div>
            </div>
          </template>

          <!-- Import & Deploy Dialog -->
          <el-dialog
            v-model="importDialogVisible"
            :title="importStep === 'import' ? t('modelHub.hfSync.importTitle') : t('modelHub.hfSync.deployTitle')"
            width="700px"
            :close-on-click-modal="false"
            @closed="onImportDialogClosed"
          >
            <!-- ═══ Step indicator ═══ -->
            <div class="flex items-center gap-2 mb-5">
              <div class="flex items-center gap-1.5">
                <span
                  :class="[
                    'w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center',
                    importStep === 'import' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
                  ]"
                >{{ importStep === 'import' ? '1' : '✓' }}</span>
                <span :class="importStep === 'import' ? 'text-sm font-semibold text-gray-800' : 'text-sm text-gray-400'">{{ t('modelHub.hfSync.stepImport') }}</span>
              </div>
              <div class="flex-1 h-px bg-gray-200 mx-2" />
              <div class="flex items-center gap-1.5">
                <span
                  :class="[
                    'w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center',
                    importStep === 'deploy' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
                  ]"
                >2</span>
                <span :class="importStep === 'deploy' ? 'text-sm font-semibold text-gray-800' : 'text-sm text-gray-400'">{{ t('modelHub.hfSync.stepDeploy') }}</span>
              </div>
            </div>

            <!-- ═══ Step 1: Import ═══ -->
            <template v-if="importStep === 'import'">
              <!-- Metadata loading -->
              <div v-if="detailLoading" class="flex items-center gap-2 mb-4 text-sm text-gray-500 py-2">
                <el-icon class="animate-spin"><Loading /></el-icon>
                {{ t('modelHub.hfSync.loadingMeta') }}
              </div>

              <!-- File list preview -->
              <div v-if="hfDetail && !detailLoading" class="mb-4 bg-gray-50 rounded-lg border border-gray-200 p-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-semibold text-gray-600">{{ t('modelHub.hfSync.fileList') }}</span>
                  <div class="flex items-center gap-2 text-xs text-gray-500">
                    <span>{{ hfDetail.files.length }} {{ t('modelHub.hfSync.files') }}</span>
                    <el-tag v-if="hfDetail.has_lfs" type="warning" size="small" effect="plain">LFS</el-tag>
                  </div>
                </div>
                <div class="max-h-32 overflow-y-auto space-y-1">
                  <div
                    v-for="f in hfDetail.files.slice(0, 30)"
                    :key="f.path"
                    class="flex items-center justify-between text-xs font-mono"
                  >
                    <span class="text-gray-700 truncate max-w-[300px]">
                      {{ f.type === 'directory' ? '📁' : '📄' }} {{ f.path }}
                    </span>
                    <span class="text-gray-400 shrink-0 ml-2">
                      {{ f.lfs ? formatSize(f.lfs.size) : (f.size ? formatSize(f.size) : '') }}
                      <el-tag v-if="f.lfs" type="warning" size="small" class="ml-1">lfs</el-tag>
                    </span>
                  </div>
                </div>
              </div>

              <el-form label-width="110px" label-position="left">
                <el-form-item :label="t('modelHub.hfSync.hfModelId')">
                  <el-input :model-value="importForm.hf_model_id" disabled />
                </el-form-item>
                <el-form-item :label="t('modelHub.hfSync.targetName')">
                  <el-input v-model="importForm.target_name" />
                </el-form-item>
                <el-form-item :label="t('modelHub.hfSync.license')">
                  <el-select v-model="importForm.license" class="w-full">
                    <el-option label="MIT" value="mit" />
                    <el-option label="Apache 2.0" value="apache-2.0" />
                    <el-option label="CC BY 4.0" value="cc-by-4.0" />
                    <el-option label="CC BY-SA 4.0" value="cc-by-sa-4.0" />
                    <el-option label="GPL 3.0" value="gpl-3.0" />
                    <el-option label="Other" value="other" />
                  </el-select>
                </el-form-item>
                <el-form-item :label="t('modelHub.hfSync.syncLfs')">
                  <div class="flex items-center gap-2">
                    <el-checkbox v-model="importForm.sync_lfs" />
                    <span class="text-xs" :class="hfDetail?.has_lfs ? 'text-orange-500 font-medium' : 'text-gray-400'">
                      {{ hfDetail?.has_lfs ? t('modelHub.hfSync.syncLfsRequired') : t('modelHub.hfSync.syncLfsTip') }}
                    </span>
                  </div>
                </el-form-item>
                <el-form-item :label="t('modelHub.hfSync.description')">
                  <el-input v-model="importForm.description" type="textarea" :rows="3"
                    :placeholder="t('modelHub.hfSync.descPlaceholder')" />
                </el-form-item>
              </el-form>

              <!-- README preview -->
              <div v-if="hfDetail?.readme" class="mt-2">
                <div class="text-xs font-semibold text-gray-500 mb-1">README 预览</div>
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 max-h-24 overflow-y-auto whitespace-pre-wrap font-mono">
                  {{ hfDetail.readme.slice(0, 500) }}{{ hfDetail.readme.length > 500 ? '...' : '' }}
                </div>
              </div>
            </template>

            <!-- ═══ Step 2: Deploy ═══ -->
            <template v-if="importStep === 'deploy'">
              <!-- Import success banner -->
              <div class="mb-5 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <span class="text-green-600 text-lg">✅</span>
                <div>
                  <div class="text-sm font-semibold text-green-800">{{ t('modelHub.hfSync.importDone') }}</div>
                  <div class="text-xs text-green-600">{{ importedModelPath }}</div>
                </div>
              </div>

              <el-form label-position="top">
                <!-- Deploy name -->
                <el-form-item :label="t('modelHub.hfSync.deployName')">
                  <el-input v-model="deployForm.deploy_name" :placeholder="t('modelHub.hfSync.deployNamePlaceholder')" />
                </el-form-item>

                <!-- Model path (read-only) -->
                <el-form-item :label="t('modelHub.hfSync.modelPath')">
                  <el-input :model-value="importedModelPath" disabled />
                </el-form-item>

                <!-- Runtime framework -->
                <el-form-item :label="t('modelHub.hfSync.framework')">
                  <el-select
                    v-model="deployForm.runtime_framework_id"
                    class="w-full"
                    :loading="deployFrameworksLoading"
                    filterable
                    :placeholder="t('modelHub.hfSync.frameworkPlaceholder')"
                  >
                    <el-option
                      v-for="fw in deployFrameworks"
                      :key="fw.id"
                      :label="`${fw.frame_name} ${fw.frame_version}`"
                      :value="fw.id"
                    />
                  </el-select>
                </el-form-item>

                <!-- GPU SKU -->
                <el-form-item :label="t('modelHub.hfSync.selectGpu')">
                  <div v-if="deploySkusLoading" class="text-center py-4">
                    <el-icon class="animate-spin text-blue-400"><Loading /></el-icon>
                  </div>
                  <div v-else class="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    <div
                      v-for="sku in deploySkus"
                      :key="sku.name"
                      :class="[
                        'p-3 rounded-lg border-2 cursor-pointer transition-all text-sm',
                        deployForm.sku_name === sku.name
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      ]"
                      @click="deployForm.sku_name = sku.name"
                    >
                      <div class="font-semibold text-gray-800 text-xs mb-1">{{ sku.display_name }}</div>
                      <div class="text-xs text-gray-500">
                        <div v-if="sku.gpu_count > 0">{{ sku.gpu_model }}</div>
                        <div>{{ sku.gpu_count > 0 ? sku.gpu_count + ' GPU' : 'CPU only' }} · {{ sku.vcpus }} vCPU · {{ sku.memory_gb }}GB</div>
                      </div>
                      <div class="mt-1 text-xs font-semibold" :class="deployForm.sku_name === sku.name ? 'text-blue-600' : 'text-emerald-600'">
                        ${{ sku.price_per_hour.toFixed(2) }}/hr
                      </div>
                    </div>
                  </div>
                </el-form-item>

                <!-- Replicas -->
                <div class="flex gap-4">
                  <el-form-item :label="t('modelHub.hfSync.minReplica')" class="flex-1">
                    <el-select v-model="deployForm.min_replica" class="w-full">
                      <el-option v-for="n in [0,1,2,3]" :key="n" :label="n" :value="n" />
                    </el-select>
                  </el-form-item>
                  <el-form-item :label="t('modelHub.hfSync.maxReplica')" class="flex-1">
                    <el-select v-model="deployForm.max_replica" class="w-full">
                      <el-option v-for="n in [1,2,3,4,5]" :key="n" :label="n" :value="n" />
                    </el-select>
                  </el-form-item>
                </div>

                <el-alert v-if="deployError" :title="deployError" type="error" :closable="false" show-icon class="mt-2" />
              </el-form>
            </template>

            <!-- ═══ Footer ═══ -->
            <template #footer>
              <template v-if="importStep === 'import'">
                <el-button @click="importDialogVisible = false">{{ t('common.cancel') }}</el-button>
                <el-button type="primary" :loading="importing" @click="doImport">
                  {{ importing ? t('modelHub.hfSync.importing') : t('modelHub.hfSync.importAndNext') }}
                </el-button>
              </template>
              <template v-else>
                <el-button @click="skipDeploy">{{ t('modelHub.hfSync.skipDeploy') }}</el-button>
                <el-button
                  type="primary"
                  :loading="deploying"
                  :disabled="!canDeploy"
                  @click="doDeploy"
                >
                  {{ deploying ? t('modelHub.hfSync.deploying') : t('modelHub.hfSync.deployNow') }}
                </el-button>
              </template>
            </template>
          </el-dialog>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import TopNav from '../components/TopNav.vue'
// RepoCard and HubToolbar removed — platform tab now uses llm_configs
import { useAuthStore } from '../stores/auth'
import api from '../api/index'
import { listMyDeployments, listPublicGPUSkus, stopDeployment, deleteDeployment } from '../api/gpu'
import type { DeploymentWithCost, GPUSku } from '../api/gpu'
import { searchHFModels, importHFModel, fetchHFModelDetail, fetchTrendingHFModels } from '../api/hf'
import type { HFModel, HFModelDetail, HFTrendingSort } from '../api/hf'
import { listModelWeights, getWeightStatus, triggerWeightSync, listWeightFiles } from '../api/modelWeights'
import type { ModelWeightSync, SyncedFile } from '../api/modelWeights'
import { getRuntimeFrameworks, createServerlessService } from '../api/deployments'
import type { RuntimeFramework } from '../api/deployments'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()

// ─── Active tab ────────────────────────────────────────────────────────────────
const activeTab = ref<'platform' | 'aiServices' | 'weights' | 'hfSync'>('platform')

// ─── Platform Models (Tab 1) — only deployed/configured models ─────────────
interface PlatformModel {
  id: number
  model_name: string
  api_endpoint: string
  provider: string
  enabled: boolean
  price_input?: number
  price_output?: number
}

const platformModels = ref<PlatformModel[]>([])
const platformLoading = ref(false)
const platformSearch = ref('')
const platformProvider = ref('')

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: '#d97706', openai: '#10b981', google: '#3b82f6',
  mistral: '#8b5cf6', meta: '#1d4ed8', deepseek: '#0ea5e9', openrouter: '#6366f1',
}

function capitalise(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Other' }
function providerColor(p: string) { return PROVIDER_COLORS[(p || '').toLowerCase()] ?? '#6b7280' }
function shortenUrl(url: string) { try { return new URL(url).hostname } catch { return url } }

const platformProviders = computed(() => {
  const set = new Set(platformModels.value.map(m => m.provider).filter(Boolean))
  return Array.from(set).sort()
})

const filteredPlatformModels = computed(() => {
  return platformModels.value.filter(m => {
    if (platformSearch.value && !m.model_name.toLowerCase().includes(platformSearch.value.toLowerCase())) return false
    if (platformProvider.value && m.provider !== platformProvider.value) return false
    return true
  }).filter(m => m.enabled)   // only show active models
})

const groupedPlatformModels = computed(() => {
  const groups: Record<string, PlatformModel[]> = {}
  for (const m of filteredPlatformModels.value) {
    const key = m.provider || 'other'
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  }
  return Object.entries(groups)
    .map(([provider, models]) => ({ provider, models }))
    .sort((a, b) => a.provider.localeCompare(b.provider))
})

async function fetchPlatformModels() {
  platformLoading.value = true
  try {
    const res = await api.get<{ data: PlatformModel[] }>('/public/llm_configs')
    platformModels.value = res.data?.data ?? []
  } catch {
    platformModels.value = []
  } finally {
    platformLoading.value = false
  }
}

// ─── AI Services (Tab 2) ──────────────────────────────────────────────────────
interface AIModel {
  id: number
  model_name: string
  api_endpoint: string
  provider: string
  enabled: boolean
}

const aiModels = ref<AIModel[]>([])
const aiModelsLoading = ref(false)

async function fetchAiModels() {
  aiModelsLoading.value = true
  try {
    const res = await api.get<{ data: AIModel[] }>('/public/llm_configs')
    aiModels.value = (res.data?.data ?? []).filter((m) => m.enabled)
  } catch {
    aiModels.value = []
  } finally {
    aiModelsLoading.value = false
  }
}

function handleTryModel() {
  if (auth.isLoggedIn) {
    router.push('/app/playground')
  } else {
    router.push('/login')
  }
}

// ─── Model Weights (Tab 3) ────────────────────────────────────────────────────
const weights = ref<ModelWeightSync[]>([])
const weightsLoading = ref(false)
const retryingSyncIds = ref(new Set<number>())

async function fetchModelWeights() {
  if (!auth.isLoggedIn) return
  weightsLoading.value = true
  try {
    const res = await listModelWeights()
    weights.value = res.data?.data ?? []
    
    // Auto-refresh syncing models every 5 seconds
    const syncingWeights = weights.value.filter(w => w.status === 'syncing')
    if (syncingWeights.length > 0) {
      setTimeout(fetchModelWeights, 5000)
    }
  } catch (error) {
    console.error('Failed to fetch model weights:', error)
    weights.value = []
  } finally {
    weightsLoading.value = false
  }
}

async function retrySync(repoId: number) {
  retryingSyncIds.value.add(repoId)
  try {
    await triggerWeightSync(repoId)
    ElMessage.success(t('modelHub.weights.syncTriggered'))
    // Refresh the list
    setTimeout(fetchModelWeights, 1000)
  } catch (error) {
    console.error('Failed to retry sync:', error)
    ElMessage.error(t('modelHub.weights.syncFailed'))
  } finally {
    retryingSyncIds.value.delete(repoId)
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// GPU Deployments
const gpuDeployments = ref<DeploymentWithCost[]>([])
const gpuLoading = ref(false)

async function fetchGpuDeployments() {
  if (!auth.isLoggedIn) return
  gpuLoading.value = true
  try {
    const res = await listMyDeployments()
    gpuDeployments.value = res.data?.data ?? []
  } catch {
    gpuDeployments.value = []
  } finally {
    gpuLoading.value = false
  }
}

function gpuStatusClass(status: string): string {
  const map: Record<string, string> = {
    running: 'bg-green-100 text-green-700',
    stopped: 'bg-gray-100 text-gray-500',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
  }
  return map[status] ?? 'bg-gray-100 text-gray-500'
}

function gpuStatusLabel(status: string): string {
  const map: Record<string, string> = {
    running: t('gpu.running'),
    stopped: t('gpu.stopped'),
    pending: t('deployments.status.pending'),
    failed: t('deployments.status.failed'),
  }
  return map[status] ?? status
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString()
}

async function handleStopDeployment(id: number) {
  try {
    await ElMessageBox.confirm(t('gpu.confirmStop'), { type: 'warning' })
  } catch {
    return
  }
  try {
    await stopDeployment(id)
    ElMessage.success(t('gpu.stopSuccess'))
    fetchGpuDeployments()
  } catch {
    ElMessage.error(t('common.error'))
  }
}

async function handleDeleteDeployment(id: number) {
  try {
    await ElMessageBox.confirm(t('gpu.confirmDelete'), { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteDeployment(id)
    ElMessage.success(t('gpu.deleteSuccess'))
    fetchGpuDeployments()
  } catch {
    ElMessage.error(t('common.error'))
  }
}

// ─── HF Sync (Tab 3) ──────────────────────────────────────────────────────────

function openHFModel(id: string) {
  window.open(`https://huggingface.co/${id}`, '_blank')
}

// Trending
const hfTrending = ref<HFModel[]>([])
const hfTrendingLoading = ref(false)
const hfTrendingError = ref('')
const hfTrendingSort = ref<HFTrendingSort>('trendingScore')
const hfTrendingLimit = ref(50)
const hfTrendingCachedAt = ref<number | null>(null)

// Matches HuggingFace's official sort options
const trendingSortOptions: { value: HFTrendingSort; label: string; icon: string }[] = [
  { value: 'trendingScore', label: t('modelHub.hfSync.sortTrending'), icon: '🔥' },
  { value: 'likes',         label: t('modelHub.hfSync.sortLikes'),    icon: '❤️' },
  { value: 'downloads',     label: t('modelHub.hfSync.sortDownloads'), icon: '⬇️' },
  { value: 'lastModified',  label: t('modelHub.hfSync.sortLatest'),   icon: '🕒' },
]

async function loadTrending(forceRefresh = false) {
  hfTrendingLoading.value = true
  hfTrendingError.value = ''
  try {
    const res = await fetchTrendingHFModels(hfTrendingSort.value, hfTrendingLimit.value, forceRefresh)
    hfTrending.value = res.data
    hfTrendingCachedAt.value = res.cachedAt
  } catch (e: unknown) {
    hfTrendingError.value = e instanceof Error ? e.message : 'Failed to load trending models'
  } finally {
    hfTrendingLoading.value = false
  }
}

function setTrendingSort(sort: HFTrendingSort) {
  hfTrendingSort.value = sort
  loadTrending(false)
}

function formatCacheTime(ts: number): string {
  return new Date(ts).toLocaleTimeString()
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

// Search
const hfQuery = ref('')
const hfLastQuery = ref('')
const hfResults = ref<HFModel[]>([])
const hfSearching = ref(false)
const hfSearched = ref(false)

async function doHFSearch() {
  const q = hfQuery.value.trim()
  if (!q) return
  hfSearching.value = true
  hfSearched.value = false
  hfLastQuery.value = q
  try {
    hfResults.value = await searchHFModels(q, 30, hfTrendingSort.value)
    hfSearched.value = true
  } catch {
    hfResults.value = []
    hfSearched.value = true
  } finally {
    hfSearching.value = false
  }
}

function clearHFSearch() {
  hfQuery.value = ''
  hfSearched.value = false
  hfResults.value = []
  hfLastQuery.value = ''
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

// Import dialog
const importDialogVisible = ref(false)
const importing = ref(false)
const detailLoading = ref(false)
const hfDetail = ref<HFModelDetail | null>(null)
const importStep = ref<'import' | 'deploy'>('import')
const importedModelPath = ref('')  // e.g. "username/model-name"
const importForm = reactive({
  hf_model_id: '',
  target_name: '',
  description: '',
  license: 'other',
  sync_lfs: false,
})

// Deploy form (step 2)
const deployForm = reactive({
  deploy_name: '',
  runtime_framework_id: null as number | null,
  sku_name: '',
  min_replica: 1,
  max_replica: 2,
})
const deploying = ref(false)
const deployError = ref('')
const deployFrameworks = ref<RuntimeFramework[]>([])
const deployFrameworksLoading = ref(false)
const deploySkus = ref<GPUSku[]>([])
const deploySkusLoading = ref(false)

const skuResourceMap: Record<string, number> = {
  'cpu-8c-16g': 2,
  'nvidia-a100-80g-1x': 1,
  'nvidia-a100-80g-2x': 3,
  'nvidia-a100-80g-4x': 4,
  'nvidia-a100-80g-8x': 5,
  'nvidia-h100-80g-1x': 6,
  'nvidia-h100-80g-2x': 7,
  'nvidia-h100-80g-4x': 8,
  'nvidia-h100-80g-8x': 9,
}

const canDeploy = computed(() =>
  deployForm.deploy_name && deployForm.runtime_framework_id && deployForm.sku_name
)

function onImportDialogClosed() {
  importStep.value = 'import'
  deployError.value = ''
}

function formatSize(bytes: number): string {
  if (bytes >= 1_073_741_824) return (bytes / 1_073_741_824).toFixed(1) + ' GB'
  if (bytes >= 1_048_576) return (bytes / 1_048_576).toFixed(1) + ' MB'
  if (bytes >= 1_024) return (bytes / 1_024).toFixed(1) + ' KB'
  return bytes + ' B'
}

async function openImportDialog(model: HFModel) {
  importForm.hf_model_id = model.id
  importForm.target_name = model.id.split('/').pop() ?? model.id
  importForm.description = ''
  importForm.license = model.cardData?.license ?? 'other'
  importForm.sync_lfs = false
  hfDetail.value = null
  importStep.value = 'import'
  deployError.value = ''
  importDialogVisible.value = true

  // Fetch full metadata in background
  detailLoading.value = true
  try {
    const res = await fetchHFModelDetail(model.id)
    hfDetail.value = res.data?.data ?? null
    if (hfDetail.value) {
      // Auto-check sync_lfs if model has LFS files
      if (hfDetail.value.has_lfs) importForm.sync_lfs = true
      // Auto-fill license from model card
      if (!importForm.license || importForm.license === 'other') {
        importForm.license = hfDetail.value.info?.cardData?.license ?? 'other'
      }
    }
  } catch {
    // non-fatal, proceed without detail
  } finally {
    detailLoading.value = false
  }
}

async function doImport() {
  if (!auth.isLoggedIn) {
    router.push('/login')
    return
  }
  importing.value = true
  try {
    const res = await importHFModel(auth.username, {
      hf_model_id: importForm.hf_model_id,
      target_name: importForm.target_name,
      description: importForm.description,
      license: importForm.license,
      sync_lfs: importForm.sync_lfs,
    })

    // Build model path from response or form
    const data = res.data?.data
    const ns = data?.target_ns || auth.username
    const name = data?.target_name || importForm.target_name
    importedModelPath.value = `${ns}/${name}`

    // Pre-fill deploy form
    deployForm.deploy_name = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').substring(0, 40)
    deployForm.runtime_framework_id = null
    deployForm.sku_name = ''
    deployForm.min_replica = 1
    deployForm.max_replica = 2

    // Transition to step 2
    importStep.value = 'deploy'
    const isExisting = data?.status === 'exists'
    ElMessage.success(isExisting ? t('modelHub.hfSync.importExists') : t('modelHub.hfSync.importSuccess'))

    // Load frameworks + GPU SKUs in background
    loadDeployOptions()
  } catch {
    ElMessage.error(t('modelHub.hfSync.importError'))
  } finally {
    importing.value = false
  }
}

async function loadDeployOptions() {
  deployFrameworksLoading.value = true
  deploySkusLoading.value = true
  try {
    const [fwRes, skuRes] = await Promise.all([
      getRuntimeFrameworks(1),
      listPublicGPUSkus(),
    ])
    deployFrameworks.value = fwRes.data?.data ?? []
    deploySkus.value = (skuRes.data?.data ?? []).filter((s: GPUSku) => s.enabled)
    // Auto-select latest vllm
    const latestVllm = deployFrameworks.value.find(fw => fw.frame_name === 'vllm')
    if (latestVllm) deployForm.runtime_framework_id = latestVllm.id
  } catch {
    // non-fatal
  } finally {
    deployFrameworksLoading.value = false
    deploySkusLoading.value = false
  }
}

async function doDeploy() {
  if (!importedModelPath.value || !deployForm.deploy_name || !deployForm.runtime_framework_id || !deployForm.sku_name) return
  const parts = importedModelPath.value.split('/')
  const ns = parts[0] ?? ''
  const name = parts[1] ?? parts[0] ?? ''
  deploying.value = true
  deployError.value = ''

  // Auto-generate engine_args based on GPU count
  const selectedSku = deploySkus.value.find(s => s.name === deployForm.sku_name)
  const engineArgs: Record<string, string> = { 'max-model-len': '4096' }
  if (selectedSku && selectedSku.gpu_count > 1) {
    engineArgs['tensor-parallel-size'] = String(selectedSku.gpu_count)
  }

  try {
    await createServerlessService(ns, name, {
      deploy_name: deployForm.deploy_name,
      runtime_framework_id: deployForm.runtime_framework_id!,
      resource_id: skuResourceMap[deployForm.sku_name] || 0,
      min_replica: deployForm.min_replica,
      max_replica: deployForm.max_replica,
      engine_args: JSON.stringify(engineArgs),
      cluster_id: 'aitra-gpu-cluster',
    })
    importDialogVisible.value = false
    ElMessage.success(t('modelHub.hfSync.deploySuccess'))
    // Refresh platform models tab
    activeTab.value = 'platform'
    fetchPlatformModels()
  } catch (e: any) {
    deployError.value = e?.response?.data?.msg || t('common.error')
  } finally {
    deploying.value = false
  }
}

function skipDeploy() {
  importDialogVisible.value = false
  ElMessage.info(t('modelHub.hfSync.deploySkipped'))
}

// ─── Mount ────────────────────────────────────────────────────────────────────
onMounted(() => {
  fetchPlatformModels()
  fetchAiModels()
  loadTrending()
  if (auth.isLoggedIn) {
    fetchGpuDeployments()
    fetchModelWeights()
  }
})
</script>
