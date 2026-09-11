import { api } from './client'
import type { PluginManifestDTO, SavedRepoDTO } from '../types/media'

export async function getSavedRepos(): Promise<SavedRepoDTO[]> {
  const res = await api.get<SavedRepoDTO[]>('/repos')
  return res.data
}

export async function addRepo(name: string, url: string): Promise<void> {
  await api.post('/repos', { name, url })
}

export async function removeRepo(url: string): Promise<void> {
  await api.delete('/repos', { params: { url } })
}

export async function getRepoPlugins(url: string): Promise<PluginManifestDTO[]> {
  const res = await api.get<PluginManifestDTO[]>('/plugins/repo', { params: { url } })
  return res.data
}

export async function installPlugin(manifest: PluginManifestDTO): Promise<void> {
  await api.post('/plugins/install', manifest)
}

export async function togglePlugin(name: string, enabled: boolean): Promise<void> {
  await api.post('/plugins/toggle', { name, enabled })
}
