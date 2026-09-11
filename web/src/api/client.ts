import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  timeout: 45000,
})

// Ensure /api prefix is always present and never stripped by leading slashes
api.interceptors.request.use((config) => {
  if (config.url && !config.url.startsWith('http')) {
    const cleanUrl = config.url.startsWith('/') ? config.url : '/' + config.url
    if (!cleanUrl.startsWith('/api')) {
      config.url = cleanUrl // baseURL '/api' + cleanUrl resolves to /api/... when baseURL is used
    }
  }
  return config
})

// Validate that API responses are parsed JSON, not HTML fallback
api.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string' && response.data.trim().toLowerCase().startsWith('<!doctype html')) {
      return Promise.reject(new Error('Server proxy returned HTML instead of JSON API response'))
    }
    return response
  },
  (error) => {
    return Promise.reject(error)
  }
)
