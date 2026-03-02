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
        const result = await apiClient.put(`/Insumo/${id}`, supply);
        // If API returns 204 No Content (apiClient returns null), build the response
        if (!result) {
            return { ...supply, insumoId: id } as Supply;
        }
        return result as Supply;
    },

    async deleteSupply(id: number): Promise<void> {
        return apiClient.delete(`/Insumo/${id}`);
    }
};
