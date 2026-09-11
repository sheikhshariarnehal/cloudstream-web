import React, { useState, useEffect, useRef } from 'react'
import {
  Settings as SettingsIcon,
  Server,
  Download,
  Upload,
  Trash2,
  CheckCircle,
  AlertCircle,
  Play,
  FastForward,
  Subtitles,
  Info,
  RotateCcw
} from 'lucide-react'
import { api } from '../../api/client'
import { exportBackupJson, importBackupJson, db } from '../../services/db'

export const SettingsView: React.FC = () => {
  const [serverHealth, setServerHealth] = useState<{ status: string; providers: number } | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)
  const [autoPlayNext, setAutoPlayNext] = useState(() => localStorage.getItem('cs_autoplay_next') !== 'false')
  const [autoSkipIntro, setAutoSkipIntro] = useState(() => localStorage.getItem('cs_autoskip_intro') !== 'false')
  const [defaultSubtitleLang, setDefaultSubtitleLang] = useState(() => localStorage.getItem('cs_sub_lang') || 'English')
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    checkServer()
  }, [])

  const checkServer = async () => {
    try {
      const res = await api.get('/health')
      setServerHealth(res.data)
      setHealthError(null)
    } catch (err: any) {
      setHealthError(err.message || 'Unable to connect to local Ktor engine')
      setServerHealth(null)
    }
  }

  const handleToggleAutoPlay = () => {
    const val = !autoPlayNext
    setAutoPlayNext(val)
    localStorage.setItem('cs_autoplay_next', String(val))
  }

  const handleToggleAutoSkip = () => {
    const val = !autoSkipIntro
    setAutoSkipIntro(val)
    localStorage.setItem('cs_autoskip_intro', String(val))
  }

  const handleSubLangChange = (lang: string) => {
    setDefaultSubtitleLang(lang)
    localStorage.setItem('cs_sub_lang', lang)
  }

  const handleExportBackup = async () => {
    try {
      const json = await exportBackupJson()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cloudstream_backup_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showStatus('Backup exported successfully!', 'success')
    } catch (err: any) {
      showStatus('Failed to export backup: ' + err.message, 'error')
    }
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async event => {
      try {
        const text = event.target?.result as string
        await importBackupJson(text)
        showStatus('Backup restored successfully!', 'success')
      } catch (err: any) {
        showStatus('Invalid backup file: ' + err.message, 'error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all watch history and continue watching progress?')) return
    try {
      await db.progress.clear()
      showStatus('Watch history cleared.', 'success')
    } catch (err: any) {
      showStatus('Failed to clear history: ' + err.message, 'error')
    }
  }

  const handleClearBookmarks = async () => {
    if (!confirm('Are you sure you want to clear all bookmarks and library entries?')) return
    try {
      await db.bookmarks.clear()
      showStatus('Library bookmarks cleared.', 'success')
    } catch (err: any) {
      showStatus('Failed to clear bookmarks: ' + err.message, 'error')
    }
  }

  const showStatus = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type })
    setTimeout(() => setStatusMessage(null), 4000)
  }

  return (
    <div className="settings-view" style={{ padding: '2rem 3rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
          <SettingsIcon color="var(--color-primary)" size={28} /> Settings & Preferences
        </h1>
        <p style={{ color: 'var(--color-text-dim)', marginTop: '0.4rem', fontSize: '0.95rem' }}>
          Configure streaming preferences, local storage, and check backend health.
        </p>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: statusMessage.type === 'success' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${statusMessage.type === 'success' ? '#4ade80' : '#ef4444'}`,
            color: statusMessage.type === 'success' ? '#4ade80' : '#ef4444'
          }}
        >
          {statusMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Section 1: Server Status */}
      <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Server size={20} color="var(--color-primary)" /> Backend Engine Status
        </h3>

        {serverHealth ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Core Engine</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4ade80', marginTop: '0.2rem' }}>
                ONLINE (Ktor JVM)
              </div>
            </div>
            <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Active Providers</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', marginTop: '0.2rem' }}>
                {serverHealth.providers} Ready
              </div>
            </div>
            <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>HLS Stream Proxy</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.2rem' }}>
                ACTIVE (:8080)
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px' }}>
            <span style={{ color: '#f87171' }}>{healthError || 'Checking server status...'}</span>
            <button
              onClick={checkServer}
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                cursor: 'pointer'
              }}
            >
              Retry Connection
            </button>
          </div>
        )}
      </div>

      {/* Section 2: Player Preferences */}
      <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Play size={20} color="var(--color-primary)" /> Playback Experience
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Autoplay toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>Auto-play Next Episode</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>Automatically start the next episode when current video reaches the end.</div>
            </div>
            <input
              type="checkbox"
              checked={autoPlayNext}
              onChange={handleToggleAutoPlay}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
            />
          </div>

          {/* Autoskip toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FastForward size={16} color="#38bdf8" /> Auto-Skip Opening & Outro (AniSkip)
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>Seamlessly jump past theme songs and credit rolls using AniSkip timestamps.</div>
            </div>
            <input
              type="checkbox"
              checked={autoSkipIntro}
              onChange={handleToggleAutoSkip}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
            />
          </div>

          {/* Preferred Subtitle Language */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Subtitles size={16} /> Preferred Subtitle Language
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>Default language to auto-select when subtitle tracks are loaded.</div>
            </div>
            <select
              value={defaultSubtitleLang}
              onChange={e => handleSubLangChange(e.target.value)}
              style={{
                background: 'var(--color-bg)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="English">English</option>
              <option value="Bengali">Bengali</option>
              <option value="Hindi">Hindi</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Arabic">Arabic</option>
              <option value="Japanese">Japanese</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 3: Data & Backup */}
      <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Download size={20} color="var(--color-primary)" /> Data & Cloud Backup
        </h3>

        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', marginBottom: '1.25rem' }}>
          Your history, bookmarks, and settings are stored locally in your browser's IndexedDB. Export a JSON backup to keep them safe or sync to another device.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <button
            onClick={handleExportBackup}
            style={{
              padding: '0.75rem 1.25rem',
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Download size={18} /> Export JSON Backup
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '0.75rem 1.25rem',
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Upload size={18} /> Restore from JSON Backup
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            style={{ display: 'none' }}
          />
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem', display: 'flex', gap: '1rem' }}>
          <button
            onClick={handleClearHistory}
            style={{
              padding: '0.6rem 1rem',
              background: 'transparent',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              borderRadius: '6px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Trash2 size={15} /> Clear Watch History
          </button>

          <button
            onClick={handleClearBookmarks}
            style={{
              padding: '0.6rem 1rem',
              background: 'transparent',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              borderRadius: '6px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <RotateCcw size={15} /> Clear All Bookmarks
          </button>
        </div>
      </div>

      {/* Section 4: About */}
      <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Info size={20} color="var(--color-primary)" /> About CloudStream Web Edition
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', lineHeight: 1.5 }}>
          CloudStream Web Edition runs official CloudStream 3 scrapers, extractors, and .cs3 plugins in a native headless JVM server with Dex-to-JVM bytecode translation. It features dynamic HLS playlist rewriting and upstream spoofing to bypass CORS and anti-hotlinking protections directly from any web browser.
        </p>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', marginTop: '0.75rem' }}>
          Version 1.0.0 &bull; CloudStream 3 Parity Engine
        </div>
      </div>
    </div>
  )
}
