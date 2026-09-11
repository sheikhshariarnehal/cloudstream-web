import React, { useState, useEffect } from 'react'
import {
  Download,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Package,
  Layers,
  Sparkles
} from 'lucide-react'
import {
  getSavedRepos,
  addRepo,
  removeRepo,
  getRepoPlugins,
  installPlugin,
  togglePlugin
} from '../../api/pluginsApi'
import { getProviders } from '../../api/catalogApi'
import type { SavedRepoDTO, PluginManifestDTO, ProviderInfoDTO } from '../../types/media'

const POPULAR_SHORTCODES = [
  { name: 'Megarepo', code: 'megarepo', desc: 'Curated English & Multi-language Providers' },
  { name: 'CloudStream PR', code: 'cspr', desc: 'Main community extensions repo' },
  { name: 'Phisher Repo', code: 'phisherrepo', desc: 'Anime, Movies & High-speed sources' },
  { name: 'CSX Repo', code: 'csx', desc: 'Specialized providers & tools' },
]

export const PluginsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'installed' | 'repos'>('installed')
  const [installedProviders, setInstalledProviders] = useState<ProviderInfoDTO[]>([])
  const [repos, setRepos] = useState<SavedRepoDTO[]>([])
  const [selectedRepo, setSelectedRepo] = useState<SavedRepoDTO | null>(null)
  const [repoPlugins, setRepoPlugins] = useState<PluginManifestDTO[]>([])
  const [loadingPlugins, setLoadingPlugins] = useState(false)
  const [installingPlugin, setInstallingPlugin] = useState<string | null>(null)
  
  // Add repo input
  const [newRepoName, setNewRepoName] = useState('')
  const [newRepoUrl, setNewRepoUrl] = useState('')
  const [addingRepo, setAddingRepo] = useState(false)
  const [repoError, setRepoError] = useState<string | null>(null)
  
  // Search filter
  const [pluginFilter, setPluginFilter] = useState('')
  const [installedFilter, setInstalledFilter] = useState('')

  useEffect(() => {
    loadProviders()
    loadRepos()
  }, [])

  const loadProviders = async () => {
    try {
      const list = await getProviders()
      setInstalledProviders(list)
    } catch (err) {
      console.error('Failed to load installed providers', err)
    }
  }

  const loadRepos = async () => {
    try {
      const list = await getSavedRepos()
      setRepos(list)
      if (list.length > 0 && !selectedRepo) {
        handleSelectRepo(list[0])
      }
    } catch (err) {
      console.error('Failed to load repositories', err)
    }
  }

  const handleSelectRepo = async (repo: SavedRepoDTO) => {
    setSelectedRepo(repo)
    setLoadingPlugins(true)
    try {
      const plugins = await getRepoPlugins(repo.url)
      setRepoPlugins(plugins)
    } catch (err) {
      console.error('Failed to load repo plugins', err)
      setRepoPlugins([])
    } finally {
      setLoadingPlugins(false)
    }
  }

  const handleAddRepo = async (name: string, url: string) => {
    if (!url.trim()) return
    setAddingRepo(true)
    setRepoError(null)
    try {
      await addRepo(name.trim() || 'Repository', url.trim())
      setNewRepoName('')
      setNewRepoUrl('')
      await loadRepos()
    } catch (err: any) {
      setRepoError(err.response?.data || 'Failed to add repository')
    } finally {
      setAddingRepo(false)
    }
  }

  const handleRemoveRepo = async (url: string) => {
    if (!confirm('Remove this repository?')) return
    try {
      await removeRepo(url)
      if (selectedRepo?.url === url) {
        setSelectedRepo(null)
        setRepoPlugins([])
      }
      await loadRepos()
    } catch (err) {
      console.error('Failed to delete repo', err)
    }
  }

  const handleToggleProvider = async (provider: ProviderInfoDTO) => {
    const nextState = !provider.isEnabled
    try {
      await togglePlugin(provider.name, nextState)
      setInstalledProviders(prev =>
        prev.map(p => (p.name === provider.name ? { ...p, isEnabled: nextState } : p))
      )
    } catch (err) {
      console.error('Failed to toggle provider', err)
    }
  }

  const handleInstallPlugin = async (manifest: PluginManifestDTO) => {
    setInstallingPlugin(manifest.name)
    try {
      await installPlugin(manifest)
      await loadProviders()
    } catch (err) {
      alert('Failed to install plugin: ' + err)
    } finally {
      setInstallingPlugin(null)
    }
  }

  const filteredInstalled = installedProviders.filter(p =>
    p.name.toLowerCase().includes(installedFilter.toLowerCase()) ||
    p.lang.toLowerCase().includes(installedFilter.toLowerCase())
  )

  const filteredRepoPlugins = repoPlugins.filter(p =>
    p.name.toLowerCase().includes(pluginFilter.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(pluginFilter.toLowerCase()))
  )

  return (
    <div className="plugins-view" style={{ padding: '2rem 3rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
            <Package color="var(--color-primary)" size={28} /> Extensions & Plugins
          </h1>
          <p style={{ color: 'var(--color-text-dim)', marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Direct Android .cs3 plugin compatibility layer running seamlessly in your browser.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: 'var(--color-card)', padding: '0.3rem', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
          <button
            onClick={() => setActiveTab('installed')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.2rem',
              borderRadius: '7px',
              border: 'none',
              background: activeTab === 'installed' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'installed' ? '#fff' : 'var(--color-text-dim)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Layers size={16} /> Installed ({installedProviders.length})
          </button>
          <button
            onClick={() => setActiveTab('repos')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.2rem',
              borderRadius: '7px',
              border: 'none',
              background: activeTab === 'repos' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'repos' ? '#fff' : 'var(--color-text-dim)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Sparkles size={16} /> Repositories ({repos.length})
          </button>
        </div>
      </div>

      {/* Tab: Installed Providers */}
      {activeTab === 'installed' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', width: '360px' }}>
              <Search size={18} color="var(--color-text-dim)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Filter installed providers..."
                value={installedFilter}
                onChange={e => setInstalledFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text)',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <button
              onClick={loadProviders}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-card)',
                color: 'var(--color-text)',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={15} /> Refresh List
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.2rem' }}>
            {filteredInstalled.map(provider => (
              <div
                key={provider.name}
                style={{
                  background: 'var(--color-card)',
                  border: `1px solid ${provider.isEnabled ? 'var(--color-border)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  opacity: provider.isEnabled ? 1 : 0.6,
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                      {provider.name}
                    </h3>
                    <button
                      onClick={() => handleToggleProvider(provider)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: provider.isEnabled ? '#4ade80' : 'var(--color-text-dim)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title={provider.isEnabled ? 'Click to Disable' : 'Click to Enable'}
                    >
                      {provider.isEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: 'var(--color-text-dim)' }}>
                      Lang: {provider.lang.toUpperCase()}
                    </span>
                    {(provider.supportedTypes || []).map((t: string) => (
                      <span key={t} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(229,9,20,0.15)', color: 'var(--color-primary)', fontWeight: 600 }}>
                        {t}
                      </span>
                    ))}
                    {provider.hasMainPage && (
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                        Home Catalog
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={14} color={provider.isEnabled ? '#4ade80' : '#888'} />
                    {provider.isEnabled ? 'Active in Search' : 'Disabled'}
                  </span>
                  {provider.mainUrl && (
                    <a
                      href={provider.mainUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--color-text-dim)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      Source <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Repositories & Install */}
      {activeTab === 'repos' && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '2rem' }}>
          {/* Left Column: Repo Management */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text)' }}>
              Add Repository
            </h3>

            {/* Quick Shortcode Badges */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '0.5rem' }}>
                Quick Add Popular Repos:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {POPULAR_SHORTCODES.map(item => (
                  <button
                    key={item.code}
                    onClick={() => handleAddRepo(item.name, item.code)}
                    disabled={addingRepo}
                    style={{
                      background: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      padding: '0.6rem 0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: 'var(--color-text)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>{item.desc}</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(229,9,20,0.15)', color: 'var(--color-primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                      +{item.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL Input */}
            <div style={{ background: 'var(--color-card)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '0.35rem' }}>
                  Repository Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Custom Mega Repo"
                  value={newRepoName}
                  onChange={e => setNewRepoName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    color: 'var(--color-text)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '0.35rem' }}>
                  Shortcode or plugins.json URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. megarepo or https://..."
                  value={newRepoUrl}
                  onChange={e => setNewRepoUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    color: 'var(--color-text)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              {repoError && (
                <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertCircle size={14} /> {repoError}
                </div>
              )}

              <button
                onClick={() => handleAddRepo(newRepoName, newRepoUrl)}
                disabled={addingRepo || !newRepoUrl.trim()}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  background: 'var(--color-primary)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: addingRepo || !newRepoUrl.trim() ? 'not-allowed' : 'pointer',
                  opacity: addingRepo || !newRepoUrl.trim() ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Plus size={16} /> {addingRepo ? 'Adding...' : 'Add Repository'}
              </button>
            </div>

            {/* Saved Repos List */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2rem', marginBottom: '1rem', color: 'var(--color-text)' }}>
              Saved Repositories ({repos.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {repos.map(repo => {
                const isSelected = selectedRepo?.url === repo.url
                return (
                  <div
                    key={repo.url}
                    onClick={() => handleSelectRepo(repo)}
                    style={{
                      background: isSelected ? 'rgba(229,9,20,0.1)' : 'var(--color-card)',
                      border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: '8px',
                      padding: '0.8rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ overflow: 'hidden', paddingRight: '0.5rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isSelected ? 'var(--color-primary)' : 'var(--color-text)' }}>
                        {repo.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {repo.url}
                      </div>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleRemoveRepo(repo.url)
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-dim)',
                        cursor: 'pointer',
                        padding: '0.3rem'
                      }}
                      title="Delete Repository"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: Plugins Inside Selected Repo */}
          <div>
            {selectedRepo ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                      {selectedRepo.name}
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>{selectedRepo.url}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '280px' }}>
                      <Search size={16} color="var(--color-text-dim)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        placeholder="Search plugins in repo..."
                        value={pluginFilter}
                        onChange={e => setPluginFilter(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                          background: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          color: 'var(--color-text)',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                    <button
                      onClick={() => handleSelectRepo(selectedRepo)}
                      style={{
                        padding: '0.55rem 0.75rem',
                        background: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        color: 'var(--color-text)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <RefreshCw size={14} /> Refresh
                    </button>
                  </div>
                </div>

                {loadingPlugins ? (
                  <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-dim)' }}>
                    <RefreshCw size={32} className="spin" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                    <p>Fetching repository plugins manifest...</p>
                  </div>
                ) : filteredRepoPlugins.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-card)', borderRadius: '12px', color: 'var(--color-text-dim)' }}>
                    <Package size={40} style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
                    <p>No plugins found matching criteria in this repository.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {filteredRepoPlugins.map(plugin => {
                      const isInstalled = installedProviders.some(p => p.name === plugin.name)
                      const isBusy = installingPlugin === plugin.name

                      return (
                        <div
                          key={plugin.internalName || plugin.name}
                          style={{
                            background: 'var(--color-card)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '10px',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                                {plugin.name}
                              </h4>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', background: 'rgba(255,255,255,0.06)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                                v{plugin.version}
                              </span>
                            </div>

                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', margin: '0.4rem 0 0.8rem 0', minHeight: '2.4rem', lineHeight: '1.3' }}>
                              {plugin.description || 'No description provided.'}
                            </p>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                              {plugin.tvTypes?.map(t => (
                                <span key={t} style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '3px', background: 'rgba(229,9,20,0.15)', color: 'var(--color-primary)', fontWeight: 600 }}>
                                  {t}
                                </span>
                              ))}
                              {plugin.authors?.map(a => (
                                <span key={a} style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-dim)' }}>
                                  by {a}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <button
                              onClick={() => handleInstallPlugin(plugin)}
                              disabled={isBusy}
                              style={{
                                width: '100%',
                                padding: '0.6rem',
                                borderRadius: '6px',
                                border: 'none',
                                background: isInstalled ? 'rgba(74, 222, 128, 0.15)' : 'var(--color-primary)',
                                color: isInstalled ? '#4ade80' : '#fff',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                cursor: isBusy ? 'wait' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {isBusy ? (
                                <>
                                  <RefreshCw size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Installing...
                                </>
                              ) : isInstalled ? (
                                <>
                                  <CheckCircle2 size={15} /> Installed / Reinstall
                                </>
                              ) : (
                                <>
                                  <Download size={15} /> Install Plugin
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '5rem', background: 'var(--color-card)', borderRadius: '12px', color: 'var(--color-text-dim)' }}>
                <Sparkles size={40} style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
                <p>Select a repository on the left or add one to browse available plugins.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
