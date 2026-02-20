import React, { useState } from 'react';
import { X, Save, AlertCircle, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { Supply } from '../../../data/management';
import { SUPPLY_TYPES, SUPPLY_STATUSES } from '../../../data/supplyConstants';

interface SupplyEditModalProps {
  supply: Supply | null;
  onClose: () => void;
  onSave: (supplyData: any) => void;
  suppliers: any[];
}

export function SupplyEditModal({ supply, onClose, onSave, suppliers }: SupplyEditModalProps) {
  // Si es modo edición, usamos el formulario simple
  if (supply) {
    return <SingleSupplyForm supply={supply} onClose={onClose} onSave={onSave} suppliers={suppliers} />;
  }
  
  // Si es modo creación, usamos el formulario múltiple
  return <MultipleSupplyForm onClose={onClose} onSave={onSave} suppliers={suppliers} />;
}

// Formulario para editar un solo insumo (modo edición)
function SingleSupplyForm({ supply, onClose, onSave, suppliers }) {
  const [formData, setFormData] = useState({
    name: supply?.name || '',
    description: supply?.description || '',
    sku: supply?.sku || '',
    type: supply?.type || 'consumable',
    quantity: supply?.quantity || 0,
    unit: supply?.unit || 'unidades',
    expirationDate: supply?.expirationDate || '',
    status: supply?.status || 'active',
    supplierId: supply?.supplierId || '',
    unitCost: supply?.unitCost || 0,
    minStock: supply?.minStock || 0,
    maxStock: supply?.maxStock || 0,
    notes: supply?.notes || '',
    imageUrl: supply?.imageUrl || ''
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(supply?.imageUrl || '');
  const [errors, setErrors] = useState({});

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: any = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';
    if (!formData.sku.trim()) newErrors.sku = 'El SKU es requerido';

    if (formData.quantity < 0) newErrors.quantity = 'La cantidad no puede ser negativa';
    if (formData.unitCost < 0) newErrors.unitCost = 'El precio no puede ser negativo';
    if (formData.minStock < 0) newErrors.minStock = 'El stock mínimo no puede ser negativo';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Si hay una imagen nueva, incluirla en los datos
    const dataToSave = {
      ...formData,
      imageUrl: imagePreview
    };

    onSave(dataToSave);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ['quantity', 'unitCost', 'minStock', 'maxStock'].includes(name) 
        ? parseFloat(value) || 0 
        : value
    });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-400 to-purple-500 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Editar Insumo</h3>
              <p className="text-blue-100">Actualiza la información del insumo</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Imagen del Insumo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Imagen del Insumo
            </label>
            <div className="flex items-start space-x-4">
              <div className="flex-1">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-pink-400 transition-colors bg-gray-50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      {imageFile ? imageFile.name : 'Haz clic para subir imagen'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG hasta 5MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              
              {imagePreview && (
                <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-200">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {!imagePreview && (
                <div className="w-32 h-32 rounded-xl bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                  <ImageIcon className="w-12 h-12 text-gray-300" />
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Nombre del insumo"
              />
              {errors.name && (
                <div className="flex items-center space-x-1 mt-1 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{errors.name}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                  errors.sku ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Código SKU"
              />
              {errors.sku && (
                <div className="flex items-center space-x-1 mt-1 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{errors.sku}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Descripción detallada del insumo"
            />
            {errors.description && (
              <div className="flex items-center space-x-1 mt-1 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{errors.description}</span>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              >
                {Object.entries(SUPPLY_TYPES).map(([key, type]) => (
                  <option key={key} value={key}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Estado
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              >
                {Object.entries(SUPPLY_STATUSES).map(([key, status]) => (
                  <option key={key} value={key}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cantidad Actual
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Unidad
              </label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                placeholder="ej: litros, unidades"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stock Mínimo
              </label>
              <input
                type="number"
                name="minStock"
                value={formData.minStock}
                onChange={handleInputChange}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stock Máximo
              </label>
              <input
                type="number"
                name="maxStock"
                value={formData.maxStock}
                onChange={handleInputChange}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fecha de Vencimiento
            </label>
            <input
              type="date"
              name="expirationDate"
              value={formData.expirationDate}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Costo Unitario
            </label>
            <input
              type="number"
              name="unitCost"
              value={formData.unitCost}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              placeholder="Precio de costo en COP"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent"
              placeholder="Observaciones adicionales sobre el insumo"
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
            >
              <X className="w-5 h-5" />
              <span>Cancelar</span>
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>Actualizar Insumo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Formulario para agregar múltiples insumos (modo creación)
function MultipleSupplyForm({ onClose, onSave, suppliers }) {
  const [supplies, setSupplies] = useState([
    {
      name: '',
      description: '',
      sku: '',
      type: 'consumable',
      supplierId: '',
      unit: 'unidades',
      expirationDate: '',
      status: 'active',
      unitCost: 0,
      minStock: 0,
      maxStock: 0,
      notes: '',
      imageUrl: ''
    }
  ]);

  const [imageFiles, setImageFiles] = useState<{ [key: number]: string }>({});

  const addSupply = () => {
    setSupplies([...supplies, {
      name: '',
      description: '',
      sku: '',
      type: 'consumable',
      supplierId: '',
      unit: 'unidades',
      expirationDate: '',
      status: 'active',
      unitCost: 0,
      minStock: 0,
      maxStock: 0,
      notes: '',
      imageUrl: ''
    }]);
  };

  const removeSupply = (index) => {
    if (supplies.length === 1) return;
    setSupplies(supplies.filter((_, i) => i !== index));
    
    // Limpiar imagen del insumo eliminado
    const newImageFiles = { ...imageFiles };
    delete newImageFiles[index];
    setImageFiles(newImageFiles);
  };

  const updateSupply = (index, field, value) => {
    const newSupplies = [...supplies];
    newSupplies[index] = {
      ...newSupplies[index],
      [field]: ['quantity', 'unitCost', 'minStock', 'maxStock'].includes(field)
        ? parseFloat(value) || 0
        : value
    };
    setSupplies(newSupplies);
  };

  const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageFiles({ ...imageFiles, [index]: base64String });
        updateSupply(index, 'imageUrl', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validar que todos los insumos tengan datos básicos
    for (let i = 0; i < supplies.length; i++) {
      const supply = supplies[i];
      if (!supply.name.trim() || !supply.description.trim() || !supply.sku.trim()) {
        alert(`El insumo ${i + 1} debe tener nombre, descripción y SKU`);
        return;
      }
    }

    // Guardar todos los insumos
    supplies.forEach(supply => {
      onSave(supply);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl my-8">
        <div className="bg-gradient-to-r from-blue-400 to-purple-500 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Agregar Insumos</h3>
              <p className="text-blue-100">Agrega uno o varios insumos a la vez</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {supplies.length} insumo{supplies.length !== 1 ? 's' : ''} en el carrito
            </p>
            <button
              type="button"
              onClick={addSupply}
              className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-4 py-2 rounded-lg text-sm hover:shadow-lg transition-all flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Otro Insumo</span>
            </button>
          </div>

          <div className="space-y-4">
            {supplies.map((supply, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-800">Insumo {index + 1}</h4>
                  {supplies.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSupply(index)}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      title="Eliminar insumo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Imagen del Insumo */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Imagen del Insumo
                  </label>
                  <div className="flex items-start space-x-4">
                    <div className="flex-1">
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-pink-400 transition-colors bg-white">
                        <div className="flex flex-col items-center justify-center pt-3 pb-3">
                          <Upload className="w-6 h-6 text-gray-400 mb-1" />
                          <p className="text-xs text-gray-600">
                            {imageFiles[index] ? 'Imagen cargada' : 'Subir imagen'}
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageChange(index, e)}
                        />
                      </label>
                    </div>
                    
                    {imageFiles[index] && (
                      <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200">
                        <img
                          src={imageFiles[index]}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {!imageFiles[index] && (
                      <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={supply.name}
                      onChange={(e) => updateSupply(index, 'name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
                      placeholder="Nombre del insumo"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      SKU *
                    </label>
                    <input
                      type="text"
                      value={supply.sku}
                      onChange={(e) => updateSupply(index, 'sku', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
                      placeholder="Código SKU"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descripción *
                  </label>
                  <textarea
                    value={supply.description}
                    onChange={(e) => updateSupply(index, 'description', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
                    placeholder="Descripción del insumo"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tipo
                    </label>
                    <select
                      value={supply.type}
                      onChange={(e) => updateSupply(index, 'type', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
                    >
                      {Object.entries(SUPPLY_TYPES).map(([key, type]) => (
                        <option key={key} value={key}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Proveedor
                    </label>
                    <select
                      value={supply.supplierId}
                      onChange={(e) => updateSupply(index, 'supplierId', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
                    >
                      <option value="">Seleccionar proveedor...</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Unidad
                    </label>
                    <input
                      type="text"
                      value={supply.unit}
                      onChange={(e) => updateSupply(index, 'unit', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
                      placeholder="ej: litros"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Costo Unit.
                    </label>
                    <input
                      type="number"
                      value={supply.unitCost}
                      onChange={(e) => updateSupply(index, 'unitCost', e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Vencimiento
                    </label>
                    <input
                      type="date"
                      value={supply.expirationDate}
                      onChange={(e) => updateSupply(index, 'expirationDate', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
            >
              <X className="w-5 h-5" />
              <span>Cancelar</span>
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-400 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>Crear {supplies.length} Insumo{supplies.length !== 1 ? 's' : ''}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}