import { apiClient } from './apiClient';

export interface Supply {
    insumoId: number;
    sku: string;
    nombre: string;
    descripcion?: string;
    categoriaId: number;
    categoriaNombre?: string;
    estado: boolean;
}

export const supplyService = {
    async getSupplies(): Promise<Supply[]> {
        return apiClient.get('/Insumo');
    },

    async createSupply(supply: Omit<Supply, 'insumoId'>): Promise<Supply> {
        return apiClient.post('/Insumo', supply);
    },

    async updateSupply(id: number, supply: Partial<Supply>): Promise<Supply> {
        const BASE_URL = 'http://www.astrhoapp.somee.com/api';
        const response = await fetch(`${BASE_URL}/Insumo/${id}`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(supply)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API PUT Error: /Insumo/${id} -> Status ${response.status}: ${errorText || response.statusText}`);
        }
        // 204 No Content - return the sent data as the updated object
        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return { ...supply, insumoId: id } as Supply;
        }
        // Try to parse JSON, fall back to sent data if body is empty
        const text = await response.text();
        if (!text || text.trim() === '') {
            return { ...supply, insumoId: id } as Supply;
        }
        return JSON.parse(text) as Supply;
    },

    async deleteSupply(id: number): Promise<void> {
        return apiClient.delete(`/Insumo/${id}`);
    }
};
