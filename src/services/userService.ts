import { apiClient } from './apiClient';

// ── Interfaces ──

export interface UsuarioListItem {
    usuarioId: number;
    email: string;
    contrasena?: string;
    estado: boolean;
    rolNombre: string;
}

export interface UsuarioDetail {
    usuarioId: number;
    email: string;
    contrasena?: string;
    estado: boolean;
    rol: {
        rolId: number;
        nombre: string;
        descripcion: string;
    };
}

export interface UpdateUsuarioDto {
    rolId: number;
    email: string;
    contrasena: string;
    confirmarContrasena: string;
    estado: boolean;
}

// ── User Service ──

export const userService = {
    getAll: async (): Promise<UsuarioListItem[]> => {
        return apiClient.get<UsuarioListItem[]>('/Usuarios');
    },

    getById: async (id: number): Promise<UsuarioDetail> => {
        return apiClient.get<UsuarioDetail>(`/Usuarios/${id}`);
    },

    update: async (id: number, data: UpdateUsuarioDto): Promise<void> => {
        return apiClient.put<void>(`/Usuarios/${id}`, data);
    },

    delete: async (id: number): Promise<void> => {
        return apiClient.delete<void>(`/Usuarios/${id}`);
    },

    getPersonForUser: async (usuarioId: number): Promise<{ 
        documentId: string; 
        documentType: string;
        name: string;
        phone: string;
        address: string;
        type: 'client' | 'employee' 
    } | null> => {
        try {
            console.log('Fetching person details for user ID:', usuarioId);
            // Use separate calls with individual catches to handle 403s gracefully
            const clientes = await apiClient.get<any[]>('/Clientes').catch(err => {
                console.warn('Could not fetch /Clientes:', err.message);
                return [];
            });
            const empleados = await apiClient.get<any[]>('/Empleados').catch(err => {
                console.warn('Could not fetch /Empleados:', err.message);
                return [];
            });

            console.log(`Found ${clientes.length} clients and ${empleados.length} employees`);

            const client = (clientes || []).find((c: any) => c.usuarioId === usuarioId);
            if (client) {
                console.log('User found in Clientes table:', client.documentoCliente);
                return { 
                    documentId: client.documentoCliente, 
                    documentType: client.tipoDocumento || 'CC',
                    name: client.nombre || 'Cliente',
                    phone: client.telefono || '',
                    address: client.dirección || client.direccion || '',
                    type: 'client' 
                };
            }

            const employee = (empleados || []).find((e: any) => e.usuarioId === usuarioId);
            if (employee) {
                console.log('User found in Empleados table:', employee.documentoEmpleado);
                return { 
                    documentId: employee.documentoEmpleado, 
                    documentType: employee.tipoDocumento || 'CC',
                    name: employee.nombre || 'Empleado',
                    phone: employee.telefono || '',
                    address: employee.dirección || employee.direccion || '',
                    type: 'employee' 
                };
            }

            console.warn('User not found in Clientes or Empleados tables.');
            return null;
        } catch (error) {
            console.error('Error in getPersonForUser:', error);
            return null;
        }
    },

    checkDocumentDuplicate: async (documentId: string): Promise<boolean> => {
        try {
            const clientes = await apiClient.get<any[]>('/Clientes').catch(() => []);
            const empleados = await apiClient.get<any[]>('/Empleados').catch(() => []);

            const existsInClientes = (clientes || []).some(
                (c: any) => String(c.documentoCliente) === String(documentId)
            );
            const existsInEmpleados = (empleados || []).some(
                (e: any) => String(e.documentoEmpleado) === String(documentId)
            );
            return existsInClientes || existsInEmpleados;
        } catch {
            return false;
        }
    },
};
