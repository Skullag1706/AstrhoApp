import { apiClient } from "./apiClient";

// ── Interfaces ──

export interface AgendaItem {
  agendaId: number;
  documentoCliente: string;
  cliente: string;
  documentoEmpleado: string;
  empleado: string;
  fechaCita: string;
  horaInicio: string;
  estado: string;
  metodoPago: string;
  servicios: string[];
}

export interface CreateAgendaData {
  documentoCliente: string;
  documentoEmpleado: string;
  fechaCita: string;
  horaInicio: string;
  metodoPagoId: number;
  observaciones: string;
  serviciosIds: number[];
}

export interface UpdateAgendaData extends CreateAgendaData {
  estadoId: number;
}

export interface MetodoPago {
  metodopagoId: number;
  nombre: string;
}

export interface EmpleadoAPI {
  documentoEmpleado: string;
  tipoDocumento: string;
  nombre: string;
  telefono: string;
  estado: boolean;
}

export interface ClienteAPI {
  documentoCliente: string;
  tipoDocumento: string;
  usuarioId: number;
  nombre: string;
  telefono: string;
  estado: boolean;
}

export interface ServicioAPI {
  servicioId: number;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion: number;
  estado: boolean;
  imagen: string;
}

// ── Helpers ──

/**
 * Parse a "HH:mm" or "HH:mm:ss" string into total minutes since midnight.
 */
function timeToMinutes(time: string): number {
  const parts = time.split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/**
 * Check if an employee is occupied during a proposed time window.
 *
 * @param employeeDoc - documento del empleado
 * @param date        - fecha propuesta "YYYY-MM-DD"
 * @param startTime   - hora de inicio propuesta "HH:mm"
 * @param totalDurationMinutes - duración total (suma de servicios)
 * @param allAppointments - todas las citas existentes
 * @param serviciosMap - mapa servicioNombre → duración (minutos)
 * @param excludeAgendaId - id de la cita a excluir (para edición)
 */
export function isEmployeeOccupied(
  employeeDoc: string,
  date: string,
  startTime: string,
  totalDurationMinutes: number,
  allAppointments: AgendaItem[],
  serviciosMap: Map<string, number>,
  excludeAgendaId?: number,
): boolean {
  if (!startTime || !date || totalDurationMinutes <= 0) return false;

  const proposedStart = timeToMinutes(startTime);
  const proposedEnd = proposedStart + totalDurationMinutes;

  for (const apt of allAppointments) {
    // Skip the appointment being edited
    if (excludeAgendaId != null && apt.agendaId === excludeAgendaId) continue;

    // Skip if different employee or different date
    if (String(apt.documentoEmpleado) !== String(employeeDoc)) continue;
    if (apt.fechaCita !== date) continue;

    // Skip cancelled appointments
    const estadoLower = apt.estado.toLowerCase();
    if (estadoLower === "cancelado" || estadoLower === "cancelled") continue;

    // Compute existing appointment's duration from its services
    let existingDuration = 0;
    for (const svcName of apt.servicios) {
      existingDuration += serviciosMap.get(svcName) ?? 30; // fallback 30 min
    }
    if (existingDuration <= 0) existingDuration = 30;

    const existingStart = timeToMinutes(apt.horaInicio);
    const existingEnd = existingStart + existingDuration;

    // Overlap: two intervals [a, b) and [c, d) overlap iff a < d && c < b
    if (proposedStart < existingEnd && existingStart < proposedEnd) {
      return true;
    }
  }

  return false;
}

// ── Agenda Service ──

export const agendaService = {
  async getAll(): Promise<AgendaItem[]> {
    return apiClient.get("/Agenda");
  },

  async create(data: CreateAgendaData): Promise<any> {
    return apiClient.post("/Agenda", data);
  },

  async update(id: number, data: UpdateAgendaData): Promise<any> {
    return apiClient.put(`/Agenda/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete(`/Agenda/${id}`);
  },
};

// ── MetodoPago Service ──

export const metodoPagoService = {
  async getAll(): Promise<MetodoPago[]> {
    return apiClient.get("/MetodoPago");
  },
};

// ── Empleado Service (for agenda module) ──

export const empleadoAgendaService = {
  async getAll(): Promise<EmpleadoAPI[]> {
    return apiClient.get("/Empleados");
  },
};

// ── Cliente Service ──

export const clienteService = {
  async getAll(): Promise<ClienteAPI[]> {
    return apiClient.get("/Clientes");
  },
};

// ── Servicio Service (for agenda module) ──

export const servicioAgendaService = {
  async getAll(): Promise<ServicioAPI[]> {
    return apiClient.get("/Servicios");
  },
};
