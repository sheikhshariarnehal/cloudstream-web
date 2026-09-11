import { api } from './client'
import type { LoadLinksResponseDTO, LoadResponseDTO } from '../types/media'

export async function getMediaDetails(apiName: string, url: string): Promise<LoadResponseDTO> {
  const res = await api.get<LoadResponseDTO>('/load', {
    params: {
      api: apiName,
      url,
    },
  })
  return res.data
}

export async function getStreamLinks(apiName: string, data: string): Promise<LoadLinksResponseDTO> {
  const res = await api.get<LoadLinksResponseDTO>('/loadLinks', {
    params: {
      api: apiName,
      data,
    },
  })
  return res.data
}
