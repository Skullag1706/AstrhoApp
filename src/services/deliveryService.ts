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
    documentoEmpleado: string;
    detalles: {
        insumoId: number;
        cantidad: number;
    }[];
}

// Map Backend DTO to Frontend Model
const mapBackendToDelivery = (data: any): Delivery => {
    if (!data) return {} as Delivery;

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
        // Fallback or explicit pendiene
        estado = s ? (s.charAt(0).toUpperCase() + s.slice(1)) : 'Pendiente';
    }

    return {
        id: data.entregainsumoId || data.id,
        usuarioId: data.usuarioId,
        documentoEmpleado: data.documentoEmpleado,
        fechaCreado: data.fechaCreado,
        fechaEntrega: data.fechaEntrega,
        fechaCompletado: data.fechaCompletado,
        estado: estado,
        cantidadItems: data.cantidadItems || (data.detalles ? data.detalles.length : 0),
        detalles: data.detalles?.map((d: any) => ({
            insumoId: d.insumoId,
            cantidad: d.cantidad,
            insumoNombre: d.insumoNombre,
            sku: d.sku
        })) || []
    };
};

export const deliveryService = {
    // GET ALL
    async getDeliveries(): Promise<Delivery[]> {
        const response = await apiClient.get('/Entregas');
        if (!Array.isArray(response)) return [];
        return response.map(mapBackendToDelivery);
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
