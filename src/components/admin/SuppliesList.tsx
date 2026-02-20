import React, { useState } from 'react';
import { 
  Package, Edit, Trash2, Eye, Search, Filter, Plus,
  AlertCircle, CheckCircle, Clock, Archive
} from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../ui/pagination';

// Mock data for supplies
const mockSupplies = [
  {
    id: 1,
    name: 'Tinte Rubio Cenizo',
    description: 'Tinte permanente para coloración professional',
    sku: 'TIN-001',
    type: 'chemical',
    quantity: 25,
    unit: 'unidad',
    location: 'Almacén A - Estante 3',
    expirationDate: '2025-06-15',
    status: 'active',
    supplierId: 1,
    supplierName: 'Distribuidora L\'Oréal',
    costPrice: 18500,
    minStock: 10,
    maxStock: 50,
    assignedTo: [2, 3],
    notes: 'Revisar fecha de vencimiento mensualmente',
    createdAt: '2023-08-15',
    updatedAt: '2024-01-16'
  },
  {
    id: 2,
    name: 'Tijeras Profesionales',
    description: 'Tijeras de acero inoxidable para corte profesional',
    sku: 'HER-001',
    type: 'tool',
    quantity: 8,
    unit: 'unidad',
    location: 'Estación 1',
    status: 'active',
    supplierId: 2,
    supplierName: 'Herramientas Beauty Pro',
    costPrice: 125000,
    minStock: 5,
    maxStock: 15,
    assignedTo: [1, 2],
    notes: 'Requiere mantenimiento semestral',
    createdAt: '2023-06-20',
    updatedAt: '2024-01-10'
  },
  {
    id: 3,
    name: 'Papel Aluminio',
    description: 'Papel aluminio para mechas y reflejos',
    sku: 'CON-001',
    type: 'consumable',
    quantity: 3,
    unit: 'rollo',
    location: 'Almacén B - Estante 1',
    status: 'low_stock',
    supplierId: 3,
    supplierName: 'Suministros Belleza Total',
    costPrice: 8500,
    minStock: 5,
    maxStock: 20,
    assignedTo: [1, 2, 3],
    notes: 'Stock bajo - solicitar reposición',
    createdAt: '2023-09-05',
    updatedAt: '2024-01-15'
  },
  {
    id: 4,
    name: 'Secador Profesional',
    description: 'Secador de pelo profesional 2000W',
    sku: 'EQU-001',
    type: 'equipment',
    quantity: 4,
    unit: 'unidad',
    location: 'Estación 2',
    status: 'active',
    supplierId: 4,
    supplierName: 'Equipos Hair Studio',
    costPrice: 285000,
    minStock: 3,
    maxStock: 8,
    assignedTo: [2, 3],
    notes: 'Garantía hasta diciembre 2024',
    createdAt: '2023-05-12',
    updatedAt: '2024-01-08'
  },
  {
    id: 5,
    name: 'Desinfectante Instrumental',
    description: 'Solución desinfectante para herramientas',
    sku: 'LIM-001',
    type: 'cleaning',
    quantity: 12,
    unit: 'litro',
    location: 'Área de Limpieza',
    expirationDate: '2024-12-30',
    status: 'active',
    supplierId: 5,
    supplierName: 'Productos de Limpieza Medellín',
    costPrice: 15500,
    minStock: 8,
    maxStock: 25,
    assignedTo: [1, 2, 3],
    notes: 'Uso obligatorio después de cada cliente',
    createdAt: '2023-11-22',
    updatedAt: '2024-01-14'
  },
  {
    id: 6,
    name: 'Oxidante 30 Vol',
    description: 'Peróxido de hidrógeno al 9% para coloración',
    sku: 'QUI-001',
    type: 'chemical',
    quantity: 18,
    unit: 'litro',
    location: 'Almacén A - Estante 4',
    expirationDate: '2024-08-20',
    status: 'active',
    supplierId: 1,
    supplierName: 'Distribuidora L\'Oréal',
    costPrice: 12800,
    minStock: 15,
    maxStock: 40,
    assignedTo: [1, 2],
    notes: 'Almacenar en lugar fresco y seco',
    createdAt: '2023-07-08',
    updatedAt: '2024-01-12'
  }
];

interface SuppliesListProps {
  hasPermission: (permission: string) => boolean;
}

