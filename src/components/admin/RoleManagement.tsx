import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Edit, Save, X, Plus, AlertCircle, 
  CheckCircle, UserCheck, UserX, Settings, Eye, Trash2, Search,
  LayoutDashboard, Calendar, Scissors, Package, ShoppingCart,
  ShoppingBag, Truck, Box, UsersRound, Tag, Clock, Boxes,
  PackageCheck, FileText
} from 'lucide-react';
import { mockRoles, mockPermissions } from '../../data/management';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../ui/pagination';

interface RoleManagementProps {
  hasPermission: (permission: string) => boolean;
}

export function RoleManagement({ hasPermission }: RoleManagementProps) {
  const [roles, setRoles] = useState(mockRoles);
  const [editingRole, setEditingRole] = useState(null);
  const [viewingRole, setViewingRole] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInactiveWarningModal, setShowInactiveWarningModal] = useState(false);
  const [showDeleteWarningModal, setShowDeleteWarningModal] = useState(false);
  const [showValidationErrorModal, setShowValidationErrorModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // New role form data
  const [newRoleData, setNewRoleData] = useState({
    name: '',
    description: '',
    permissions: []
  });

  // Auto-hide success alert after 4 seconds
  useEffect(() => {
    if (showSuccessAlert) {
      const timer = setTimeout(() => {
        setShowSuccessAlert(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessAlert]);

  // Agrupar permisos por módulo
  const groupPermissionsByModule = () => {
    const grouped = {};
    mockPermissions.forEach(permission => {
      if (!grouped[permission.module]) {
        grouped[permission.module] = [];
      }
      grouped[permission.module].push(permission);
    });
    return grouped;
  };

  // Definir nombres y orden de módulos
  const moduleNames = {
    dashboard: 'Dashboard',
    users: 'Usuarios',
    appointments: 'Agendamiento',
    services: 'Servicios',
    inventory: 'Inventario',
    sales: 'Ventas',
    purchases: 'Compras',
    suppliers: 'Proveedores',
    products: 'Productos',
    clients: 'Clientes',
    categories: 'Categoria de Insumos',
    schedules: 'Horarios',
    supplies: 'Insumos',
    deliveries: 'Entrega de Insumos',
    orders: 'Pedidos',
    reports: 'Reportes'
  };

  // Iconos para cada módulo
  const moduleIcons = {
    dashboard: LayoutDashboard,
    users: Users,
    appointments: Calendar,
    services: Scissors,
    inventory: Package,
    sales: ShoppingCart,
    purchases: ShoppingBag,
    suppliers: Truck,
    products: Box,
    clients: UsersRound,
    categories: Tag,
    schedules: Clock,
    supplies: Boxes,
    deliveries: PackageCheck,
    orders: ShoppingBag,
    reports: FileText
  };

  const getModuleIcon = (module: string) => {
    return moduleIcons[module] || Settings;
  };

  const permissionsByModule = groupPermissionsByModule();

  // Filter roles based on search
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const paginatedRoles = filteredRoles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const getRoleColor = (roleId) => {
    switch (roleId) {
      case 'super_admin': return 'from-pink-600 to-purple-800';
      case 'admin': return 'from-red-400 to-red-600';
      case 'asistente': return 'from-blue-400 to-blue-600';
      case 'customer': return 'from-green-400 to-green-600';
      default: return 'from-purple-400 to-purple-600';
    }
  };

  const getRoleIcon = (roleId) => {
    switch (roleId) {
      case 'super_admin': return Shield;
      case 'admin': return Shield;
      case 'asistente': return UserCheck;
      case 'customer': return Users;
      default: return Settings;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      default: return status;
    }
  };

  const handleCreateRole = () => {
    // Validar campos requeridos - Actualización 2025
    if (!newRoleData.name.trim() || !newRoleData.description.trim()) {
      setShowValidationErrorModal(true);
      return;
    }
    
    // Validar si se está creando un rol de administrador
    const isAdminRole = newRoleData.name.toLowerCase().includes('administrador') || 
                        newRoleData.permissions.includes('module_users');
    
    // Eliminada la restricción de límite de 3 administradores por solicitud del usuario
    
    const newRole = {
      id: `role_${Date.now()}`,
      name: newRoleData.name,
      description: newRoleData.description,
      permissions: newRoleData.permissions,
      status: 'active',
      isSuperUser: false,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setRoles([...roles, newRole]);
    setShowCreateModal(false);
    setNewRoleData({ name: '', description: '', permissions: [] });
    
    // Mensaje de éxito
    setAlertMessage('✅ Rol creado exitosamente: ' + newRole.name);
    setShowSuccessAlert(true);
  };

  const handleEditRole = (role) => {
    setEditingRole({ ...role });
  };

  const handleSaveRole = () => {
    setRoles(roles.map(r => r.id === editingRole.id ? {
      ...editingRole,
      updatedAt: new Date().toISOString().split('T')[0]
    } : r));
    setEditingRole(null);
  };

  const handleViewRole = (role) => {
    setViewingRole(role);
  };

  const toggleRoleStatus = (roleId) => {
    // Buscar el rol para verificar si es super administrador
    const role = roles.find(r => r.id === roleId);
    
    // No permitir inactivar el super administrador
    if (role && (role.id === 'super_admin' || role.isSuperUser)) {
      setShowInactiveWarningModal(true);
      return;
    }
    
    setRoles(roles.map(role => 
      role.id === roleId 
        ? { ...role, status: role.status === 'active' ? 'inactive' : 'active', updatedAt: new Date().toISOString().split('T')[0] }
        : role
    ));
  };

  const handleDeleteRole = (role) => {
    // No permitir eliminar el super administrador
    if (role.id === 'super_admin' || role.isSuperUser) {
      setShowDeleteWarningModal(true);
      return;
    }
    
    setRoleToDelete(role);
    setShowDeleteModal(true);
  };

  const confirmDeleteRole = () => {
    if (roleToDelete) {
      setRoles(roles.filter(r => r.id !== roleToDelete.id));
      setShowDeleteModal(false);
      setRoleToDelete(null);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gestión de Roles</h2>
          <p className="text-gray-600">
            Administra los roles del sistema y sus permisos asociados
          </p>
        </div>

        {hasPermission('manage_roles') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Registrar Rol</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar roles por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
          />
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">Lista de Roles</h3>
          <p className="text-gray-600">
            {filteredRoles.length} rol{filteredRoles.length !== 1 ? 'es' : ''} encontrado{filteredRoles.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Rol</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Permisos</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Estado</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedRoles.map((role) => {
                const Icon = getRoleIcon(role.id);
                
                return (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-gradient-to-r ${getRoleColor(role.id)} rounded-full flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{role.name}</div>
                          <div className="text-sm text-gray-600">{role.description}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700">
                          {role.permissions.length} permiso{role.permissions.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {role.id === 'super_admin' || role.isSuperUser ? (
                          // Super admin siempre activo, sin switch
                          <div className="flex items-center space-x-2">
                            <div className="w-11 h-6 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full relative">
                              <div className="absolute top-[2px] right-[2px] bg-white border-white border rounded-full h-5 w-5"></div>
                            </div>
                            <span className="ml-1 text-sm font-medium text-green-600">
                              Activo
                            </span>
                          </div>
                        ) : (
                          // Otros roles con switch
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={role.status === 'active'}
                              onChange={() => toggleRoleStatus(role.id)}
                              className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-400 peer-checked:to-purple-500"></div>
                            <span className={`ml-3 text-sm font-medium ${
                              role.status === 'active' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {role.status === 'active' ? 'Activo' : 'Inactivo'}
                            </span>
                          </label>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewRole(role)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {hasPermission('manage_roles') && (
                          <>
                            <button
                              onClick={() => handleEditRole(role)}
                              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                              title="Editar rol"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteRole(role)}
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                              title="Eliminar rol"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination - Always visible */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {filteredRoles.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredRoles.length)} de {filteredRoles.length} registros
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="text-gray-600">&lt;</span>
            </button>
            
            {[...Array(totalPages)].map((_, index) => {
              const pageNum = index + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={goToNextPage}
              disabled={totalPages <= 1 || currentPage === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="text-gray-600">&gt;</span>
            </button>
          </div>
        </div>
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (() => {
        // Módulos permitidos para crear roles
        const allowedModules = [
          'dashboard',      // Dashboard
          'users',          // Usuarios (incluye gestión de roles)
          'appointments',   // Agendamiento
          'schedules',      // Horarios
          'sales',          // Ventas
          'services',       // Servicios
          'clients',        // Clientes
          'purchases',      // Compras
          'supplies',       // Insumos
          'categories',     // Categoría de Insumos
          'suppliers',      // Proveedores
          'deliveries'      // Entrega de Insumos
        ];

        return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-6 text-white rounded-t-3xl">
              <h3 className="text-2xl font-bold">Crear Nuevo Rol</h3>
              <p className="text-pink-100 mt-2">Define un nuevo rol y selecciona los módulos de acceso</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del rol
                </label>
                <input
                  type="text"
                  value={newRoleData.name}
                  onChange={(e) => setNewRoleData({...newRoleData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  placeholder="Ej: Supervisor"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción del rol
                </label>
                <textarea
                  value={newRoleData.description}
                  onChange={(e) => setNewRoleData({...newRoleData, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                  rows={3}
                  placeholder="Describe las responsabilidades de este rol..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Módulos de acceso
                  <span className="block text-xs font-normal text-gray-500 mt-1">
                    Selecciona los módulos a los que este rol tendrá acceso
                  </span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-4 border border-gray-200 rounded-xl">
                  {Object.keys(permissionsByModule)
                    .filter(module => allowedModules.includes(module))
                    .sort()
                    .map(module => {
                      const ModuleIcon = getModuleIcon(module);
                      const modulePermissions = permissionsByModule[module].map(p => p.id);
                      const isModuleSelected = modulePermissions.every(permId => 
                        newRoleData.permissions.includes(permId)
                      );
                      
                      return (
                        <label 
                          key={module} 
                          className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            isModuleSelected 
                              ? 'border-pink-400 bg-gradient-to-r from-pink-50 to-purple-50' 
                              : 'border-gray-200 hover:border-pink-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isModuleSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                // Agregar todos los permisos del módulo
                                setNewRoleData({
                                  ...newRoleData,
                                  permissions: [...new Set([...newRoleData.permissions, ...modulePermissions])]
                                });
                              } else {
                                // Remover todos los permisos del módulo
                                setNewRoleData({
                                  ...newRoleData,
                                  permissions: newRoleData.permissions.filter(p => !modulePermissions.includes(p))
                                });
                              }
                            }}
                            className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                          />
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isModuleSelected 
                              ? 'bg-gradient-to-r from-pink-400 to-purple-500' 
                              : 'bg-gray-100'
                          }`}>
                            <ModuleIcon className={`w-5 h-5 ${
                              isModuleSelected ? 'text-white' : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className={`font-semibold ${
                              isModuleSelected ? 'text-purple-700' : 'text-gray-800'
                            }`}>
                              {moduleNames[module]}
                            </div>

                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewRoleData({ name: '', description: '', permissions: [] });
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <X className="w-5 h-5" />
                  <span>Cancelar</span>
                </button>
                <button
                  onClick={handleCreateRole}
                  className="flex-1 bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>Crear Rol</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* View Role Modal */}
      {viewingRole && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className={`bg-gradient-to-r ${getRoleColor(viewingRole.id)} p-6 text-white rounded-t-3xl`}>
              <div className="flex items-center space-x-3 mb-4">
                {React.createElement(getRoleIcon(viewingRole.id), { className: "w-8 h-8" })}
                <div>
                  <h3 className="text-2xl font-bold">{viewingRole.name}</h3>
                  <p className="text-sm opacity-90">Detalle del rol</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Información General</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID:</span>
                    <span className="font-medium text-gray-800">{viewingRole.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(viewingRole.status || 'active')}`}>
                      {getStatusLabel(viewingRole.status || 'active')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha de creación:</span>
                    <span className="font-medium text-gray-800">{viewingRole.createdAt || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Descripción</h4>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-4">{viewingRole.description}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-4">Permisos Asignados ({viewingRole.permissions.length})</h4>
                <div className="grid md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {viewingRole.permissions.map((permissionId) => {
                    const permission = mockPermissions.find(p => p.id === permissionId);
                    return permission ? (
                      <div key={permissionId} className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <div>
                          <div className="font-medium text-gray-800">{permission.name}</div>
                          <div className="text-sm text-gray-600">{permission.description}</div>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setViewingRole(null)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingRole && (() => {
        // Verificar si es el Super Administrador
        const isSuperAdmin = editingRole.id === 'super_admin' || editingRole.isSuperUser;
        // Si es super admin, asegurarse de que tenga todos los permisos
        const allPermissions = mockPermissions.map(p => p.id);
        if (isSuperAdmin && editingRole.permissions.length !== allPermissions.length) {
          editingRole.permissions = allPermissions;
        }
        
        return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className={`bg-gradient-to-r ${getRoleColor(editingRole.id)} p-6 text-white rounded-t-3xl`}>
              <h3 className="text-2xl font-bold">Editar Rol: {editingRole.name}</h3>
              <p className="text-sm opacity-90 mt-2">
                {isSuperAdmin 
                  ? 'Este rol tiene todos los permisos y no puede ser modificado'
                  : 'Modifica la descripción y permisos del rol'}
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Mensaje informativo para Super Admin */}
              {isSuperAdmin && (
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-6 h-6 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-gray-800 mb-1">Rol Protegido</h4>
                      <p className="text-sm text-gray-700">
                        El Super Administrador tiene todos los permisos del sistema habilitados de forma permanente. 
                        Este rol no puede ser modificado para garantizar el acceso completo al sistema.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del rol
                </label>
                <input
                  type="text"
                  value={editingRole.name}
                  onChange={(e) => setEditingRole({...editingRole, name: e.target.value})}
                  disabled={isSuperAdmin}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                    isSuperAdmin ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''
                  }`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción del rol
                </label>
                <textarea
                  value={editingRole.description}
                  onChange={(e) => setEditingRole({...editingRole, description: e.target.value})}
                  disabled={isSuperAdmin}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                    isSuperAdmin ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''
                  }`}
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Módulos de acceso
                  {isSuperAdmin && (
                    <span className="ml-2 text-xs text-purple-600 font-normal">
                      (Todos los permisos están habilitados permanentemente)
                    </span>
                  )}
                  {!isSuperAdmin && (
                    <span className="block text-xs font-normal text-gray-500 mt-1">
                      Selecciona los módulos a los que este rol tendrá acceso
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-4 border border-gray-200 rounded-xl">
                  {Object.keys(permissionsByModule)
                    .sort()
                    .map(module => {
                      const ModuleIcon = getModuleIcon(module);
                      const modulePermissions = permissionsByModule[module].map(p => p.id);
                      const isModuleSelected = modulePermissions.every(permId => 
                        editingRole.permissions.includes(permId)
                      );
                      
                      return (
                        <label 
                          key={module} 
                          className={`flex items-center space-x-3 p-4 border-2 rounded-xl transition-all ${
                            isSuperAdmin 
                              ? 'bg-gray-50 cursor-not-allowed border-gray-200' 
                              : isModuleSelected 
                                ? 'border-pink-400 bg-gradient-to-r from-pink-50 to-purple-50 cursor-pointer' 
                                : 'border-gray-200 hover:border-pink-200 hover:bg-gray-50 cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isModuleSelected}
                            disabled={isSuperAdmin}
                            onChange={(e) => {
                              if (!isSuperAdmin) {
                                if (e.target.checked) {
                                  // Agregar todos los permisos del módulo
                                  setEditingRole({
                                    ...editingRole,
                                    permissions: [...new Set([...editingRole.permissions, ...modulePermissions])]
                                  });
                                } else {
                                  // Remover todos los permisos del módulo
                                  setEditingRole({
                                    ...editingRole,
                                    permissions: editingRole.permissions.filter(p => !modulePermissions.includes(p))
                                  });
                                }
                              }
                            }}
                            className={`w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500 ${
                              isSuperAdmin ? 'cursor-not-allowed opacity-60' : ''
                            }`}
                          />
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isModuleSelected 
                              ? 'bg-gradient-to-r from-pink-400 to-purple-500' 
                              : 'bg-gray-100'
                          }`}>
                            <ModuleIcon className={`w-5 h-5 ${
                              isModuleSelected ? 'text-white' : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className={`font-semibold ${
                              isModuleSelected ? 'text-purple-700' : 'text-gray-800'
                            }`}>
                              {moduleNames[module]}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setEditingRole(null)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <X className="w-5 h-5" />
                  <span>{isSuperAdmin ? 'Cerrar' : 'Cancelar'}</span>
                </button>
                {!isSuperAdmin && (
                  <button
                    onClick={handleSaveRole}
                    className={`flex-1 bg-gradient-to-r ${getRoleColor(editingRole.id)} text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2`}
                  >
                    <Save className="w-5 h-5" />
                    <span>Guardar Cambios</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Delete Role Modal */}
      {showDeleteModal && roleToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Confirmar Eliminación</h3>
                  <p className="text-gray-600">Esta acción no se puede deshacer</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  ¿Estás segura de que quieres eliminar el rol <strong>{roleToDelete.name}</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 bg-gradient-to-r ${getRoleColor(roleToDelete.id)} rounded-full flex items-center justify-center`}>
                      {React.createElement(getRoleIcon(roleToDelete.id), { className: "w-5 h-5 text-white" })}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{roleToDelete.name}</div>
                      <div className="text-sm text-gray-600">{roleToDelete.permissions.length} permiso{roleToDelete.permissions.length !== 1 ? 's' : ''} asignado{roleToDelete.permissions.length !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteRole}
                  className="flex-1 bg-gradient-to-r from-red-400 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inactive Role Warning Modal */}
      {showInactiveWarningModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Advertencia</h3>
                  <p className="text-gray-600">No se puede inactivar el rol de Administrador</p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowInactiveWarningModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Role Warning Modal */}
      {showDeleteWarningModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Advertencia</h3>
                  <p className="text-gray-600">No se puede eliminar el rol de Administrador</p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteWarningModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Error Modal */}
      {showValidationErrorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-600">Campos Requeridos</h3>
                  <p className="text-gray-600">Por favor completa todos los campos</p>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <p className="text-red-700 font-medium text-center">
                    Debes completar el nombre y la descripción del rol antes de crearlo.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowValidationErrorModal(false)}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top-5 duration-300">
          <div className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-4 min-w-[320px]">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold">{alertMessage}</p>
            </div>
            <button
              onClick={() => setShowSuccessAlert(false)}
              className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}