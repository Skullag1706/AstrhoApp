import { apiClient } from './apiClient';

export interface SupplierAPI {
    proveedorId?: number;
    tipoProveedor: string;
    nombre: string;
    tipoDocumento: string;
    documento: string;
    personaContacto?: string; // GET uses personaContacto
    persona_Contacto?: string; // POST/PUT uses persona_Contacto
    correo: string;
    telefono: string;
    direccion: string;
    departamento: string;
    ciudad: string;
    estado: boolean;
}

export const supplierService = {
    getAll: async (): Promise<SupplierAPI[]> => {
        return apiClient.get('/Proveedores');
    },

    getById: async (id: number): Promise<SupplierAPI> => {
        return apiClient.get(`/Proveedores/${id}`);
    },

    create: async (supplier: any): Promise<SupplierAPI> => {
        return apiClient.post('/Proveedores', supplier);
    },

    update: async (id: number, supplier: any): Promise<SupplierAPI> => {
        return apiClient.put(`/Proveedores/${id}`, supplier);
    },

    delete: async (id: number): Promise<any> => {
        return apiClient.delete(`/Proveedores/${id}`);
    }
};
