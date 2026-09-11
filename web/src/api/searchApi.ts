import type { SearchResponseDTO, SearchStreamEventDTO } from '../types/media'
import { api } from './client'

export function streamSearch(
  query: string,
  apis?: string[],
  onResult?: (event: SearchStreamEventDTO) => void,
  onComplete?: () => void,
  onError?: (err: any) => void
): () => void {
  const params = new URLSearchParams()
  params.set('q', query)
  if (apis && apis.length > 0) {
    params.set('apis', apis.join(','))
  }

  const url = `/api/search?${params.toString()}`
  const eventSource = new EventSource(url)

  eventSource.onmessage = (e) => {
    try {
      const data: SearchStreamEventDTO = JSON.parse(e.data)
      if (data.isComplete) {
        eventSource.close()
        onComplete?.()
      } else {
        onResult?.(data)
      }
    } catch (err) {
      console.error('Error parsing SSE event', err)
    }
  }

  eventSource.onerror = (err) => {
    eventSource.close()
    onError?.(err)
  }

  return () => {
    eventSource.close()
  }
}

export async function syncSearch(query: string): Promise<SearchResponseDTO[]> {
  const res = await api.get<SearchResponseDTO[]>('/search/sync', { params: { q: query } })
  return res.data
}
