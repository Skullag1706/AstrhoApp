import { apiClient } from './apiClient';

export interface SupplyDeliveryItem {
    id?: number;
    supplyDeliveryId?: number;
    supplyId: number;
    quantity: number;
}

export interface SupplyDelivery {
    id: number;
    supplyId: number; // for single item backwards compatibility if needed. usually it's items array
    deliveryDate: string;
    quantity: number;
    destination: string;
    responsiblePerson: string;
    responsibleId: number;
    status: 'pending' | 'completed' | 'cancelled';
    notes?: string;
    createdBy: number;
    createdAt: string;
    completedAt?: string;
    items?: SupplyDeliveryItem[];
}

export const supplyDeliveryService = {
    async getDeliveries(): Promise<SupplyDelivery[]> {
        return apiClient.get('/SupplyDelivery');
    },

    async getDeliveryById(id: number): Promise<SupplyDelivery> {
        return apiClient.get(`/SupplyDelivery/${id}`);
    },

    async createDelivery(delivery: Omit<SupplyDelivery, 'id'>): Promise<SupplyDelivery> {
        return apiClient.post('/SupplyDelivery', delivery);
    },

    async updateDelivery(id: number, delivery: Partial<SupplyDelivery>): Promise<SupplyDelivery> {
        return apiClient.put(`/SupplyDelivery/${id}`, delivery);
    },

    async deleteDelivery(id: number): Promise<void> {
        return apiClient.delete(`/SupplyDelivery/${id}`);
    }
};