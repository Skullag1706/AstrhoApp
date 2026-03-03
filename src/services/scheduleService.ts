import { apiClient } from './apiClient';

// ── Interfaces ──

export interface Horario {
    horarioId: number;
    diaSemana: string;
    horaInicio: string;
    horaFin: string;
    estado: boolean;
}

export interface CreateHorarioData {
    diaSemana: string;
    horaInicio: string;
    horaFin: string;
    estado: boolean;
}

export interface HorarioEmpleado {
    horarioEmpleadoId: number;
    horarioId: number;
    documentoEmpleado: string;
    empleadoNombre: string;
    diaSemana: string;
    horaInicio: string;
    horaFin: string;
}

export interface CreateHorarioEmpleadoData {
    horarioId: number;
    documentoEmpleado: string;
}

export interface Empleado {
    documentoEmpleado: string;
    tipoDocumento: string;
    usuarioId: number;
    nombre: string;
    telefono: string;
    estado: boolean;
}

// ── Horario Service ──

export const horarioService = {
    async getAll(): Promise<Horario[]> {
        return apiClient.get('/Horario');
    },

    async getById(id: number): Promise<Horario> {
        return apiClient.get(`/Horario/${id}`);
    },

    async create(data: CreateHorarioData): Promise<Horario> {
        return apiClient.post('/Horario', data);
    },

    async update(id: number, data: CreateHorarioData): Promise<Horario | null> {
        return apiClient.put(`/Horario/${id}`, data);
    },

    async delete(id: number): Promise<void> {
        return apiClient.delete(`/Horario/${id}`);
    }
};

// ── HorarioEmpleado Service ──

export const horarioEmpleadoService = {
    async getAll(): Promise<HorarioEmpleado[]> {
        return apiClient.get('/HorarioEmpleado');
    },

    async create(data: CreateHorarioEmpleadoData): Promise<HorarioEmpleado> {
        return apiClient.post('/HorarioEmpleado', data);
    },

    async update(id: number, data: CreateHorarioEmpleadoData): Promise<HorarioEmpleado | null> {
        return apiClient.put(`/HorarioEmpleado/${id}`, data);
    },

    async delete(id: number): Promise<void> {
        return apiClient.delete(`/HorarioEmpleado/${id}`);
    }
};

// ── Empleado Service (read-only for this module) ──

export const empleadoService = {
    async getAll(): Promise<Empleado[]> {
        return apiClient.get('/Empleados');
    }
};
