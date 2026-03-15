import React, { useState } from 'react';
import { X, Save, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Supply } from '../../../data/management';

interface SupplyEditModalProps {
  supply: Supply | null;
  onClose: () => void;
  onSave: (supplyData: any) => void;
  suppliers: any[];
}

export function SupplyEditModal({ supply, onClose, onSave, suppliers }: SupplyEditModalProps) {
  if (supply) {
    return <SingleSupplyForm supply={supply} onClose={onClose} onSave={onSave} suppliers={suppliers} />;
  }
  return <MultipleSupplyForm onClose={onClose} onSave={onSave} suppliers={suppliers} />;
}

function SingleSupplyForm({ supply, onClose, onSave, suppliers }: any) {
  const [formData, setFormData] = useState({
    nombre: supply?.nombre || '',
    descripcion: supply?.descripcion || '',
    sku: supply?.sku || '',
    categoriaId: supply?.categoriaId || 1,
    cantidad: supply?.cantidad || supply?.stock || 0,
    estado: supply?.estado ?? true,
    notes: supply?.notes || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: any = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.descripcion.trim()) newErrors.descripcion = 'La descripción es requerida';
    if (formData.cantidad < 0) newErrors.cantidad = 'La cantidad no puede ser negativa';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'cantidad' || name === 'categoriaId'
        ? parseInt(value) || 0
        : name === 'estado'
          ? value === 'true'
          : value
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Editar Insumo</h3>
              <p className="text-pink-100/80 text-sm">Actualizar información del producto</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nombre</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all outline-none"
                placeholder="Nombre"
              />
              {errors.nombre && <p className="text-red-500 text-[10px] mt-1 ml-1">{errors.nombre}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">SKU</label>
              <input
                type="text"
                value={formData.sku}
                readOnly
                className="w-full px-4 py-2 bg-gray-100 border border-transparent rounded-xl text-sm text-gray-400 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all outline-none resize-none"
              placeholder="Descripción breve..."
            />
            {errors.descripcion && <p className="text-red-500 text-[10px] mt-1 ml-1">{errors.descripcion}</p>}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Estado</label>
              <select
                name="estado"
                value={formData.estado.toString()}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all outline-none"
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Stock</label>
              <input
                type="number"
                name="cantidad"
                value={formData.cantidad}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all outline-none"
                min="0"
              />
              {errors.cantidad && <p className="text-red-500 text-[10px] mt-1 ml-1">{errors.cantidad}</p>}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-all uppercase tracking-wider border border-gray-200">
              Cancelar
            </button>
            <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-pink-200 transition-all uppercase tracking-wider text-sm">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MultipleSupplyForm({ onClose, onSave, suppliers }: any) {
  const [supplies, setSupplies] = useState([
    { nombre: '', descripcion: '', sku: 'AUTO-GENERADO', categoriaId: 1, cantidad: 0, estado: true, notes: '' }
  ]);

  const addSupply = () => {
    setSupplies([...supplies, { nombre: '', descripcion: '', sku: 'AUTO-GENERADO', categoriaId: 1, cantidad: 0, estado: true, notes: '' }]);
  };

  const removeSupply = (index: number) => {
    if (supplies.length === 1) return;
    setSupplies(supplies.filter((_, i) => i !== index));
  };

  const updateSupply = (index: number, field: string, value: any) => {
    const newSupplies = [...supplies];
    newSupplies[index] = { ...newSupplies[index], [field]: field === 'cantidad' || field === 'categoriaId' ? parseInt(value) || 0 : value };
    setSupplies(newSupplies);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (let i = 0; i < supplies.length; i++) {
      const supply = supplies[i];
      if (!supply.nombre.trim() || !supply.descripcion.trim()) {
        alert(`El insumo ${i + 1} debe tener nombre y descripción`);
        return;
      }
    }
    supplies.forEach(supply => {
      const { sku, ...dataToSave } = supply;
      onSave(dataToSave);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Registrar Insumos</h3>
              <p className="text-pink-100/80 text-sm">Carga múltiple de productos</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-8 flex-1 overflow-y-auto">
          {/* Action Bar */}
          <div className="flex items-center justify-between mb-8">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{supplies.length} en lista</span>
            <button
              onClick={addSupply}
              className="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Agregar Otro
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {supplies.map((supply, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 relative group transition-all hover:bg-white hover:shadow-xl hover:shadow-pink-50/20">
                <div className="flex items-center justify-between mb-6">
                  <span className="bg-pink-50 text-pink-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-pink-100">
                    Insumo #{index + 1}
                  </span>
                  {supplies.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSupply(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Nombre</label>
                    <input
                      type="text"
                      value={supply.nombre}
                      onChange={(e) => updateSupply(index, 'nombre', e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-400 outline-none transition-all placeholder:text-gray-300"
                      placeholder="Nombre del insumo"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">SKU</label>
                    <input
                      type="text"
                      value={supply.sku}
                      readOnly
                      className="w-full px-4 py-2 bg-gray-100 border border-transparent rounded-xl text-sm text-gray-400 font-mono"
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Descripción</label>
                  <textarea
                    value={supply.descripcion}
                    onChange={(e) => updateSupply(index, 'descripcion', e.target.value)}
                    rows={1}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-400 outline-none transition-all resize-none placeholder:text-gray-300"
                    placeholder="Descripción técnica"
                  />
                </div>

                <div className="mt-6 space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Cantidad Inicial</label>
                  <input
                    type="number"
                    value={supply.cantidad}
                    onChange={(e) => updateSupply(index, 'cantidad', e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-400 outline-none transition-all"
                    min="0"
                  />
                </div>
              </div>
            ))}

            <div className="flex gap-4 pt-4 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 border border-gray-200 rounded-xl transition-all uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-pink-200 transition-all uppercase tracking-widest text-sm"
              >
                Registrar Insumos
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}