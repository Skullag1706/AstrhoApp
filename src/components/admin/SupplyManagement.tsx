import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, FileText, Package, Wrench, AlertTriangle, Calendar, MapPin, X } from 'lucide-react';
import { mockSupplies, mockSuppliers } from '../../data/management';
import { calculateSupplyStats } from '../../utils/supplyUtils';
import { getTypeColor, getTypeLabel, getStatusColor, getStatusLabel } from '../../data/supplyConstants';
import { SupplyEditModal } from './modals/SupplyEditModal';
import { SimplePagination } from '../ui/simple-pagination';

interface SupplyManagementProps {
  hasPermission: (permission: string) => boolean;
}

export function SupplyManagement({ hasPermission }: SupplyManagementProps) {
  const [supplies, setSupplies] = useState(mockSupplies);
  const [selectedSupply, setSelectedSupply] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // 👈 Igual que Client

  // Reset a página 1 cuando cambia búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredSupplies = supplies.filter(supply => {
    const matchesSearch =
      supply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supply.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const stats = calculateSupplyStats(supplies);

  // 🔹 PAGINACIÓN (idéntica a Client)
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

  const handleCreateSupply = () => {
    setSelectedSupply(null);
    setShowEditModal(true);
  };

  const handleEditSupply = (supply: any) => {
    setSelectedSupply(supply);
    setShowEditModal(true);
  };

  const handleViewDetail = (supply: any) => {
    setSelectedSupply(supply);
    setShowDetailModal(true);
  };

  const handleDeleteSupply = (supplyId: number) => {
    const supply = supplies.find(s => s.id === supplyId);
    if (window.confirm(`¿Estás seguro de que quieres eliminar el insumo "${supply?.name}"?`)) {
      setSupplies(supplies.filter(s => s.id !== supplyId));
    }
  };

  const handleSaveSupply = (supplyData: any) => {
    if (selectedSupply) {
      setSupplies(supplies.map(s =>
        s.id === selectedSupply.id
          ? { ...s, ...supplyData, updatedAt: new Date().toISOString().split('T')[0] }
          : s
      ));
    } else {
      const newSupply = {
        id: Math.max(...supplies.map(s => s.id)) + 1,
        ...supplyData,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setSupplies([...supplies, newSupply]);
    }
    setShowEditModal(false);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gestión de Insumos</h2>
          <p className="text-gray-600">Control de inventario de insumos y materiales</p>
        </div>

        {hasPermission('manage_supplies') && (
          <button
            onClick={handleCreateSupply}
            className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Insumo</span>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<Wrench className="w-8 h-8 text-blue-600" />} value={stats.totalSupplies} label="Total Insumos" />
        <StatCard icon={<AlertTriangle className="w-8 h-8 text-yellow-600" />} value={stats.lowStockSupplies} label="Stock Bajo" />
        <StatCard icon={<AlertTriangle className="w-8 h-8 text-red-600" />} value={stats.expiredSupplies} label="Vencidos" />
        <StatCard icon={<Calendar className="w-8 h-8 text-orange-600" />} value={stats.expiringSoonSupplies} label="Por Vencer" />
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar insumos por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
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
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Nombre</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">SKU</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Tipo</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Stock</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Costo</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Estado</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-800">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {paginatedSupplies.map((supply) => (
                <tr key={supply.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-800">{supply.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{supply.sku}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(supply.type)}`}>
                      {getTypeLabel(supply.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {supply.quantity} {supply.unit}
                  </td>
                  <td className="px-6 py-4 font-semibold">
                    ${supply.unitCost?.toLocaleString() || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(supply.status)}`}>
                      {getStatusLabel(supply.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex space-x-2">
                    <button onClick={() => handleViewDetail(supply)} className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                      <Eye className="w-4 h-4" />
                    </button>
                    {hasPermission('manage_supplies') && (
                      <>
                        <button onClick={() => handleEditSupply(supply)} className="p-2 bg-green-100 text-green-700 rounded-lg">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteSupply(supply.id)} className="p-2 bg-red-100 text-red-700 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 🔹 Footer idéntico a Client */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {filteredSupplies.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
            {' - '}
            {Math.min(currentPage * itemsPerPage, filteredSupplies.length)}
            {' de '}
            {filteredSupplies.length} registros
          </div>

          <SimplePagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={goToPage}
          />
        </div>
      </div>

      {showEditModal && (
        <SupplyEditModal
          supply={selectedSupply}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveSupply}
          suppliers={mockSuppliers}
        />
      )}
    </div>
  );
}

function StatCard({ icon, value, label }: any) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
      {icon}
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-600">{label}</p>
      </div>
    </div>
  );
}
