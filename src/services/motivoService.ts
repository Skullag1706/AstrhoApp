import { apiClient } from "./apiClient";

export interface Motivo {
  motivoId: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  descripcion: string;
  documentoEmpleado: string;
  nombreEmpleado?: string;
  estado: "pendiente" | "aprobado" | "rechazado";
}

export interface CreateMotivoData {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  descripcion: string;
}

export interface UpdateMotivoData {
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;
  descripcion?: string;
  estado?: "pendiente" | "aprobado" | "rechazado";
}

export const motivoService = {
  async getAll(): Promise<Motivo[]> {
    return apiClient.get("/Motivo");
  },

  async getById(id: number): Promise<Motivo> {
    return apiClient.get(`/Motivo/${id}`);
  },

  async create(data: CreateMotivoData): Promise<Motivo> {
    return apiClient.post("/Motivo", data);
  },

  async update(id: number, data: UpdateMotivoData): Promise<Motivo | null> {
    return apiClient.put(`/Motivo/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete(`/Motivo/${id}`);
  },
};
