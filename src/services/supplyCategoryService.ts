import { apiClient } from './apiClient';

export interface Category {
    categoriaId: number;
    nombre: string;
    descripcion: string;
    estado: boolean;
    cantidadProductos?: number;
    fechaCreacion?: string;
    fechaActualizacion?: string;
}

export const supplyCategoryService = {
    async getCategories(): Promise<Category[]> {
        return apiClient.get('/Categorias');
    },

    async createCategory(category: Omit<Category, 'categoriaId' | 'cantidadProductos'>): Promise<Category> {
        return apiClient.post('/Categorias', category);
    },

    async updateCategory(id: number, category: Partial<Category>): Promise<Category> {
        // Ensure id is sent in the URL
        return apiClient.put(`/Categorias/${id}`, category);
    },

    async deleteCategory(id: number): Promise<void> {
        return apiClient.delete(`/Categorias/${id}`);
    }
};
