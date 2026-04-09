// Helper quản lý auth token + user info

// Base URL cho API - hỗ trợ production qua VITE_API_URL
const BASE_URL = 'https://utt-library-backend.onrender.com';

export const getToken = (): string | null =>
  localStorage.getItem('token')

export const getUser = () => {
  const u = localStorage.getItem('user')
  return u ? JSON.parse(u) : null
}

export const setAuth = (token: string, user: object) => {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export const clearAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const isLoggedIn = (): boolean => !!getToken()

// Helper to construct full API URL
export const getApiUrl = (path: string): string => {
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
};

// Wrapper fetch tự động thêm Bearer token
export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = getToken()
  const fullUrl = getApiUrl(url)
  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  // Auto logout nếu token hết hạn
  if (res.status === 401) {
    clearAuth()
    window.location.href = '/login'
    return { error: 'Phiên đăng nhập hết hạn' }
  }

  const contentType = res.headers.get('content-type') || ''
  const text = await res.text()
  let data: any = text

  if (contentType.includes('application/json') && text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    if (data && typeof data === 'object' && 'error' in data) {
      return data
    }

    const message = typeof data === 'string' && data.trim() ? data.trim() : `Lỗi server (${res.status})`
    return { error: message }
  }

  if (contentType.includes('application/json')) {
    return text ? JSON.parse(text) : null
  }

  return text ? { message: text } : null
}