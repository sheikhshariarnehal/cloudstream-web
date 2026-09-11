import React from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface ProviderProgressInfo {
  name: string
  count: number
  status: 'pending' | 'done' | 'error'
}

interface ProviderChipsProps {
  providersStatus: Record<string, ProviderProgressInfo>
  selectedFilterProvider?: string
  onToggleFilter: (providerName: string) => void
}

export const ProviderChips: React.FC<ProviderChipsProps> = ({
  providersStatus,
  selectedFilterProvider,
  onToggleFilter,
}) => {
  const entries = Object.values(providersStatus)
  if (entries.length === 0) return null

  return (
    <div className="provider-chip-row">
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
        Providers:
      </span>
      {entries.map((p) => {
        const isSelected = selectedFilterProvider === p.name
        return (
          <button
            key={p.name}
            onClick={() => onToggleFilter(p.name)}
            className={`provider-chip ${isSelected ? 'active' : ''}`}
            style={{
              borderColor: p.status === 'done' ? 'rgba(59, 130, 246, 0.4)' : undefined,
            }}
          >
            {p.status === 'done' && <CheckCircle2 size={13} color="#3b82f6" />}
            {p.status === 'error' && <AlertCircle size={13} color="#ef4444" />}
            {p.name}
            <span style={{ background: 'rgba(255,255,255,0.12)', padding: '1px 6px', borderRadius: 8, fontSize: '0.75rem' }}>
              {p.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
