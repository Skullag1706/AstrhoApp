import { apiClient } from './apiClient';

// ── Role mapping from API to internal app roles ──
const ROLE_MAP: Record<string, string> = {
    'administrador': 'admin',
    'administradora': 'admin',
    'super admin': 'super_admin',
    'asistente': 'asistente',
    'cliente': 'customer',
};

function mapRole(apiRole: any): string {
    if (typeof apiRole !== 'string') return 'customer';
    const normalized = apiRole.toLowerCase().trim();
    return ROLE_MAP[normalized] || 'customer';
}

// ── Interfaces ──
export interface LoginResponse {
    token: string;
    rol: string;
    usuarioId: number;
    email: string;
    mustChangePassword?: boolean;
    [key: string]: any; // allow extra fields from API
}

export interface RegisterData {
    rolId?: number;
    email: string;
    contrasena: string;
    confirmarContrasena: string;
}

export interface TempUserData {
    rolId?: number;
    email: string;
}

export interface UsuarioListItem {
    usuarioId: number;
    email: string;
    estado: boolean;
    rolNombre: string;
}

// ── Auth Service ──
export const authService = {
    /**
     * Login: POST /api/auth/login
     * Returns the full API response with token + user data
     */
    async login(email: string, password: string): Promise<LoginResponse> {
        const response = await apiClient.post('/auth/login', {
            email: email.trim().toLowerCase(),
            password,
        });
        return response;
    },

    /**
     * Register a new user: POST /api/Usuarios
     * Registers with dynamic rolId; defaults to 2 (Cliente) if not provided.
     */
    async register(data: RegisterData): Promise<any> {
        const response = await apiClient.post('/Usuarios', {
            rolId: data.rolId || 2,
            email: data.email.trim().toLowerCase(),
            contrasena: data.contrasena,
            confirmarContrasena: data.confirmarContrasena,
        });
        return response;
    },

    async createTempUser(data: TempUserData): Promise<any> {
        const tempPassword = Math.random().toString(36).slice(-10);
        const response = await apiClient.post('/auth/create-temp-user', {
            rolId: data.rolId || 2,
            email: data.email.trim().toLowerCase(),
            contrasena: tempPassword,
            confirmarContrasena: tempPassword,
        });
        return response;
    },

    async getUserIdByEmail(email: string): Promise<number | null> {
        try {
            const users: UsuarioListItem[] = await apiClient.get('/Usuarios');
            const found = users.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase());
            return found?.usuarioId ?? null;
        } catch {
            return null;
        }
    },

    /**
     * Register a new client: POST /api/Usuarios then POST /api/Clientes
     */
    async registerClient(data: any): Promise<any> {
        // 1. Create the User (Rol 2 is Cliente)
        const userPayload = {
            rolId: 2,
            email: data.email.trim().toLowerCase(),
            contrasena: data.password,
            confirmarContrasena: data.confirmPassword,
        };

        let userResponse;
        try {
            userResponse = await apiClient.post('/Usuarios', userPayload);
        } catch (error: any) {
            console.error('Error creating user:', error);
            throw new Error(error?.response?.data || 'Error al crear el usuario.');
        }

        // Try to get the created user ID
        let usuarioId = userResponse?.usuarioId || userResponse?.id;

        // If not in response, fetch the user by email
        if (!usuarioId) {
            const users = await apiClient.get('/Usuarios');
            const createdUser = users.find((u: any) => u.email.toLowerCase() === data.email.trim().toLowerCase());
            if (createdUser) {
                usuarioId = createdUser.usuarioId;
            } else {
                throw new Error('No se pudo verificar la creación del usuario.');
            }
        }

        // 2. Create the Client details
        const mapDocType = (t: string): string => {
            const key = (t || '').toLowerCase();
            if (key === 'cedula' || key === 'cédula' || key === 'cedula_ciudadania' || key === 'cédula_ciudadanía') return 'CC';
            if (key === 'tarjeta_identidad' || key === 'ti') return 'TI';
            if (key === 'cedula_extranjeria' || key === 'cédula_extranjería' || key === 'ce') return 'CE';
            if (key === 'pasaporte' || key === 'passport') return 'PAS';
            if (key === 'nit') return 'NIT';
            return 'CC';
        };

        const clientPayload = {
            documentoCliente: data.documentId,
            usuarioId: usuarioId,
            tipoDocumento: mapDocType(data.documentType),
            nombre: `${data.firstName} ${data.lastName}`.trim(),
            telefono: data.phone
        };

        try {
            const clientResponse = await apiClient.post('/Clientes', clientPayload);
            return { user: userResponse, client: clientResponse };
        } catch (error: any) {
            console.error('Error creating client:', error);
            // Optionally, delete the user if client creation fails, but leaving it is safer without knowing API constraints
            throw new Error(error?.response?.data || 'Error al guardar los datos del cliente.');
        }
    },

    /**
     * Check if email already exists: GET /api/Usuarios
     * Returns { emailExists }
     */
    async checkDuplicates(
        email: string
    ): Promise<{ emailExists: boolean }> {
        try {
            const users: UsuarioListItem[] = await apiClient.get('/Usuarios');
            const emailExists = users.some(
                (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
            );
            return { emailExists };
        } catch {
            // If the check fails, allow registration attempt (the API will reject duplicates)
            return { emailExists: false };
        }
    },

    /**
     * Request password recovery: POST /api/Usuarios/recuperar-password
     * Returns the token needed for code validation
     */
    async requestPasswordRecovery(email: string): Promise<any> {
        const response = await apiClient.post('/Usuarios/recuperar-password', {
            email: email.trim().toLowerCase(),
        });
        return response;
    },

    /**
     * Validate recovery code: POST /api/Usuarios/validar-codigo-recuperacion
     * Returns { valid, resetToken } or similar
     */
    async validateRecoveryCode(token: string, codigo: string): Promise<any> {
        const response = await apiClient.post('/Usuarios/validar-codigo-recuperacion', {
            token,
            codigo,
        });
        return response;
    },

    /**
     * Reset password: POST /api/Usuarios/reset-password
     */
    async resetPassword(
        resetToken: string,
        nuevaContrasena: string,
        confirmarContrasena: string
    ): Promise<any> {
        const response = await apiClient.post('/Usuarios/reset-password', {
            resetToken,
            nuevaContrasena,
            confirmarContrasena,
        });
        return response;
    },


    /**
     * Change password explicitly from the UI
     */
    async changePassword(email: string, contrasenaActual: string, nuevaContrasena: string): Promise<any> {
        try {
            const response = await apiClient.post('/auth/change-password', {
                Email: email.trim().toLowerCase(),
                CurrentPassword: contrasenaActual,
                NewPassword: nuevaContrasena
            });
            return response;
        } catch (error) {
            console.error('Error in changePassword:', error);
            throw error;
        }
    },

    /**
     * Build the user object expected by the app from the login API response
     */
    buildUserFromLoginResponse(data: LoginResponse): any {
        const role = mapRole(data.rol);
        const derivedName = data.email ? data.email.split('@')[0] : '';
        return {
            id: data.usuarioId,
            name: derivedName,
            firstName: derivedName,
            lastName: '',
            documentId: '',
            email: data.email || '',
            phone: '',
            role,
            token: data.token,
            permissions: data.permisos || data.permisosIds || [],
            requiereCambioPassword: data.mustChangePassword === true
        };
    },
};
