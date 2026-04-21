import { AppointmentStatus } from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatCurrency(value: string | number) {
  const amount = typeof value === "string" ? Number(value) : value;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(amount);
}

export function formatDateTime(date: Date) {
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatDateInput(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function formatTime(date: Date) {
  return format(date, "HH:mm");
}

export function getAppointmentStatusLabel(status: AppointmentStatus) {
  const labels: Record<AppointmentStatus, string> = {
    PENDING: "Pendente",
    CONFIRMED: "Confirmado",
    CANCELED: "Cancelado",
    DONE: "Concluído"
  };

  return labels[status];
}

export function getWeekdayLabel(weekday: number) {
  const labels = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  return labels[weekday] ?? "Dia inválido";
}
