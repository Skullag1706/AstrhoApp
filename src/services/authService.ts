import { apiClient } from './apiClient';

// ── Role mapping from API to internal app roles ──
const ROLE_MAP: Record<string, string> = {
    'administrador': 'admin',
    'super admin': 'super_admin',
    'asistente': 'asistente',
    'cliente': 'customer',
};

function mapRole(apiRole: string): string {
    return ROLE_MAP[apiRole.toLowerCase()] || 'customer';
}

// ── Interfaces ──
export interface LoginResponse {
    token: string;
    rol: string;
    usuarioId: number;
    email: string;
    [key: string]: any; // allow extra fields from API
}

export interface RegisterData {
    rolId?: number;
    email: string;
    contrasena: string;
    confirmarContrasena: string;
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
        };
    },
};
