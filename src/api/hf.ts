import axios from 'axios'
import api from './index'

export interface HFModel {
  id: string
  author: string
  lastModified: string
  createdAt: string
  likes: number
  downloads: number
  trendingScore?: number
  tags: string[]
  gated: boolean | string
  private: boolean
  pipeline_tag?: string
  library_name?: string
  cardData?: {
    license?: string
    language?: string[]
  }
}

export interface HFFileEntry {
  type: 'file' | 'directory'
  path: string
  size: number
  lfs?: { size: number }
}

export interface HFModelDetail {
  info: HFModel
  files: HFFileEntry[]
  has_lfs: boolean
  readme: string
}

export interface HFImportStatus {
  hf_model_id: string
  target_ns: string
  target_name: string
  repository_id: number
  status: 'queued' | 'syncing' | 'done' | 'error'
  files: HFFileEntry[]
  has_lfs: boolean
}

const HF_TRENDING_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

/** Matches HuggingFace's sort options exactly */
export type HFTrendingSort = 'trendingScore' | 'likes' | 'downloads' | 'lastModified'

function getTrendingCache(sort: HFTrendingSort, limit: number): HFModel[] | null {
  try {
    const key = `hf_trending_${sort}_${limit}`
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { ts: number; data: HFModel[] }
    if (Date.now() - parsed.ts > HF_TRENDING_CACHE_TTL) return null
    return parsed.data
  } catch {
    return null
  }
}

function setTrendingCache(sort: HFTrendingSort, limit: number, data: HFModel[]): void {
  try {
    const key = `hf_trending_${sort}_${limit}`
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }))
  } catch {}
}

/** Fetch trending/top HuggingFace models with 24h local cache */
export const fetchTrendingHFModels = async (
  sort: HFTrendingSort = 'likes',
  limit = 50,
  forceRefresh = false,
): Promise<{ data: HFModel[]; fromCache: boolean; cachedAt: number | null }> => {
  if (!forceRefresh) {
    const cached = getTrendingCache(sort, limit)
    if (cached) {
      const key = `hf_trending_${sort}_${limit}`
      let cachedAt: number | null = null
      try { cachedAt = JSON.parse(localStorage.getItem(key) ?? '{}').ts ?? null } catch {}
      return { data: cached, fromCache: true, cachedAt }
    }
  }
  const res = await axios.get<HFModel[]>('https://huggingface.co/api/models', {
    params: { sort, direction: -1, limit, full: true },
    timeout: 15000,
  })
  setTrendingCache(sort, limit, res.data)
  return { data: res.data, fromCache: false, cachedAt: Date.now() }
}

/** Search HuggingFace model hub directly */
export const searchHFModels = async (
  query: string,
  limit = 30,
  sort: HFTrendingSort = 'trendingScore',
): Promise<HFModel[]> => {
  const res = await axios.get<HFModel[]>('https://huggingface.co/api/models', {
    params: { search: query, limit, full: true, sort, direction: -1 },
    timeout: 10000,
  })
  return res.data
}

/** Fetch full model metadata + file list via our backend (avoids CORS on file tree API) */
export const fetchHFModelDetail = (id: string) =>
  api.get<{ msg: string; data: HFModelDetail }>(`/user/hf/model-info`, { params: { id } })

/** Import a HuggingFace model into the platform */
export const importHFModel = (
  _username: string,
  data: {
    hf_model_id: string
    target_name?: string
    description?: string
    license?: string
    sync_lfs?: boolean
  },
) => api.post<{ msg: string; data: HFImportStatus }>(`/user/hf/import`, data)
