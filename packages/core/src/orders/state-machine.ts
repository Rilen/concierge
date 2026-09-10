import { OrderStatus, OrderType, canTransitionStatus } from "./calculations.js";

export interface StateTransitionResult {
  allowed: boolean;
  from: OrderStatus;
  to: OrderStatus;
  reason?: string;
}

export class OrderStateMachine {
  static evaluateTransition(
    current: OrderStatus,
    next: OrderStatus,
    type: OrderType
  ): StateTransitionResult {
    const isAllowed = canTransitionStatus(current, next, type);
    if (!isAllowed) {
      return {
        allowed: false,
        from: current,
        to: next,
        reason: `Transição inválida de '${current}' para '${next}' no fluxo de '${type}'.`,
      };
    }
    return {
      allowed: true,
      from: current,
      to: next,
    };
  }
}
