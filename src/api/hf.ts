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
}

export interface HFImportResponse {
  msg: string
  data: {
    repository_id: number
    hf_model_id: string
    target_name: string
    target_ns: string
  }
}

export const searchHFModels = async (query: string, limit = 20): Promise<HFModel[]> => {
  const res = await axios.get<HFModel[]>('https://huggingface.co/api/models', {
    params: { search: query, limit, full: false, sort: 'downloads' },
  })
  return res.data
}

// username is not needed in the URL — the backend resolves it from the auth token
export const importHFModel = (
  _username: string,
  data: {
    hf_model_id: string
    target_name?: string
    description?: string
    license?: string
    sync_lfs?: boolean
  },
) => {
  return api.post<HFImportResponse>(`/user/hf/import`, data)
}
