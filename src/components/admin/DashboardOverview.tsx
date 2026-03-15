import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Star,
  UserCheck,
  RefreshCw,
  AlertTriangle,
  Users,
  Calendar,
  TrendingUp,
  Package,
  DollarSign,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { agendaService, AgendaItem } from "../../services/agendaService";
import { personService } from "../../services/personService";
import { serviceService, Service } from "../../services/serviceService";
import { salesService, SaleView } from "../../services/salesService";

// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// Types
// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

interface DashboardOverviewProps {
  currentUser: any;
  hasPermission: (permission: string) => boolean;
}

type Period = "today" | "week" | "month";

interface DashboardStats {
  appointments: number;
  clients: number;
  services_completed: number;
  new_clients: number;
  total_income: number;
}

interface ChartPoint {
  name: string;
  value: number;
}

interface TopService {
  name: string;
  count: number;
  revenue: number;
  percentage: number;
}

// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// Helpers
// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function toLocalDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getWeekStart(): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getMonthStart(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isInPeriod(dateStr: string, period: Period): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00"));
  date.setHours(0, 0, 0, 0);
  const todayStr = toLocalDateStr(new Date());
  if (period === "today") return dateStr.startsWith(todayStr);
  if (period === "week") return date >= getWeekStart();
  if (period === "month") return date >= getMonthStart();
  return false;
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const HOUR_LABELS = [
  "8am",
  "9am",
  "10am",
  "11am",
  "12pm",
  "1pm",
  "2pm",
  "3pm",
  "4pm",
  "5pm",
  "6pm",
  "7pm",
];
const HOUR_MAP: Record<string, string> = {
  "08": "8am",
  "09": "9am",
  "10": "10am",
  "11": "11am",
  "12": "12pm",
  "13": "1pm",
  "14": "2pm",
  "15": "3pm",
  "16": "4pm",
  "17": "5pm",
  "18": "6pm",
  "19": "7pm",
};

function groupAgendaByHour(items: AgendaItem[]): ChartPoint[] {
  const map: Record<string, number> = {};
  HOUR_LABELS.forEach((h) => (map[h] = 0));
  items.forEach((i) => {
    const h = (i.horaInicio || "").slice(0, 2);
    const label = HOUR_MAP[h];
    if (label) map[label] = (map[label] || 0) + 1;
  });
  return HOUR_LABELS.map((h) => ({ name: h, value: map[h] }));
}

function groupAgendaByDay(items: AgendaItem[]): ChartPoint[] {
  const map: Record<string, number> = {
    Lun: 0,
    Mar: 0,
    Mié: 0,
    Jue: 0,
    Vie: 0,
    Sáb: 0,
    Dom: 0,
  };
  items.forEach((i) => {
    if (!i.fechaCita) return;
    const d = new Date(i.fechaCita + "T00:00:00");
    const label = DAY_NAMES[d.getDay()];
    if (label) map[label] = (map[label] || 0) + 1;
  });
  return ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => ({
    name: d,
    value: map[d] || 0,
  }));
}

function groupAgendaByWeek(items: AgendaItem[]): ChartPoint[] {
  const map: Record<string, number> = {
    "Sem 1": 0,
    "Sem 2": 0,
    "Sem 3": 0,
    "Sem 4": 0,
    "Sem 5": 0,
  };
  items.forEach((i) => {
    if (!i.fechaCita) return;
    const day = new Date(i.fechaCita + "T00:00:00").getDate();
    const label = `Sem ${Math.ceil(day / 7)}`;
    if (map[label] !== undefined) map[label] += 1;
  });
  return Object.entries(map)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));
}

function groupSalesByHour(items: SaleView[]): ChartPoint[] {
  const map: Record<string, number> = {};
  HOUR_LABELS.forEach((h) => (map[h] = 0));
  items.forEach((i) => {
    const h = (i.time || "").slice(0, 2);
    const label = HOUR_MAP[h];
    if (label) map[label] = (map[label] || 0) + i.total;
  });
  return HOUR_LABELS.map((h) => ({ name: h, value: map[h] }));
}

function groupSalesByDay(items: SaleView[]): ChartPoint[] {
  const map: Record<string, number> = {
    Lun: 0,
    Mar: 0,
    Mié: 0,
    Jue: 0,
    Vie: 0,
    Sáb: 0,
    Dom: 0,
  };
  items.forEach((i) => {
    if (!i.date) return;
    const d = new Date(i.date + "T00:00:00");
    const label = DAY_NAMES[d.getDay()];
    if (label) map[label] = (map[label] || 0) + i.total;
  });
  return ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => ({
    name: d,
    value: map[d] || 0,
  }));
}

function groupSalesByWeek(items: SaleView[]): ChartPoint[] {
  const map: Record<string, number> = {
    "Sem 1": 0,
    "Sem 2": 0,
    "Sem 3": 0,
    "Sem 4": 0,
    "Sem 5": 0,
  };
  items.forEach((i) => {
    if (!i.date) return;
    const day = new Date(i.date + "T00:00:00").getDate();
    const label = `Sem ${Math.ceil(day / 7)}`;
    if (map[label] !== undefined) map[label] += i.total;
  });
  return Object.entries(map)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));
}

// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// Stat Card
// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

function StatCard({ title, value, icon, color, loading }: StatCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
          ) : (
            <p className="text-3xl font-bold text-gray-800">{value}</p>
          )}
        </div>
        <div className="w-14 h-14 bg-gradient-to-r from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center text-white">
          {icon}
        </div>
      </div>
    </div>
  );
}

// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// Main Component
// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

export function DashboardOverview({
  currentUser,
  hasPermission,
}: DashboardOverviewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("today");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Raw API data
  const [allAgenda, setAllAgenda] = useState<AgendaItem[]>([]);
  const [allSales, setAllSales] = useState<SaleView[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [servicesMap, setServicesMap] = useState<Map<string, Service>>(
    new Map(),
  );

  // ── Fetch all data ──
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [agenda, clients, services, sales] = await Promise.allSettled([
        agendaService.getAll(),
        personService.getPersons("client"),
        serviceService.getServices(),
        salesService.getAll(),
      ]);

      if (agenda.status === "fulfilled") setAllAgenda(agenda.value);
      if (sales.status === "fulfilled") setAllSales(sales.value);
      if (clients.status === "fulfilled")
        setTotalClients(
          clients.value.filter((c) => c.status === "active").length,
        );
      if (services.status === "fulfilled") {
        const map = new Map<string, Service>();
        services.value.forEach((s) => map.set(s.nombre, s));
        setServicesMap(map);
      }

      setLastUpdated(new Date());
    } catch (err: any) {
      setError("No se pudo cargar los datos del dashboard.");
      console.error("Dashboard load error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Filter by period ──
  const periodAgenda = allAgenda.filter((a) =>
    isInPeriod(a.fechaCita, selectedPeriod),
  );
  const periodSales = allSales.filter(
    (s) => isInPeriod(s.date, selectedPeriod) && s.status === "completed",
  );

  // ── Compute Stats ──
  const appointmentsCount = periodAgenda.length;
  const totalIncome = periodSales.reduce((sum, s) => sum + s.total, 0);

  const uniqueClientIds = new Set(
    periodAgenda.map((a) => a.documentoCliente).filter(Boolean),
  );
  const clientsCount = uniqueClientIds.size;

  const allPriorAgenda = allAgenda.filter(
    (a) => !isInPeriod(a.fechaCita, selectedPeriod),
  );
  const priorClientIds = new Set(
    allPriorAgenda.map((a) => a.documentoCliente).filter(Boolean),
  );
  const newClientsCount = [...uniqueClientIds].filter(
    (id) => !priorClientIds.has(id),
  ).length;

  const servicesCompleted = periodAgenda.filter(
    (a) => a.estado.toLowerCase() === "completado",
  ).length;

  const currentStats: DashboardStats = {
    appointments: appointmentsCount,
    clients: clientsCount,
    services_completed: servicesCompleted,
    new_clients: newClientsCount,
    total_income: totalIncome,
  };

  // ── Charts ──
  const appointmentsChartData: ChartPoint[] =
    selectedPeriod === "today"
      ? groupAgendaByHour(periodAgenda)
      : selectedPeriod === "week"
        ? groupAgendaByDay(periodAgenda)
        : groupAgendaByWeek(periodAgenda);

  const clientsChartData = [
    { name: "Nuevos", value: currentStats.new_clients, color: "#ec4899" },
    {
      name: "Recurrentes",
      value: Math.max(0, currentStats.clients - currentStats.new_clients),
      color: "#a855f7",
    },
  ].filter((d) => d.value > 0);

  const incomeChartData: ChartPoint[] =
    selectedPeriod === "today"
      ? groupSalesByHour(periodSales)
      : selectedPeriod === "week"
        ? groupSalesByDay(periodSales)
        : groupSalesByWeek(periodSales);

  const todayAgenda = allAgenda.filter((a) => isInPeriod(a.fechaCita, "today"));
  const upcomingAppointments = todayAgenda
    .filter((a) => ["pendiente", "confirmado"].includes(a.estado.toLowerCase()))
    .sort((a, b) => (a.horaInicio || "").localeCompare(b.horaInicio || ""))
    .slice(0, 5);

  const servicioFreq: Record<string, { count: number }> = {};
  periodAgenda.forEach((apt) => {
    apt.servicios.forEach((sName) => {
      if (!servicioFreq[sName]) servicioFreq[sName] = { count: 0 };
      servicioFreq[sName].count += 1;
    });
  });

  const totalServiceCount =
    Object.values(servicioFreq).reduce((sum, v) => sum + v.count, 0) || 1;
  const topServices: TopService[] = Object.entries(servicioFreq)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, data]) => ({
      name,
      count: data.count,
      revenue: 0,
      percentage: Math.round((data.count / totalServiceCount) * 100),
    }));

  const starService = topServices.reduce<TopService | null>((best, s) => {
    if (!best || s.count > best.count) return s;
    return best;
  }, null);

  const periodLabel =
    selectedPeriod === "today"
      ? "Hoy"
      : selectedPeriod === "week"
        ? "Esta Semana"
        : "Este Mes";

  return (
    <div className="p-8 pb-32 flex flex-col gap-y-16 space-y-16 min-h-screen">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            Dashboard en Tiempo Real
          </h2>
          <p className="text-gray-600">
            Monitoreo operativo de AstrhoApp
            {lastUpdated && (
              <span className="text-xs text-gray-400 ml-2">
                — Actualizado a las {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>En Vivo</span>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            title="Recargar datos"
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-5 h-5 text-gray-600 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as Period)}
            className="bg-white border border-gray-300 rounded-xl px-4 py-2 font-medium text-gray-700 focus:ring-2 focus:ring-pink-300"
          >
            <option value="today">Hoy</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-200">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">
            {error} Los datos mostrados pueden ser incompletos.
          </span>
        </div>
      )}

      {/* Row 0: KPI Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={`Ingresos ${periodLabel}`}
          value={`$${currentStats.total_income.toLocaleString()}`}
          icon={<DollarSign className="w-7 h-7" />}
          color="border-green-500"
          loading={isLoading}
        />
        <StatCard
          title={`Citas ${periodLabel}`}
          value={currentStats.appointments}
          icon={<Calendar className="w-7 h-7" />}
          color="border-purple-500"
          loading={isLoading}
        />
        <StatCard
          title="Clientes Activos"
          value={totalClients}
          icon={<Users className="w-7 h-7" />}
          color="border-blue-500"
          loading={isLoading}
        />
        <StatCard
          title="Servicios Completados"
          value={currentStats.services_completed}
          icon={<Star className="w-7 h-7" />}
          color="border-pink-500"
          loading={isLoading}
        />
      </div>

      {/* Row 1: Income Chart (Full Width) */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">
            Ingresos {periodLabel}
          </h3>
          {isLoading ? (
            <div className="h-[300px] bg-gray-100 animate-pulse rounded-xl" />
          ) : incomeChartData.every((d) => d.value === 0) ? (
            <EmptyChart label="Sin ingresos registrados en este período" />
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={incomeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [
                    `$${value.toLocaleString()}`,
                    "Ingresos",
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Ingresos"
                  stroke="#10b981"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
      </div>

      {/* Row 2: Appointments + Clients */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Appointments Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              Citas {periodLabel}
            </h3>
            {isLoading ? (
              <div className="h-[300px] bg-gray-100 animate-pulse rounded-xl" />
            ) : appointmentsChartData.every((d) => d.value === 0) ? (
              <EmptyChart label="Sin citas registradas en este período" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={appointmentsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip formatter={(value: number) => [value, "Citas"]} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Citas"
                    stroke="#a855f7"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Clients Pie Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              Clientes {periodLabel}
            </h3>
            {isLoading ? (
              <div className="h-[300px] bg-gray-100 animate-pulse rounded-xl" />
            ) : clientsChartData.length === 0 ? (
              <EmptyChart label="Sin clientes en este período" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={clientsChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    dataKey="value"
                  >
                    {clientsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, "Clientes"]} />
                </PieChart>
              </ResponsiveContainer>
            )}
      </div>
    </div>

    {/* Row 3: Upcoming Appointments + Top Services */}
    <div className="grid lg:grid-cols-2 gap-8">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Próximas Citas (Hoy)
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                {lastUpdated ? (
                  <span>Actualizado {lastUpdated.toLocaleTimeString()}</span>
                ) : (
                  <span>Cargando...</span>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-gray-100 animate-pulse rounded-xl"
                  />
                ))}
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No hay citas pendientes/confirmadas para hoy</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((apt) => {
                  const statusKey = apt.estado.toLowerCase();
                  const isConfirmed = statusKey === "confirmado";
                  const isPending = statusKey === "pendiente";
                  return (
                    <div
                      key={apt.agendaId}
                      className="flex items-center space-x-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl"
                    >
                      <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserCheck className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 truncate">
                          {apt.cliente || apt.documentoCliente}
                        </h4>
                        <p className="text-gray-600 text-sm truncate">
                          {apt.servicios.join(", ") || "Sin servicio"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {apt.horaInicio} • {apt.empleado || apt.documentoEmpleado}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            isConfirmed
                              ? "bg-green-100 text-green-800"
                              : isPending
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {apt.estado}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Services */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              Servicios Más Populares
            </h3>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-100 animate-pulse rounded-xl"
                  />
                ))}
              </div>
            ) : topServices.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Sin datos de servicios para este período</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {topServices.map((service, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {service.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {service.count}{" "}
                            {service.count === 1 ? "vez" : "veces"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-pink-600">
                            {service.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-pink-400 to-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${service.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {starService && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="font-semibold text-gray-800">
                        Servicio Estrella
                      </span>
                    </div>
                    <p className="text-gray-700">
                      <strong>{starService.name}</strong> es el más solicitado en
                      este período
                    </p>
                  </div>
                )}
              </>
            )}
        </div>
      </div>
    </div>
  );
}

// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// Empty state chart placeholder
// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-[300px] flex flex-col items-center justify-center text-gray-400">
      <TrendingUp className="w-12 h-12 opacity-20 mb-3" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
