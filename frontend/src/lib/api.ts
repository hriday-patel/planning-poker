export const apiUrl = (path: string) => {
  return path.startsWith("/") ? path : `/${path}`;
};

export const apiFetch = (path: string, init: RequestInit = {}) => {
  return fetch(apiUrl(path), {
    credentials: "include",
    ...init,
  });
};
