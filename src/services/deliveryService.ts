import { apiClient } from './apiClient';

export interface DeliveryDetail {
    insumoId: number;
    cantidad: number;
    insumoNombre?: string;
    sku?: string;
}

export interface Delivery {
    id: number;
    usuarioId: number;
    documentoEmpleado: string;
    fechaCreado: string;
    fechaEntrega: string;
    fechaCompletado?: string | null;
    estado: string;
    cantidadItems: number;
    detalles?: DeliveryDetail[];
}

export interface CreateDeliveryData {
    usuarioId: number;
    fechaEntrega: string;
    documentoEmpleado: string;
    detalles: {
        insumoId: number;
        cantidad: number;
    }[];
}

// Map Backend DTO to Frontend Model
const mapBackendToDelivery = (data: any): Delivery => {
    if (!data) return {} as Delivery;
    
    // DEBUG: Ver la estructura real que llega del backend
    console.log("Raw delivery from API:", data);

    // Unwrap $values if present
    const rawDetalles = data.detalles?.$values || data.detalles || 
                        data.Detalles?.$values || data.Detalles || 
                        data.detallesEntregas?.$values || data.detallesEntregas || 
                        data.DetallesEntregas?.$values || data.DetallesEntregas || 
                        data.detalleEntrega?.$values || data.detalleEntrega || 
                        data.DetalleEntrega?.$values || data.DetalleEntrega || [];
    
    // More resilient property access for status
    let estadoRaw = data.estado || data.Estado || data.status || data.Status || '';
    let estado = estadoRaw.toString();
    const s = estado.toLowerCase();

    // Map backend technical terms to user-facing terms
    if (s.includes('entregado') || s.includes('completed') || s.includes('completado')) {
        estado = 'Completado';
    } else if (s.includes('cancelado') || s.includes('cancelled')) {
        estado = 'Cancelado';
    } else if (s.includes('pendiente') || s.includes('pending')) {
        estado = 'Pendiente';
    } else {
        estado = s ? (s.charAt(0).toUpperCase() + s.slice(1)) : 'Pendiente';
    }

    const mappedDetalles = Array.isArray(rawDetalles) ? rawDetalles.map((d: any) => ({
        insumoId: d.insumoId ?? d.InsumoId ?? 0,
        cantidad: d.cantidad ?? d.Cantidad ?? 0,
        insumoNombre: d.insumoNombre ?? d.InsumoNombre,
        sku: d.sku ?? d.Sku ?? d.SKU
    })) : [];

    // Calculate total units (sum of quantities)
    const totalUnits = mappedDetalles.reduce((acc, item) => acc + (item.cantidad || 0), 0);

    return {
        id: data.entregainsumoId || data.id,
        usuarioId: data.usuarioId,
        documentoEmpleado: data.documentoEmpleado,
        fechaCreado: data.fechaCreado,
        fechaEntrega: data.fechaEntrega,
        fechaCompletado: data.fechaCompletado,
        estado: estado,
        cantidadItems: mappedDetalles.length > 0
            ? mappedDetalles.length
            : (data.cantidadItems ?? data.CantidadItems ?? data.totalItems ?? data.totalInsumos ?? 0),
        detalles: mappedDetalles,
        _rawKeys: Object.keys(data).join(', ')
    } as any;
};

export const deliveryService = {
    // GET ALL
    async getDeliveries(): Promise<Delivery[]> {
        const response: any = await apiClient.get('/Entregas');
        
        // Unwrap $values for top level
        const data = response?.$values || response;
        if (!Array.isArray(data)) return [];
        
        return data.map(mapBackendToDelivery);
    },

    // GET ONE
    async getDeliveryById(id: number): Promise<Delivery> {
        const response = await apiClient.get(`/Entregas/${id}`);
        return mapBackendToDelivery(response);
    },

    // CREATE
    async createDelivery(data: CreateDeliveryData): Promise<Delivery> {
        // The API Expects CrearEntregaDto: { documentoEmpleado, detalles: [ { insumoId, cantidad } ] }
        const response = await apiClient.post('/Entregas', data);
        return mapBackendToDelivery(response);
    },

    // UPDATE STATUS (via PUT /api/Entregas/{id})
    async updateDelivery(id: number, data: any): Promise<Delivery> {
        // According to swagger: ActualizarEntregaDto { documentoEmpleado, estado, detalles: [ { insumoId, cantidad } ] }
        const response = await apiClient.put(`/Entregas/${id}`, data);

        // Handle 204 No Content
        if (!response) {
            // Map technical backend status back to frontend label
            let mappedStatus = 'Pendiente';
            if (data.estado === 'entregado') mappedStatus = 'Completado';
            else if (data.estado === 'cancelado') mappedStatus = 'Cancelado';

            return {
                id,
                ...data,
                estado: mappedStatus
            } as any;
        }

        return mapBackendToDelivery(response);
    }
};
