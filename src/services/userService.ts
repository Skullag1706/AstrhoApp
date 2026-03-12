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
};
