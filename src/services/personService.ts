import { apiClient } from './apiClient';

export interface Person {
    documentId: string;    // Maps to documentoCliente / documentoEmpleado
    type: 'client' | 'employee';
    documentType: string;  // Maps to tipoDocumento
    name: string;          // Maps to nombre
    phone: string;         // Maps to telefono
    status: 'active' | 'inactive'; // Maps to estado (boolean)
}

export interface CreatePersonData {
    documentId: string;
    type: 'client' | 'employee';
    documentType: string;
    name: string;
    phone: string;
}

// Map Backend DTO to Frontend Model
const mapBackendToPerson = (data: any, type: 'client' | 'employee'): Person => ({
    documentId: type === 'client' ? data.documentoCliente : data.documentoEmpleado,
    type,
    documentType: data.tipoDocumento || 'CC',
    name: data.nombre || '',
    phone: data.telefono || '',
    status: data.estado !== false ? 'active' : 'inactive' // default true if missing
});

// Map Frontend Model to Backend DTO for Create/Update
const mapPersonToBackend = (person: CreatePersonData | Person) => {
    const isClient = person.type === 'client';

    const payload: any = {
        tipoDocumento: person.documentType,
        nombre: person.name,
        telefono: person.phone
    };

    if (isClient) {
        payload.documentoCliente = person.documentId;
    } else {
        payload.documentoEmpleado = person.documentId;
    }

    return payload;
};

export const personService = {
    // GET ALL
    async getPersons(type: 'client' | 'employee'): Promise<Person[]> {
        const endpoint = type === 'client' ? '/Clientes' : '/Empleados';
        const response = await apiClient.get(endpoint);
        if (!Array.isArray(response)) return [];

        return response.map(item => mapBackendToPerson(item, type));
    },

    // GET ONE
    async getPersonByDocument(documentId: string, type: 'client' | 'employee'): Promise<Person> {
        const endpoint = type === 'client' ? `/Clientes/${documentId}` : `/Empleados/${documentId}`;
        const response = await apiClient.get(endpoint);
        return mapBackendToPerson(response, type);
    },

    // CREATE
    async createPerson(data: CreatePersonData): Promise<Person> {
        const endpoint = data.type === 'client' ? '/Clientes' : '/Empleados';
        const payload = mapPersonToBackend(data);
        const response = await apiClient.post(endpoint, payload);
        return mapBackendToPerson(response, data.type);
    },

    // UPDATE
    async updatePerson(documentId: string, data: Person): Promise<Person> {
        const endpoint = data.type === 'client' ? `/Clientes/${documentId}` : `/Empleados/${documentId}`;

        // For updates, the swagger structure typically requires boolean for estado
        const payload = {
            ...mapPersonToBackend(data),
            estado: data.status === 'active'
        };

        const response = await apiClient.put(endpoint, payload);
        return mapBackendToPerson(response, data.type);
    },

    // DELETE
    async deletePerson(documentId: string, type: 'client' | 'employee'): Promise<void> {
        const endpoint = type === 'client' ? `/Clientes/${documentId}` : `/Empleados/${documentId}`;
        await apiClient.delete(endpoint);
    }
};