export function SuppliesList({ hasPermission }: SuppliesListProps) {
  const [supplies, setSupplies] = useState(mockSupplies);
  const [selectedSupply, setSelectedSupply] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [supplyToDelete, setSupplyToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filter supplies
  const filteredSupplies = supplies.filter(supply => {
    const matchesSearch = supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supply.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supply.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || supply.type === filterType;
    const matchesStatus = filterStatus === 'all' || supply.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSupplies.length / itemsPerPage);
  const paginatedSupplies = filteredSupplies.slice(
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

  const handleViewSupply = (supply) => {
    setSelectedSupply(supply);
    setShowDetailModal(true);
  };

  const handleDeleteSupply = (supply) => {
    setSupplyToDelete(supply);
    setShowDeleteModal(true);
  };

  const confirmDeleteSupply = () => {
    if (supplyToDelete) {
      setSupplies(supplies.filter(s => s.id !== supplyToDelete.id));
      setShowDeleteModal(false);
      setSupplyToDelete(null);
    }
  };

  const getTypeDisplayName = (type) => {
    const types = {
      chemical: 'Químico',
      tool: 'Herramienta',
      equipment: 'Equipo',
      consumable: 'Consumible',
      cleaning: 'Limpieza'
    };
    return types[type] || type;
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      chemical: 'bg-orange-100 text-orange-800',
      tool: 'bg-blue-100 text-blue-800',
      equipment: 'bg-purple-100 text-purple-800',
      consumable: 'bg-green-100 text-green-800',
      cleaning: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusDisplayName = (status) => {
    const statuses = {
      active: 'Activo',
      inactive: 'Inactivo',
      expired: 'Vencido',
      low_stock: 'Stock Bajo'
    };
    return statuses[status] || status;
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800',
      low_stock: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'low_stock': return AlertCircle;
      case 'expired': return Clock;
      case 'inactive': return Archive;
      default: return CheckCircle;
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gestión de Insumos</h2>
          <p className="text-gray-600">
            Administra los insumos y materiales del salón
          </p>
        </div>

        {hasPermission('manage_supplies') && (
          <button className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Nuevo Insumo</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <Package className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-800">{supplies.length}</p>
              <p className="text-sm text-blue-600">Total Insumos</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-800">
                {supplies.filter(s => s.status === 'active').length}
              </p>
              <p className="text-sm text-green-600">Activos</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-yellow-800">
                {supplies.filter(s => s.status === 'low_stock').length}
              </p>
              <p className="text-sm text-yellow-600">Stock Bajo</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <Clock className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-800">
                {supplies.filter(s => s.status === 'expired').length}
              </p>
              <p className="text-sm text-red-600">Vencidos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, SKU o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
            >
              <option value="all">Todos los tipos</option>
              <option value="chemical">Químico</option>
              <option value="tool">Herramienta</option>
              <option value="equipment">Equipo</option>
              <option value="consumable">Consumible</option>
              <option value="cleaning">Limpieza</option>
            </select>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="low_stock">Stock Bajo</option>
            <option value="expired">Vencido</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>
      </div>

      {/* Supplies Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">Lista de Insumos</h3>
          <p className="text-gray-600">
            {filteredSupplies.length} insumo{filteredSupplies.length !== 1 ? 's' : ''} encontrado{filteredSupplies.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Insumo</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Tipo</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Stock</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Ubicación</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Estado</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedSupplies.map((supply) => {
                const StatusIcon = getStatusIcon(supply.status);
                
                return (
                  <tr key={supply.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{supply.name}</div>
                          <div className="text-sm text-gray-600">SKU: {supply.sku}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeBadgeColor(supply.type)}`}>
                        {getTypeDisplayName(supply.type)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-800">
                          {supply.quantity} {supply.unit}
                        </div>
                        <div className="text-sm text-gray-600">
                          Min: {supply.minStock} | Max: {supply.maxStock}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-gray-800">{supply.location}</div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className={`w-4 h-4 ${
                          supply.status === 'active' ? 'text-green-500' :
                          supply.status === 'low_stock' ? 'text-yellow-500' :
                          supply.status === 'expired' ? 'text-red-500' :
                          'text-gray-500'
                        }`} />
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(supply.status)}`}>
                          {getStatusDisplayName(supply.status)}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewSupply(supply)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {hasPermission('manage_supplies') && (
                          <>
                            <button
                              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                              title="Editar insumo"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteSupply(supply)}
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                              title="Eliminar insumo"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredSupplies.length)} de {filteredSupplies.length} registros
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={goToPreviousPage}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {/* First page */}
                {currentPage > 3 && (
                  <>
                    <PaginationItem>
                      <PaginationLink onClick={() => goToPage(1)} className="cursor-pointer">
                        1
                      </PaginationLink>
                    </PaginationItem>
                    {currentPage > 4 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                  </>
                )}
                
                {/* Pages around current page */}
                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  if (pageNum >= currentPage - 2 && pageNum <= currentPage + 2) {
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => goToPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className={`cursor-pointer ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white border-pink-400'
                              : ''
                          }`}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  return null;
                })}
                
                {/* Last page */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink onClick={() => goToPage(totalPages)} className="cursor-pointer">
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={goToNextPage}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Supply Detail Modal */}
      {showDetailModal && selectedSupply && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-6 text-white rounded-t-3xl">
              <div className="flex items-center space-x-3 mb-4">
                <Package className="w-8 h-8" />
                <div>
                  <h3 className="text-2xl font-bold">{selectedSupply.name}</h3>
                  <p className="text-pink-100">Detalle del insumo</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-4">Información Básica</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <span className="text-sm text-gray-600">SKU</span>
                    <p className="font-semibold text-gray-800">{selectedSupply.sku}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <span className="text-sm text-gray-600">Tipo</span>
                    <p className="font-semibold text-gray-800">{getTypeDisplayName(selectedSupply.type)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <span className="text-sm text-gray-600">Cantidad Actual</span>
                    <p className="font-semibold text-gray-800">{selectedSupply.quantity} {selectedSupply.unit}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <span className="text-sm text-gray-600">Estado</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(selectedSupply.status)}`}>
                      {getStatusDisplayName(selectedSupply.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Descripción</h4>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-4">{selectedSupply.description}</p>
              </div>

              {/* Stock Information */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-4">Información de Stock</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <span className="text-sm text-gray-600">Stock Mínimo</span>
                    <p className="font-semibold text-gray-800">{selectedSupply.minStock} {selectedSupply.unit}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <span className="text-sm text-gray-600">Stock Máximo</span>
                    <p className="font-semibold text-gray-800">{selectedSupply.maxStock} {selectedSupply.unit}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <span className="text-sm text-gray-600">Precio de Costo</span>
                    <p className="font-semibold text-gray-800">${selectedSupply.costPrice.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Location and Dates */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-4">Ubicación y Fechas</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <span className="text-sm text-gray-600">Ubicación</span>
                    <p className="font-semibold text-gray-800">{selectedSupply.location}</p>
                  </div>
                  {selectedSupply.expirationDate && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <span className="text-sm text-gray-600">Fecha de Vencimiento</span>
                      <p className="font-semibold text-gray-800">{selectedSupply.expirationDate}</p>
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <span className="text-sm text-gray-600">Creado</span>
                    <p className="font-semibold text-gray-800">{selectedSupply.createdAt}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <span className="text-sm text-gray-600">Última Actualización</span>
                    <p className="font-semibold text-gray-800">{selectedSupply.updatedAt}</p>
                  </div>
                </div>
              </div>

              {/* Supplier Information */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-4">Información del Proveedor</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <span className="text-sm text-gray-600">Proveedor</span>
                  <p className="font-semibold text-gray-800">{selectedSupply.supplierName}</p>
                </div>
              </div>

              {/* Notes */}
              {selectedSupply.notes && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Notas</h4>
                  <p className="text-gray-700 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    {selectedSupply.notes}
                  </p>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && supplyToDelete && (
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
                  ¿Estás segura de que quieres eliminar el insumo <strong>{supplyToDelete.name}</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <Package className="w-8 h-8 text-red-500" />
                    <div>
                      <div className="font-semibold text-gray-800">{supplyToDelete.name}</div>
                      <div className="text-sm text-gray-600">SKU: {supplyToDelete.sku}</div>
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
                  onClick={confirmDeleteSupply}
                  className="flex-1 bg-gradient-to-r from-red-400 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}