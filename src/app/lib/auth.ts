// Helper quản lý auth token + user info

// Base URL cho API.
// - Ưu tiên VITE_API_URL (dùng khi FE/BE khác domain)
// - Nếu chạy local mà không set env thì fallback localhost:3001
// - Production không fallback localhost để tránh lỗi ERR_CONNECTION_REFUSED
const envApiUrl = String(import.meta.env.VITE_API_URL || '').trim();
const isBrowser = typeof window !== 'undefined';
const isLocalBrowser =
  isBrowser && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
const fallbackApiUrl = isLocalBrowser ? 'http://localhost:3001' : '';
const BASE_URL = (envApiUrl || fallbackApiUrl).replace(/\/+$/, '');

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

const redirectToLogin = () => {
  clearAuth()
  if (isBrowser) {
    window.location.assign('/login')
  }
}

// Helper to construct full API URL
export const getApiUrl = (path: string): string => {
  if (path.startsWith('http')) return path;
  return BASE_URL ? `${BASE_URL}${path}` : path;
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
    redirectToLogin()
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
    if (typeof data === 'string') {
      const cannotGetMatch = data.match(/Cannot\s+(GET|POST|PUT|DELETE|PATCH)\s+([^<\n]+)/i)
      if (cannotGetMatch) {
        return { error: `API chưa hỗ trợ endpoint: ${cannotGetMatch[2].trim()}` }
      }

      if (data.includes('<!DOCTYPE html')) {
        return { error: `API trả về lỗi HTTP ${res.status}. Vui lòng kiểm tra backend đã deploy đúng phiên bản.` }
      }
    }

    const errorText = typeof data === 'string' ? data : JSON.stringify(data || {})
    const authFailurePattern = /phiên đăng nhập không hợp lệ|đã hết hạn|chưa xác thực|invalid token|jwt|không tìm thấy token|token/i
    const permissionDeniedPattern = /không có quyền|không được phép|forbidden/i
    const shouldLogout =
      res.status === 401 ||
      (res.status === 403 && authFailurePattern.test(errorText) && !permissionDeniedPattern.test(errorText))

    if (shouldLogout) {
      redirectToLogin()
      return { error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' }
    }

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