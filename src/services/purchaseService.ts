import { apiClient } from './apiClient';

// ── Response Interfaces ──

export interface PurchaseDetailAPI {
    detalleCompraId: number;
    insumoId: number;
    insumoNombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
}

export interface PurchaseAPI {
    compraId: number;
    fechaRegistro: string;
    proveedorId: number;
    proveedorNombre: string;
    iva: number;
    subtotal: number;
    total: number;
    estado: boolean;
    detalles: PurchaseDetailAPI[];
}

// ── Request Interfaces ──

export interface CreatePurchaseItem {
    insumoId: number;
    cantidad: number;
    precioUnitario: number;
}

export interface CreatePurchaseRequest {
    proveedorId: number;
    iva: number;
    items: CreatePurchaseItem[];
}

export interface UpdatePurchaseRequest {
    proveedorId: number;
    iva: number;
    estado: boolean;
}

// ── Service ──

export const purchaseService = {
    getAll: async (): Promise<PurchaseAPI[]> => {
        return apiClient.get('/Compras');
    },

    getById: async (id: number): Promise<PurchaseAPI> => {
        return apiClient.get(`/Compras/${id}`);
    },

    create: async (data: CreatePurchaseRequest): Promise<PurchaseAPI> => {
        return apiClient.post('/Compras', data);
    },

    update: async (id: number, data: UpdatePurchaseRequest): Promise<PurchaseAPI> => {
        const result = await apiClient.put(`/Compras/${id}`, data);
        if (!result) {
            return { compraId: id, ...data } as unknown as PurchaseAPI;
        }
        return result as PurchaseAPI;
    }
};
