const BASE_URL = 'http://astrhoapp.somee.com/api';

export const apiClient = {
    async get(endpoint: string) {
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) {
                const errorText = await response.text();
                // Extremely verbose logging for 500 debugging
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
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorText = await response.text();
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
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API PUT Error: ${endpoint} -> Status ${response.status}: ${errorText || response.statusText}`);
            }
            return response.json();
        } catch (error) {
            console.error(`API PUT error on ${endpoint}:`, error);
            throw error;
        }
    },

    async delete(endpoint: string) {
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json'
                }
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
