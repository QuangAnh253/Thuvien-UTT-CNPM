import { apiFetch } from './auth';

const normalizeScope = (scope: string) => encodeURIComponent(String(scope || '').trim());

export const getReadNotificationIds = async (scope: string): Promise<string[]> => {
  const res = await apiFetch(`/api/auth/preferences/${normalizeScope(scope)}`);
  if (res?.error) return [];
  return Array.isArray(res?.ids) ? res.ids.map((id: unknown) => String(id)) : [];
};

export const saveReadNotificationIds = async (scope: string, ids: string[]): Promise<string[]> => {
  const res = await apiFetch(`/api/auth/preferences/${normalizeScope(scope)}`, {
    method: 'PUT',
    body: JSON.stringify({ ids }),
  });
  if (res?.error) return [];
  return Array.isArray(res?.ids) ? res.ids.map((id: unknown) => String(id)) : [];
};

export const addReadNotificationId = async (scope: string, id: string): Promise<string[]> => {
  const res = await apiFetch(`/api/auth/preferences/${normalizeScope(scope)}`, {
    method: 'PATCH',
    body: JSON.stringify({ id }),
  });
  if (res?.error) return [];
  return Array.isArray(res?.ids) ? res.ids.map((value: unknown) => String(value)) : [];
};
