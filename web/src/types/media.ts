export interface SearchResponseDTO {
  name: string
  url: string
  apiName: string
  type?: string
  posterUrl?: string
  year?: number
  quality?: string
  id?: number
}

export interface HomePageListDTO {
  name: string
  list: SearchResponseDTO[]
  isHorizontalImages: boolean
}

export interface HomePageResponseDTO {
  apiName: string
  shelves: HomePageListDTO[]
}

export interface ActorDTO {
  name: string
  image?: string
  role?: string
}

export interface EpisodeDTO {
  name?: string
  season?: number
  episode?: number
  data: string
  posterUrl?: string
  synopsis?: string
  rating?: number
  date?: string
  isFiller?: boolean
}

export interface LoadResponseDTO {
  name: string
  url: string
  apiName: string
  type: string
  posterUrl?: string
  backgroundPosterUrl?: string
  year?: number
  plot?: string
  rating?: number
  tags: string[]
  duration?: string
  status?: string
  actors: ActorDTO[]
  episodes: EpisodeDTO[]
  recommendations: SearchResponseDTO[]
}

export interface StreamLinkDTO {
  name: string
  url: string
  rawUrl: string
  referer: string
  quality: number
  isM3u8: boolean
  headers: Record<string, string>
}

export interface SubtitleDTO {
  id?: string
  lang: string
  url: string
  autoSelect?: boolean
}

export interface LoadLinksResponseDTO {
  links: StreamLinkDTO[]
  subtitles: SubtitleDTO[]
}

export interface ProviderInfoDTO {
  name: string
  mainUrl: string
  supportedTypes: string[]
  hasMainPage: boolean
  hasQuickSearch: boolean
  lang: string
  iconUrl?: string
  isBuiltIn: boolean
  isEnabled: boolean
}

export interface SearchStreamEventDTO {
  apiName: string
  results: SearchResponseDTO[]
  isComplete: boolean
  error?: string
}

export interface AniSkipResponseDTO {
  found: boolean
  opStart?: number
  opEnd?: number
  edStart?: number
  edEnd?: number
}

export interface SavedRepoDTO {
  name: string
  url: string
}

export interface PluginManifestDTO {
  name: string
  internalName?: string
  description?: string
  url?: string
  version: number
  authors: string[]
  language?: string
  iconUrl?: string
  tvTypes: string[]
  status: number
  repositoryUrl?: string
}

export type WatchStatus = 'watching' | 'plan_to_watch' | 'completed' | 'on_hold' | 'dropped'

export interface BookmarkItem {
  url: string
  name: string
  apiName: string
  posterUrl?: string
  type?: string
  status: WatchStatus
  updatedAt: number
}

export interface WatchProgressItem {
  id: string // `${apiName}_${url}_s${season}_e${episode}`
  mediaUrl: string
  mediaName: string
  apiName: string
  episodeTitle?: string
  season?: number
  episode?: number
  progressSeconds: number
  durationSeconds: number
  posterUrl?: string
  updatedAt: number
}
