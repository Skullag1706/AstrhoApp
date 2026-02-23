import { apiClient } from './apiClient';

export interface Supply {
    insumoId: number;
    sku: string;
    nombre: string;
    descripcion?: string;
    categoriaId: number;
    categoriaNombre?: string;
    marcaId: number;
    marcaNombre?: string;
    estado: boolean;
    fechaCreacion?: string;
    fechaActualizacion?: string;
}

export const supplyService = {
    async getSupplies(): Promise<Supply[]> {
        return apiClient.get('/Insumo');
    },

    async createSupply(supply: Omit<Supply, 'insumoId'>): Promise<Supply> {
        return apiClient.post('/Insumo', supply);
    },

    async updateSupply(id: number, supply: Partial<Supply>): Promise<Supply> {
        return apiClient.put(`/Insumo/${id}`, supply);
    },

    async deleteSupply(id: number): Promise<void> {
        return apiClient.delete(`/Insumo/${id}`);
    }
};
