import { apiClient } from './apiClient';

export interface Supply {
    insumoId: number;
    sku: string;
    nombre: string;
    descripcion?: string;
    categoriaId: number;
    categoriaNombre?: string;
    estado: boolean;
    stock: number;
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
    },

    async getSupplyById(id: number): Promise<Supply> {
        const raw = await apiClient.get(`/Insumo/${id}`);
        // Unwrap $values if the API returns a wrapped object
        if (raw && raw.$values) return raw.$values;
        return raw;
    },

    async updateStock(insumoId: number, delta: number): Promise<Supply> {
        // 1. Fetch the full current supply
        const supply = await supplyService.getSupplyById(insumoId);
        const currentStock = supply.stock ?? 0;
        const newStock = Math.max(0, currentStock + delta);

        // 2. Send full object to the PUT endpoint
        const updatePayload: any = {
            sku: supply.sku,
            nombre: supply.nombre,
            descripcion: supply.descripcion ?? '',
            categoriaId: supply.categoriaId,
            estado: supply.estado,
            stock: newStock,
        };

        const result = await apiClient.put(`/Insumo/${insumoId}`, updatePayload);
        if (!result) {
            return { ...supply, stock: newStock };
        }
        return result as Supply;
    }
};
