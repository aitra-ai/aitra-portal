import axios from 'axios'
import api from './index'

export interface HFModel {
  id: string
  author: string
  lastModified: string
  likes: number
  downloads: number
  tags: string[]
  gated: boolean | string
  private: boolean
  pipeline_tag?: string
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

/** Search HuggingFace model hub directly */
export const searchHFModels = async (query: string, limit = 20): Promise<HFModel[]> => {
  const res = await axios.get<HFModel[]>('https://huggingface.co/api/models', {
    params: { search: query, limit, full: true, sort: 'downloads' },
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
