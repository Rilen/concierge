import * as React from "react";
import { Badge } from "./badge";

export type OrderStatusType =
  | "RECEIVED"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "PICKED_UP"
  | "CANCELLED";

const STATUS_LABELS: Record<OrderStatusType, { label: string; variant: "default" | "success" | "warning" | "danger" | "neutral" }> = {
  RECEIVED: { label: "Recebido", variant: "warning" },
  CONFIRMED: { label: "Confirmado", variant: "neutral" },
  PREPARING: { label: "Em Preparo", variant: "warning" },
  READY: { label: "Pronto", variant: "default" },
  OUT_FOR_DELIVERY: { label: "Saiu para Entrega", variant: "default" },
  DELIVERED: { label: "Entregue", variant: "success" },
  PICKED_UP: { label: "Retirado", variant: "success" },
  CANCELLED: { label: "Cancelado", variant: "danger" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_LABELS[status as OrderStatusType] ?? {
    label: status,
    variant: "neutral",
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
