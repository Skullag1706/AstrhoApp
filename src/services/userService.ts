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

    getPersonForUser: async (usuarioId: number): Promise<{ documentId: string; type: 'client' | 'employee' } | null> => {
        try {
            const [clientes, empleados] = await Promise.all([
                apiClient.get<any[]>('/Clientes'),
                apiClient.get<any[]>('/Empleados'),
            ]);
            const client = (clientes || []).find((c: any) => c.usuarioId === usuarioId);
            if (client) return { documentId: client.documentoCliente, type: 'client' };

            const employee = (empleados || []).find((e: any) => e.usuarioId === usuarioId);
            if (employee) return { documentId: employee.documentoEmpleado, type: 'employee' };

            return null;
        } catch {
            return null;
        }
    },

    checkDocumentDuplicate: async (documentId: string): Promise<boolean> => {
        try {
            const [clientes, empleados] = await Promise.all([
                apiClient.get<any[]>('/Clientes'),
                apiClient.get<any[]>('/Empleados'),
            ]);
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
