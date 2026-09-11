import React from 'react'
import { Film, Search, Bookmark, Layers, Settings } from 'lucide-react'

interface SidebarProps {
  currentTab: string
  onTabChange: (tab: string) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  return (
    <aside className="cinema-sidebar">
      <button
        className={`sidebar-btn ${currentTab === 'home' ? 'active' : ''}`}
        onClick={() => onTabChange('home')}
        title="Home"
      >
        <Film size={22} />
      </button>

      <button
        className={`sidebar-btn ${currentTab === 'search' ? 'active' : ''}`}
        onClick={() => onTabChange('search')}
        title="Discover & Search"
      >
        <Search size={22} />
      </button>

      <button
        className={`sidebar-btn ${currentTab === 'library' ? 'active' : ''}`}
        onClick={() => onTabChange('library')}
        title="My Library & Watchlist"
      >
        <Bookmark size={22} />
      </button>

      <button
        className={`sidebar-btn ${currentTab === 'plugins' ? 'active' : ''}`}
        onClick={() => onTabChange('plugins')}
        title="Extensions & Providers"
      >
        <Layers size={22} />
      </button>

      <button
        className={`sidebar-btn ${currentTab === 'settings' ? 'active' : ''}`}
        onClick={() => onTabChange('settings')}
        title="Settings & Backup"
      >
        <Settings size={22} />
      </button>
    </aside>
  )
}
