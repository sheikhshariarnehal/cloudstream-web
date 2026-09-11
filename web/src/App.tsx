import React, { useState, useEffect, useRef } from 'react'
import type {
  ProviderInfoDTO,
  SearchResponseDTO,
  LoadResponseDTO,
  EpisodeDTO,
  StreamLinkDTO,
  SubtitleDTO,
  AniSkipResponseDTO,
  WatchProgressItem,
} from './types/media'
import { getProviders, getHome } from './api/catalogApi'
import { streamSearch } from './api/searchApi'
import { getMediaDetails, getStreamLinks } from './api/mediaApi'
import { api } from './api/client'

// Layout Components
import { Navbar } from './components/layout/Navbar'
import { Sidebar } from './components/layout/Sidebar'

// Home Components
import { BillboardHero } from './components/home/BillboardHero'
import { ContinueWatchingRow } from './components/home/ContinueWatchingRow'
import { ShelfCarousel } from './components/home/ShelfCarousel'

// Search Components
import { SearchBar } from './components/search/SearchBar'
import { ProviderChips } from './components/search/ProviderChips'
import { SearchResultsGrid } from './components/search/SearchResultsGrid'

// Details & Player
import { MediaHero } from './components/details/MediaHero'
import { SeasonEpisodePicker } from './components/details/SeasonEpisodePicker'
import { CinemaVideoPlayer } from './components/player/CinemaVideoPlayer'

// Library, Plugins & Settings
import { LibraryView } from './components/library/LibraryView'
import { PluginsView } from './components/plugins/PluginsView'
import { SettingsView } from './components/settings/SettingsView'

import { X, RefreshCw, AlertCircle, Film } from 'lucide-react'

