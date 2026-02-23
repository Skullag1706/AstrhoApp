import { apiClient } from './apiClient';

export interface Service {
    servicioId: number;
    nombre: string;
    descripcion: string;
    precio: number;
    duracion: number;
    estado: boolean;
    imagen?: string; // Columna directa en la tabla Servicios
    categoriaId?: number;
    fechaCreacion?: string;
    fechaActualizacion?: string;
}

export const serviceService = {
    async getServices(): Promise<Service[]> {
        return apiClient.get('/Servicios');
    },

    async createService(service: Omit<Service, 'servicioId'> | FormData): Promise<Service> {
        return apiClient.post('/Servicios', service);
    },

    async updateService(id: number, service: Partial<Service> | FormData): Promise<Service> {
        return apiClient.put(`/Servicios/${id}`, service);
    },

    async deleteService(id: number): Promise<void> {
        return apiClient.delete(`/Servicios/${id}`);
    }
};
