import { apiClient } from './apiClient';

export interface SaleServiceItem {
  serviceId?: number | string;
  appointmentId?: number | string;
  price: number;
  discount?: number;
  totalPrice: number;
  name?: string;
}

export interface SaleInsumoItem {
  insumoId?: number | string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  totalPrice: number;
  name?: string;
}

export interface SaleView {
  id: string;
  customerId?: string | number;
  customerName?: string;
  employeeId?: string | number;
  employeeName?: string;
  date: string;
  time: string;
  items: SaleInsumoItem[];
  services: SaleServiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'mixed' | 'nequi' | 'daviplata';
  status: 'completed' | 'refunded' | string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

function toPaymentMethod(pm: string | null | undefined): SaleView['paymentMethod'] {
  const s = String(pm || '').toLowerCase();
  if (s.includes('efectivo') || s === 'cash') return 'cash';
  if (s.includes('tarjeta') || s === 'card') return 'card';
  if (s.includes('transfer') || s.includes('transferencia')) return 'transfer';
  if (s.includes('nequi')) return 'nequi';
  if (s.includes('daviplata')) return 'daviplata';
  return 'cash';
}

function toStatus(st: string | boolean | null | undefined): SaleView['status'] {
  if (typeof st === 'boolean') return st ? 'completed' : 'refunded';
  const s = String(st || '').toLowerCase();
  if (s.includes('refund') || s.includes('reembolso') || s.includes('anulada') || s.includes('cancel')) return 'refunded';
  return 'completed';
}

function safeNumber(n: any, fallback = 0): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

function extractDateTime(dateStr: any): { date: string; time: string } {
  if (!dateStr) {
    const d = new Date();
    return { date: d.toISOString().split('T')[0], time: d.toTimeString().slice(0, 5) };
  }
  const s = String(dateStr);
  if (s.includes('T')) {
    const [d, t] = s.split('T');
    return { date: d, time: t.slice(0, 5) };
  }
  return { date: s, time: '00:00' };
}

function mapApiSaleToView(apiSale: any): SaleView {
  const id =
    apiSale?.sale_number ||
    apiSale?.ventaId ||
    apiSale?.id ||
    `VNT-${String(apiSale?.ventaId || Math.floor(Math.random() * 100000)).padStart(3, '0')}`;

  const dt = extractDateTime(apiSale?.sale_date || apiSale?.fechaVenta || apiSale?.fecha || apiSale?.createdAt);

  const items: SaleInsumoItem[] = Array.isArray(apiSale?.items)
    ? apiSale.items
      .filter((it: any) => String(it?.item_type || it?.tipo || it?.item_tipo)?.toLowerCase().includes('insumo') || String(it?.item_type || it?.tipo || it?.item_tipo)?.toLowerCase().includes('product'))
      .map((it: any) => ({
        insumoId: it?.insumo_id ?? it?.insumoId ?? it?.product_id ?? it?.productoId,
        quantity: safeNumber(it?.quantity ?? it?.cantidad ?? 1, 1),
        unitPrice: safeNumber(it?.unit_price ?? it?.precioUnitario),
        discount: safeNumber(it?.discount ?? it?.descuento),
        totalPrice: safeNumber(it?.total ?? it?.totalPrice ?? it?.subtotal),
        name: it?.insumo_name ?? it?.nombreInsumo ?? it?.product_name ?? it?.nombreProducto,
      }))
    : [];

  const services: SaleServiceItem[] = Array.isArray(apiSale?.items)
    ? apiSale.items
      .filter((it: any) => String(it?.item_type || it?.tipo)?.toLowerCase().includes('serv'))
      .map((it: any) => ({
        serviceId: it?.service_id ?? it?.servicioId,
        appointmentId: apiSale?.appointment_id ?? apiSale?.citaId,
        price: safeNumber(it?.unit_price ?? it?.precio),
        discount: safeNumber(it?.discount ?? it?.descuento),
        totalPrice: safeNumber(it?.total ?? it?.totalPrice ?? it?.subtotal),
        name: it?.service_name ?? it?.nombreServicio,
      }))
    : Array.isArray(apiSale?.servicios)
      ? apiSale.servicios.map((s: any) => ({
        serviceId: s?.servicioId ?? s?.id,
        appointmentId: s?.appointmentId ?? apiSale?.appointment_id,
        price: safeNumber(s?.precio),
        discount: safeNumber(s?.descuento),
        totalPrice: safeNumber(s?.totalPrice ?? s?.subtotal ?? s?.precio),
        name: s?.nombre,
      }))
      : [];

  const subtotal = safeNumber(apiSale?.subtotal);
  const discount = safeNumber(apiSale?.discount ?? apiSale?.descuento);
  const tax = safeNumber(apiSale?.tax ?? apiSale?.iva);
  const total =
    safeNumber(apiSale?.total) ||
    items.reduce((acc, i) => acc + safeNumber(i.totalPrice), 0) +
    services.reduce((acc, s) => acc + safeNumber(s.totalPrice), 0);

  return {
    id: String(id),
    customerId: apiSale?.customer_id ?? apiSale?.clienteId ?? apiSale?.cliente?.id,
    customerName: apiSale?.customer_name ?? apiSale?.clienteNombre ?? apiSale?.cliente?.nombre,
    employeeId: apiSale?.user_id ?? apiSale?.empleadoId ?? apiSale?.empleado?.id,
    employeeName: apiSale?.user_name ?? apiSale?.empleadoNombre ?? apiSale?.empleado?.nombre,
    date: dt.date,
    time: dt.time,
    items,
    services,
    subtotal,
    discount,
    tax,
    total,
    paymentMethod: toPaymentMethod(apiSale?.payment_method ?? apiSale?.metodoPago),
    status: toStatus(apiSale?.payment_status ?? apiSale?.estado),
    notes: apiSale?.notes ?? apiSale?.observaciones,
    createdAt: apiSale?.created_at ?? apiSale?.createdAt,
    updatedAt: apiSale?.updated_at ?? apiSale?.updatedAt,
  };
}

export const salesService = {
  async getAll(): Promise<SaleView[]> {
    const endpoints = ['/Ventas', '/Venta', '/Sales'];
    for (const ep of endpoints) {
      try {
        const res = await apiClient.get(ep);
        if (Array.isArray(res)) {
          return res.map(mapApiSaleToView);
        }
        if (res && typeof res === 'object') {
          const values = Object.values(res);
          const arr = values.find((v: any) => Array.isArray(v)) as any[] | undefined;
          if (arr && Array.isArray(arr)) {
            return arr.map(mapApiSaleToView);
          }
        }
      } catch (err) {
        // try next endpoint
        continue;
      }
    }
    return [];
  },

  async getById(id: string | number): Promise<SaleView> {
    const res = await apiClient.get(`/Ventas/${id}`);
    return mapApiSaleToView(res);
  },

  async update(id: string | number, data: any): Promise<SaleView | null> {
    const res = await apiClient.put(`/Ventas/${id}`, data);
    if (!res) return null;
    return mapApiSaleToView(res);
  },
};
