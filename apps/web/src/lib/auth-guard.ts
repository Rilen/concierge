import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export class AuthorizationError extends Error {
  constructor(message = "Acesso não autorizado.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class AuthenticationRequiredError extends Error {
  constructor(message = "Autenticação obrigatória para acessar este recurso.") {
    super(message);
    this.name = "AuthenticationRequiredError";
  }
}

/**
 * Retrieves the current session user on the server.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return null;
    }

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: (session.user as unknown as { role?: string }).role || "CLIENTE",
    };
  } catch (error: unknown) {
    const err = error as { digest?: string };
    if (err?.digest === "DYNAMIC_SERVER_USAGE" || err?.digest?.startsWith("NEXT_")) {
      throw error;
    }
    console.error("Erro ao obter sessão:", error);
    return null;
  }
}

/**
 * Requires an authenticated user or throws AuthenticationRequiredError.
 */
export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthenticationRequiredError();
  }
  return user;
}

/**
 * Requires MASTER platform role.
 */
export async function requireMaster(): Promise<AuthenticatedUser> {
  const user = await requireUser();
  if (user.role !== "MASTER") {
    throw new AuthorizationError("Acesso restrito ao Administrador da Plataforma (MASTER).");
  }
  return user;
}

/**
 * Enforces strict multi-tenancy access:
 * Verifies if the authenticated user is either a MASTER or has the required role
 * ('GERENTE' or 'PEDIDOS') explicitly linked to the given restaurantId.
 */
export async function requireRestaurantRole(
  restaurantId: string,
  allowedRoles: Array<"GERENTE" | "PEDIDOS"> = ["GERENTE", "PEDIDOS"]
): Promise<{ user: AuthenticatedUser; restaurantRole: "MASTER" | "GERENTE" | "PEDIDOS" }> {
  const user = await requireUser();

  // MASTER platform admin has authorized access across establishments
  if (user.role === "MASTER") {
    return { user, restaurantRole: "MASTER" };
  }

  // Multi-tenant check: User must be directly associated with this restaurant
  const association = await db.query.restaurantUsers.findFirst({
    where: and(
      eq(schema.restaurantUsers.userId, user.id),
      eq(schema.restaurantUsers.restaurantId, restaurantId)
    ),
  });

  if (!association) {
    throw new AuthorizationError("Você não possui permissão de acesso a este restaurante.");
  }

  if (!allowedRoles.includes(association.role as "GERENTE" | "PEDIDOS")) {
    throw new AuthorizationError(
      `Permissão insuficiente. Requer papel: ${allowedRoles.join(" ou ")}`
    );
  }

  return {
    user,
    restaurantRole: association.role as "GERENTE" | "PEDIDOS",
  };
}

/**
 * Registers an audit log entry (Articles 12, 25 & 33).
 */
export async function logAudit(params: {
  restaurantId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    let ip: string | null = null;
    let userAgent: string | null = null;

    try {
      const reqHeaders = await headers();
      ip = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip");
      userAgent = reqHeaders.get("user-agent");
    } catch {
      // Safely executed outside of a direct Next.js request context (CLI, background jobs, workers)
    }

    await db.insert(schema.auditLogs).values({
      restaurantId: params.restaurantId || null,
      userId: params.userId || null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId || null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      ipAddress: ip,
      userAgent,
    });
  } catch (error) {
    console.error("Falha ao registrar log de auditoria:", error);
  }
}
