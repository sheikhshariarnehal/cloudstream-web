import { api } from './client'
import type { HomePageResponseDTO, ProviderInfoDTO, SearchResponseDTO } from '../types/media'

export async function getProviders(): Promise<ProviderInfoDTO[]> {
  const res = await api.get<ProviderInfoDTO[]>('/providers')
  return res.data
}

export async function getHome(apiName?: string, page: number = 1): Promise<HomePageResponseDTO> {
  const params: Record<string, string | number> = { page }
  if (apiName) params.api = apiName
  const res = await api.get<HomePageResponseDTO>('/home', { params })
  return res.data
}

export async function getQuickSearch(query: string, apiName?: string): Promise<SearchResponseDTO[]> {
  const params: Record<string, string> = { q: query }
  if (apiName) params.api = apiName
  const res = await api.get<SearchResponseDTO[]>('/quicksearch', { params })
  return res.data
}
