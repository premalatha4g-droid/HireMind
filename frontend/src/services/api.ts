const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem('hiremind_token');
  const headers = {
    ...options.headers,
  };

  // If body is not FormData, add default JSON header
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  // Handle empty responses
  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export default apiFetch;
