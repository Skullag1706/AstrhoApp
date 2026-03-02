const BASE_URL = 'http://www.astrhoapp.somee.com/api';

// ── JWT Token Management ──
let _token: string | null = null;

export function setAuthToken(token: string) {
    _token = token;
}

export function clearAuthToken() {
    _token = null;
}

/** Build headers for every request, injecting Bearer token when available */
function getHeaders(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
        'Accept': 'application/json',
        ...extra,
    };
    if (_token) {
        headers['Authorization'] = `Bearer ${_token}`;
    }
    return headers;
}

export const apiClient = {
    async get(endpoint: string) {
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                headers: getHeaders()
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Status: ${response.status}, Endpoint: ${endpoint}, Body:`, errorText);
                throw new Error(`API GET Error: ${endpoint} -> Status ${response.status}: ${errorText || response.statusText}`);
            }
            return response.json();
        } catch (error) {
            console.error(`API GET error on ${endpoint}:`, error);
            throw error;
        }
    },

    async post(endpoint: string, data: any) {
        try {
            const isFormData = data instanceof FormData;
            const extra: Record<string, string> = {};

            if (!isFormData) {
                extra['Content-Type'] = 'application/json';
            }

            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: getHeaders(extra),
                body: isFormData ? data : JSON.stringify(data),
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`POST Error Status: ${response.status}, Endpoint: ${endpoint}, Body:`, errorText);
                throw new Error(`Error posting to ${endpoint} (${response.status}): ${errorText || response.statusText}`);
            }
            return response.json();
        } catch (error) {
            console.error(`API POST error on ${endpoint}:`, error);
            throw error;
        }
    },

    async put(endpoint: string, data: any) {
        try {
            const isFormData = data instanceof FormData;
            const extra: Record<string, string> = {};

            if (!isFormData) {
                extra['Content-Type'] = 'application/json';
            }

            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: getHeaders(extra),
                body: isFormData ? data : JSON.stringify(data),
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`PUT Error Status: ${response.status}, Endpoint: ${endpoint}, Body:`, errorText);
                throw new Error(`API PUT Error: ${endpoint} -> Status ${response.status}: ${errorText || response.statusText}`);
            }
            // Handle 204 No Content
            if (response.status === 204 || response.headers.get('content-length') === '0') {
                return null;
            }
            const text = await response.text();
            if (!text || text.trim() === '') {
                return null;
            }
            return JSON.parse(text);
        } catch (error) {
            console.error(`API PUT error on ${endpoint}:`, error);
            throw error;
        }
    },

    async delete(endpoint: string) {
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API DELETE Error: ${endpoint} -> Status ${response.status}: ${errorText || response.statusText}`);
            }
            // Some APIs return 204 No Content for DELETE
            if (response.status === 204) return null;
            return response.json();
        } catch (error) {
            console.error(`API DELETE error on ${endpoint}:`, error);
            throw error;
        }
    }
};
