import { apiClient } from './apiClient';

export interface Brand {
    marcaId: number;
    nombre: string;
    descripcion: string;
    estado: boolean;
}

export const brandService = {
    async getBrands(): Promise<Brand[]> {
        return apiClient.get('/Marca');
    },

    async createBrand(brand: Omit<Brand, 'marcaId'>): Promise<Brand> {
        return apiClient.post('/Marca', brand);
    },

    async updateBrand(id: number, brand: Partial<Brand>): Promise<Brand> {
        return apiClient.put(`/Marca/${id}`, brand);
    },

    async deleteBrand(id: number): Promise<void> {
        return apiClient.delete(`/Marca/${id}`);
    }
};
