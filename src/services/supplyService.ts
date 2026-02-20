import { apiClient } from './apiClient';

export interface Supply {
    insumoId: number;
    nombre: string;
    descripcion: string;
    sku: string;
    marca: string;
    precioCosto: number;
    stockActual: number;
    stockMinimo: number;
    stockMaximo?: number;
    unidad: string;
    estado: boolean;
    categoriaId: number;
    categoriaNombre?: string;
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