export const App: React.FC = () => {
  // Navigation & Providers
  const [activeTab, setActiveTab] = useState<string>('home')
  const [providers, setProviders] = useState<ProviderInfoDTO[]>([])
  const [selectedHomeProvider, setSelectedHomeProvider] = useState<string>('VegaMovies')
  
  // Home state
  const [homeShelves, setHomeShelves] = useState<{ name: string; list: SearchResponseDTO[] }[]>([])
  const [spotlightItem, setSpotlightItem] = useState<SearchResponseDTO | null>(null)
  const [loadingHome, setLoadingHome] = useState<boolean>(false)
  const [homeError, setHomeError] = useState<string | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchTypeFilter, setSearchTypeFilter] = useState<string>('all')
  const [searchResults, setSearchResults] = useState<SearchResponseDTO[]>([])
  const [providerStatus, setProviderStatus] = useState<
    Record<string, { name: string; count: number; status: 'pending' | 'done' | 'error' }>
  >({})
  const [selectedFilterProvider, setSelectedFilterProvider] = useState<string | undefined>(undefined)
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const searchCleanupRef = useRef<(() => void) | null>(null)

  // Details Modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false)
  const [mediaDetails, setMediaDetails] = useState<LoadResponseDTO | null>(null)
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  // Video Player state
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(false)
  const [playerInfo, setPlayerInfo] = useState<{
    title: string
    subTitle?: string
    mediaUrl: string
    apiName: string
    season?: number
    episode?: number
    posterUrl?: string
    episodeData?: string
  } | null>(null)
  const [streamLinks, setStreamLinks] = useState<StreamLinkDTO[]>([])
  const [streamSubtitles, setStreamSubtitles] = useState<SubtitleDTO[]>([])
  const [streamAniSkip, setStreamAniSkip] = useState<AniSkipResponseDTO | undefined>(undefined)
  const [nextEpisode, setNextEpisode] = useState<EpisodeDTO | undefined>(undefined)
  const [loadingStream, setLoadingStream] = useState<boolean>(false)
  const [streamError, setStreamError] = useState<string | null>(null)

  // Load providers on mount
  useEffect(() => {
    loadProvidersList()
  }, [])

  const loadProvidersList = async () => {
    try {
      const list = await getProviders()
      setProviders(list)
      // Pick first provider with home page or default to VegaMovies
      const homeProv = list.find((p) => p.name === 'VegaMovies') || list.find((p) => p.hasMainPage) || list[0]
      if (homeProv) {
        setSelectedHomeProvider(homeProv.name)
      }
    } catch (err) {
      console.error('Failed to load providers', err)
    }
  }

  // Load Home Shelves whenever selectedHomeProvider changes
  useEffect(() => {
    if (!selectedHomeProvider) return
    loadHome(selectedHomeProvider)
  }, [selectedHomeProvider])

  const loadHome = async (provName: string) => {
    setLoadingHome(true)
    setHomeError(null)
    try {
      const data = await getHome(provName)
      const shelves = data.shelves || []
      setHomeShelves(shelves)

      // Set billboard spotlight to first item with a poster
      for (const shelf of shelves) {
        const itemWithPoster = shelf.list.find((i) => i.posterUrl)
        if (itemWithPoster) {
          setSpotlightItem(itemWithPoster)
          break
        }
      }
    } catch (err: any) {
      console.error('Failed to load home catalog', err)
      setHomeError(err.message || 'Failed to load catalog for ' + provName)
      setHomeShelves([])
    } finally {
      setLoadingHome(false)
    }
  }

  // Handle Search Input with debounce & SSE stream
  useEffect(() => {
    if (!searchQuery.trim()) {
      if (searchCleanupRef.current) {
        searchCleanupRef.current()
        searchCleanupRef.current = null
      }
      setSearchResults([])
      setProviderStatus({})
      setIsSearching(false)
      return
    }

    const timer = setTimeout(() => {
      startParallelSearch(searchQuery.trim())
    }, 400)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const startParallelSearch = (query: string) => {
    if (searchCleanupRef.current) {
      searchCleanupRef.current()
      searchCleanupRef.current = null
    }

    setIsSearching(true)
    setSearchResults([])
    setProviderStatus({})

    // Init statuses
    const initialStatuses: Record<string, { name: string; count: number; status: 'pending' | 'done' | 'error' }> = {}
    providers.forEach((p) => {
      initialStatuses[p.name] = { name: p.name, count: 0, status: 'pending' }
    })
    setProviderStatus(initialStatuses)

    searchCleanupRef.current = streamSearch(
      query,
      undefined,
      (event) => {
        if (event.results && event.results.length > 0) {
          setSearchResults((prev) => [...prev, ...event.results])
        }
        setProviderStatus((prev) => ({
          ...prev,
          [event.apiName]: {
            name: event.apiName,
            count: (prev[event.apiName]?.count || 0) + (event.results?.length || 0),
            status: event.isComplete ? (event.error ? 'error' : 'done') : 'pending',
          },
        }))
      },
      () => {
        setIsSearching(false)
      },
      (err) => {
        console.error('Search SSE error', err)
        setIsSearching(false)
      }
    )
  }

  // Open Media Details
  const handleOpenDetails = async (item: SearchResponseDTO) => {
    setDetailsModalOpen(true)
    setLoadingDetails(true)
    setDetailsError(null)

    try {
      const details = await getMediaDetails(item.apiName, item.url)
      setMediaDetails(details)
    } catch (err: any) {
      console.error('Failed to load media details', err)
      setDetailsError(err.message || 'Failed to load details')
    } finally {
      setLoadingDetails(false)
    }
  }

  // Start Streaming
  const handleStartStreaming = async (
    media: SearchResponseDTO | LoadResponseDTO,
    episode?: EpisodeDTO
  ) => {
    setLoadingStream(true)
    setStreamError(null)

    const title = media.name
    const subTitle = episode ? (episode.name || `Episode ${episode.episode}`) : undefined
    const mediaUrl = media.url
    const apiName = media.apiName
    const season = episode?.season ?? 1
    const epNum = episode?.episode ?? 1
    const poster = episode?.posterUrl || media.posterUrl
    const dataToLoad = episode?.data || media.url

    // Find next episode if applicable
    let nextEp: EpisodeDTO | undefined = undefined
    if (mediaDetails && mediaDetails.episodes && episode) {
      const currIdx = mediaDetails.episodes.findIndex((e) => e.data === episode.data)
      if (currIdx !== -1 && currIdx < mediaDetails.episodes.length - 1) {
        nextEp = mediaDetails.episodes[currIdx + 1]
      }
    }

    try {
      const linksRes = await getStreamLinks(apiName, dataToLoad)
      if (!linksRes.links || linksRes.links.length === 0) {
        throw new Error('No streamable video links found for this source.')
      }

      // Check for AniSkip if Anime
      let aniskipData: AniSkipResponseDTO | undefined = undefined
      if (media.type === 'Anime') {
        try {
          const skipRes = await api.get<AniSkipResponseDTO>('/meta/aniskip', {
            params: { name: title, episode: epNum },
          })
          if (skipRes.data?.found) {
            aniskipData = skipRes.data
          }
        } catch {
          // ignore aniskip errors
        }
      }

      setPlayerInfo({
        title,
        subTitle,
        mediaUrl,
        apiName,
        season,
        episode: epNum,
        posterUrl: poster,
        episodeData: dataToLoad,
      })
      setStreamLinks(linksRes.links)
      setStreamSubtitles(linksRes.subtitles || [])
      setStreamAniSkip(aniskipData)
      setNextEpisode(nextEp)
      setIsPlayerOpen(true)
    } catch (err: any) {
      console.error('Failed to load stream links', err)
      setStreamError(err.message || 'Failed to extract video links.')
    } finally {
      setLoadingStream(false)
    }
  }

  // Handle Resume from Continue Watching
  const handleResumeContinueWatching = async (item: WatchProgressItem) => {
    // Open player directly
    setLoadingStream(true)
    setStreamError(null)
    try {
      const linksRes = await getStreamLinks(item.apiName, item.mediaUrl)
      if (!linksRes.links || linksRes.links.length === 0) {
        throw new Error('No streams found for resume item.')
      }

      setPlayerInfo({
        title: item.mediaName,
        subTitle: item.episodeTitle,
        mediaUrl: item.mediaUrl,
        apiName: item.apiName,
        season: item.season,
        episode: item.episode,
        posterUrl: item.posterUrl,
      })
      setStreamLinks(linksRes.links)
      setStreamSubtitles(linksRes.subtitles || [])
      setIsPlayerOpen(true)
    } catch (err: any) {
      console.error('Failed to resume video', err)
      setStreamError(err.message || 'Unable to resume stream.')
    } finally {
      setLoadingStream(false)
    }
  }

  // Filter search results
  const filteredSearchResults = searchResults.filter((item) => {
    const matchesType =
      searchTypeFilter === 'all' ||
      item.type?.toLowerCase() === searchTypeFilter.toLowerCase()
    const matchesProvider =
      !selectedFilterProvider || item.apiName === selectedFilterProvider
    return matchesType && matchesProvider
  })

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Navbar */}
        <Navbar
          currentTab={activeTab}
          onTabChange={setActiveTab}
          providers={providers}
          selectedProvider={selectedHomeProvider}
          onSelectProvider={(p) => setSelectedHomeProvider(p)}
          onSelectMedia={handleOpenDetails}
        />

        {/* Tab 1: Home View */}
        {activeTab === 'home' && (
          <div className="tab-home">
            {/* Spotlight Billboard */}
            {spotlightItem && (
              <BillboardHero
                item={spotlightItem}
                onPlay={(item) => handleOpenDetails(item)}
                onDetails={(item) => handleOpenDetails(item)}
              />
            )}

            {/* Continue Watching Row */}
            <ContinueWatchingRow onResume={handleResumeContinueWatching} />

            {/* Provider Switcher / Header Bar */}
            <div style={{ padding: '24px 48px 8px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Film size={22} color="var(--accent-red)" />
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                  Catalog: {selectedHomeProvider}
                </h2>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => loadHome(selectedHomeProvider)}
                  disabled={loadingHome}
                  className="player-icon-btn"
                  style={{ background: 'var(--bg-surface-elevated)', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
                >
                  <RefreshCw size={14} className={loadingHome ? 'spin' : ''} />
                  Reload
                </button>
              </div>
            </div>

            {/* Loading / Error States */}
            {loadingHome && (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
                <RefreshCw size={36} className="spin" style={{ marginBottom: 16, color: 'var(--accent-red)' }} />
                <p>Loading home catalog from {selectedHomeProvider}...</p>
              </div>
            )}

            {homeError && (
              <div style={{ margin: '32px 48px', padding: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 8, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 12 }}>
                <AlertCircle size={20} />
                <span>{homeError}</span>
              </div>
            )}

            {/* Shelves */}
            {!loadingHome &&
              homeShelves.map((shelf, idx) => (
                <ShelfCarousel
                  key={`${shelf.name}_${idx}`}
                  title={shelf.name}
                  items={shelf.list}
                  onSelectMedia={handleOpenDetails}
                />
              ))}
          </div>
        )}

        {/* Tab 2: Discover / Search View */}
        {activeTab === 'search' && (
          <div className="tab-search">
            <SearchBar
              query={searchQuery}
              onChangeQuery={setSearchQuery}
              selectedType={searchTypeFilter}
              onSelectType={setSearchTypeFilter}
              isSearching={isSearching}
            />

            {Object.keys(providerStatus).length > 0 && (
              <div style={{ padding: '0 36px 16px 36px' }}>
                <ProviderChips
                  providersStatus={providerStatus}
                  selectedFilterProvider={selectedFilterProvider}
                  onToggleFilter={(p) =>
                    setSelectedFilterProvider((prev) => (prev === p ? undefined : p))
                  }
                />
              </div>
            )}

            <div style={{ padding: '16px 36px 48px 36px' }}>
              <SearchResultsGrid
                results={filteredSearchResults}
                onSelectMedia={handleOpenDetails}
                isSearching={isSearching}
              />
            </div>
          </div>
        )}

        {/* Tab 3: Library View */}
        {activeTab === 'library' && (
          <LibraryView
            onSelectMedia={(item) =>
              handleOpenDetails({
                name: item.name,
                url: item.url,
                apiName: item.apiName,
                posterUrl: item.posterUrl,
                type: item.type,
              })
            }
          />
        )}

        {/* Tab 4: Plugins & Extensions */}
        {activeTab === 'plugins' && <PluginsView />}

        {/* Tab 5: Settings */}
        {activeTab === 'settings' && <SettingsView />}
      </div>

      {/* Media Details Modal */}
      {detailsModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            overflowY: 'auto',
            display: 'flex',
            justifyContent: 'center',
            padding: '40px 20px',
          }}
          onClick={() => setDetailsModalOpen(false)}
        >
          <div
            style={{
              position: 'relative',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: 1100,
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
              border: '1px solid var(--border-subtle)',
              alignSelf: 'flex-start',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setDetailsModalOpen(false)}
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50%',
                color: '#fff',
                padding: 8,
                cursor: 'pointer',
                zIndex: 50,
              }}
            >
              <X size={20} />
            </button>

            {loadingDetails ? (
              <div style={{ textAlign: 'center', padding: '120px 20px', color: 'var(--text-muted)' }}>
                <RefreshCw size={36} className="spin" style={{ marginBottom: 16, color: 'var(--accent-red)' }} />
                <p>Scraping full metadata and episode catalog...</p>
              </div>
            ) : detailsError ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#ef4444' }}>
                <AlertCircle size={40} style={{ marginBottom: 16 }} />
                <p>{detailsError}</p>
              </div>
            ) : mediaDetails ? (
              <>
                <MediaHero
                  media={mediaDetails}
                  onPlayFirstEpisode={() => {
                    const firstEp = mediaDetails.episodes && mediaDetails.episodes.length > 0
                      ? mediaDetails.episodes[0]
                      : undefined
                    handleStartStreaming(mediaDetails, firstEp)
                  }}
                />

                {mediaDetails.episodes && mediaDetails.episodes.length > 0 && (
                  <SeasonEpisodePicker
                    episodes={mediaDetails.episodes}
                    onSelectEpisode={(ep) => handleStartStreaming(mediaDetails, ep)}
                    currentPlayingEpisodeData={playerInfo?.episodeData}
                  />
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Cinema Video Player Overlay */}
      {isPlayerOpen && playerInfo && streamLinks.length > 0 && (
        <CinemaVideoPlayer
          title={playerInfo.title}
          subTitle={playerInfo.subTitle}
          mediaUrl={playerInfo.mediaUrl}
          apiName={playerInfo.apiName}
          season={playerInfo.season}
          episode={playerInfo.episode}
          posterUrl={playerInfo.posterUrl}
          links={streamLinks}
          subtitles={streamSubtitles}
          aniskip={streamAniSkip}
          nextEpisode={nextEpisode}
          onNextEpisode={() => {
            if (nextEpisode && mediaDetails) {
              handleStartStreaming(mediaDetails, nextEpisode)
            }
          }}
          onClose={() => setIsPlayerOpen(false)}
        />
      )}

      {/* Stream Extraction Loading Overlay */}
      {loadingStream && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            color: '#fff',
          }}
        >
          <RefreshCw size={44} className="spin" color="var(--accent-red)" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
            Extracting Streams &amp; Resolving Proxies
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Running provider extractors and bypassing anti-hotlink protections...
          </p>
        </div>
      )}

      {/* Stream Error Toast */}
      {streamError && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'rgba(239, 68, 68, 0.95)',
            color: '#fff',
            padding: '14px 20px',
            borderRadius: 8,
            zIndex: 2100,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          <AlertCircle size={20} />
          <span>{streamError}</span>
          <button
            onClick={() => setStreamError(null)}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: 8 }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

export default App
