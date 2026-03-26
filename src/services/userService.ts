import { apiClient, PaginatedResponse } from './apiClient';

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
    documentoCliente?: string;
    documentoEmpleado?: string;
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
    getAll: async (params?: { page?: number; pageSize?: number; search?: string }): Promise<PaginatedResponse<UsuarioListItem>> => {
        const response = await apiClient.get<any>('/Usuarios', params);
        
        if (response && response.data && Array.isArray(response.data)) {
            return response;
        }

        // Fallback for simple array response
        if (Array.isArray(response)) {
            return {
                data: response,
                totalCount: response.length,
                page: params?.page || 1,
                pageSize: params?.pageSize || response.length,
                totalPages: 1
            };
        }

        return { data: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
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

    getPersonForUser: async (user: any): Promise<{ 
        documentId: string; 
        documentType: string;
        name: string;
        phone: string;
        address: string;
        type: 'client' | 'employee' 
    } | null> => {
        try {
            // Normalize role name
            const roleName = (user.rol?.nombre || user.rolNombre || '').toLowerCase().trim();
            
            // ROLE LOGIC:
            // 'cliente' -> Clients table
            // 'administrador', 'asistente', 'super admin', 'admin', etc. -> Employees table
            const isClient = roleName === 'cliente';
            const isEmployee = !isClient; // Admin, Assistant, etc. are employees

            // 1. Try to find the document ID from the user object if present
            const documentId = user.documentoCliente || user.documentoEmpleado || user.documento || user.documentoIdentidad;

            if (documentId) {
                try {
                    const endpoint = isClient ? `/Clientes/${documentId}` : `/Empleados/${documentId}`;
                    const data = await apiClient.get<any>(endpoint);
                    
                    if (data && (data.documentoCliente || data.documentoEmpleado || data.nombre)) {
                        return {
                            documentId: isClient ? (data.documentoCliente || documentId) : (data.documentoEmpleado || documentId),
                            documentType: data.tipoDocumento || 'CC',
                            name: data.nombre || (isClient ? 'Cliente' : 'Empleado'),
                            phone: data.telefono || '',
                            address: data.dirección || data.direccion || '',
                            type: isClient ? 'client' : 'employee'
                        };
                    }
                } catch (e) {
                    console.warn(`Direct fetch failed for ${documentId}`, e);
                }
            }

            // 2. Exhaustive Fallback: Search by usuarioId in the corresponding list
            const targetId = Number(user.usuarioId);
            
            // Search in the table that SHOULD contain the user
            if (isClient) {
                // Search in /Clientes
                const clientsRes = await apiClient.get<any>('/Clientes', { pageSize: 1000 }).catch(() => ({ data: [] }));
                const clients = Array.isArray(clientsRes) ? clientsRes : (clientsRes?.data || []);
                const client = clients.find((c: any) => Number(c.usuarioId) === targetId);
                
                if (client) return {
                    documentId: client.documentoCliente,
                    documentType: client.tipoDocumento || 'CC',
                    name: client.nombre || 'Cliente',
                    phone: client.telefono || '',
                    address: client.dirección || client.direccion || '',
                    type: 'client'
                };
            } else {
                // Search in /Empleados (for Admin, Assistant, Super Admin, etc.)
                const employeesRes = await apiClient.get<any>('/Empleados', { pageSize: 1000 }).catch(() => ({ data: [] }));
                const employees = Array.isArray(employeesRes) ? employeesRes : (employeesRes?.data || []);
                const employee = employees.find((e: any) => Number(e.usuarioId) === targetId);
                
                if (employee) return {
                    documentId: employee.documentoEmpleado,
                    documentType: employee.tipoDocumento || 'CC',
                    name: employee.nombre || 'Empleado',
                    phone: employee.telefono || '',
                    address: employee.dirección || employee.direccion || '',
                    type: 'employee'
                };
            }

            // 3. Final Fallback: Cross-search in BOTH lists just in case
            const [cRes, eRes] = await Promise.all([
                apiClient.get<any>('/Clientes', { pageSize: 1000 }).catch(() => ({ data: [] })),
                apiClient.get<any>('/Empleados', { pageSize: 1000 }).catch(() => ({ data: [] }))
            ]);
            
            const allClients = Array.isArray(cRes) ? cRes : (cRes?.data || []);
            const allEmployees = Array.isArray(eRes) ? eRes : (eRes?.data || []);

            const foundClient = allClients.find((x: any) => Number(x.usuarioId) === targetId);
            if (foundClient) return {
                documentId: foundClient.documentoCliente,
                documentType: foundClient.tipoDocumento || 'CC',
                name: foundClient.nombre || 'Cliente',
                phone: foundClient.telefono || '',
                address: foundClient.dirección || foundClient.direccion || '',
                type: 'client'
            };

            const foundEmployee = allEmployees.find((x: any) => Number(x.usuarioId) === targetId);
            if (foundEmployee) return {
                documentId: foundEmployee.documentoEmpleado,
                documentType: foundEmployee.tipoDocumento || 'CC',
                name: foundEmployee.nombre || 'Empleado',
                phone: foundEmployee.telefono || '',
                address: foundEmployee.dirección || foundEmployee.direccion || '',
                type: 'employee'
            };

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
