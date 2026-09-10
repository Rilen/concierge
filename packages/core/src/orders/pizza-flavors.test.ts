import { describe, it, expect } from "vitest";
import {
  validateProductOptionSelections,
  DomainProduct,
} from "./validation.js";
import { calculateItemSubtotal } from "./calculations.js";
import { configurePizzaFlavorsSchema } from "./validators.js";

describe("Pizza 1 a 4 Sabores — Validação e Regras de Negócio", () => {
  const restaurantId = "rest_pizzaria_001";

  const createPizzaProduct = (maxFlavors: number): DomainProduct => ({
    id: `prod_pizza_max_${maxFlavors}`,
    restaurantId,
    name: `Pizza Configurável (Até ${maxFlavors} sabores)`,
    active: true,
    optionGroups: [
      {
        id: "grp_sabores",
        name: "Sabores",
        minSelect: 1,
        maxSelect: maxFlavors,
        required: true,
        options: [
          { id: "opt_calabresa", name: "Calabresa", price: "0.00", active: true, restaurantId },
          { id: "opt_frango", name: "Frango com Catupiry", price: "0.00", active: true, restaurantId },
          { id: "opt_quatro_queijos", name: "Quatro Queijos", price: "2.50", active: true, restaurantId },
          { id: "opt_portuguesa", name: "Portuguesa", price: "3.50", active: true, restaurantId },
          { id: "opt_marguerita", name: "Marguerita", price: "0.00", active: true, restaurantId },
        ],
      },
    ],
  });

  describe("Caso 1: maxSelect = 1", () => {
    const pizza = createPizzaProduct(1);

    it("1 seleção → PASS", () => {
      const result = validateProductOptionSelections(pizza, ["opt_calabresa"], restaurantId);
      expect(result.isValid).toBe(true);
      expect(result.verifiedOptions).toHaveLength(1);
      expect(result.verifiedOptions[0].optionName).toBe("Calabresa");
    });

    it("2 seleções → FAIL", () => {
      const result = validateProductOptionSelections(
        pizza,
        ["opt_calabresa", "opt_frango"],
        restaurantId
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("permite no máximo 1 opção(ões)");
    });
  });

  describe("Caso 2: maxSelect = 2", () => {
    const pizza = createPizzaProduct(2);

    it("2 seleções → PASS", () => {
      const result = validateProductOptionSelections(
        pizza,
        ["opt_calabresa", "opt_frango"],
        restaurantId
      );
      expect(result.isValid).toBe(true);
      expect(result.verifiedOptions).toHaveLength(2);
    });

    it("3 seleções → FAIL", () => {
      const result = validateProductOptionSelections(
        pizza,
        ["opt_calabresa", "opt_frango", "opt_quatro_queijos"],
        restaurantId
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("permite no máximo 2 opção(ões)");
    });
  });

  describe("Caso 3: maxSelect = 3", () => {
    const pizza = createPizzaProduct(3);

    it("3 seleções → PASS", () => {
      const result = validateProductOptionSelections(
        pizza,
        ["opt_calabresa", "opt_frango", "opt_quatro_queijos"],
        restaurantId
      );
      expect(result.isValid).toBe(true);
      expect(result.verifiedOptions).toHaveLength(3);
    });

    it("4 seleções → FAIL", () => {
      const result = validateProductOptionSelections(
        pizza,
        ["opt_calabresa", "opt_frango", "opt_quatro_queijos", "opt_portuguesa"],
        restaurantId
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("permite no máximo 3 opção(ões)");
    });
  });

  describe("Caso 4: maxSelect = 4", () => {
    const pizza = createPizzaProduct(4);

    it("4 seleções → PASS", () => {
      const result = validateProductOptionSelections(
        pizza,
        ["opt_calabresa", "opt_frango", "opt_quatro_queijos", "opt_portuguesa"],
        restaurantId
      );
      expect(result.isValid).toBe(true);
      expect(result.verifiedOptions).toHaveLength(4);
    });

    it("5 seleções → FAIL", () => {
      const result = validateProductOptionSelections(
        pizza,
        ["opt_calabresa", "opt_frango", "opt_quatro_queijos", "opt_portuguesa", "opt_marguerita"],
        restaurantId
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("permite no máximo 4 opção(ões)");
    });
  });

  describe("Validação do Schema Zod configurePizzaFlavorsSchema", () => {
    it("deve aceitar maxFlavors entre 1 e 4", () => {
      expect(configurePizzaFlavorsSchema.safeParse({ productId: "prod-1", maxFlavors: 1 }).success).toBe(true);
      expect(configurePizzaFlavorsSchema.safeParse({ productId: "prod-1", maxFlavors: 2 }).success).toBe(true);
      expect(configurePizzaFlavorsSchema.safeParse({ productId: "prod-1", maxFlavors: 3 }).success).toBe(true);
      expect(configurePizzaFlavorsSchema.safeParse({ productId: "prod-1", maxFlavors: 4 }).success).toBe(true);
    });

    it("deve rejeitar maxFlavors fora do range 1 a 4", () => {
      expect(configurePizzaFlavorsSchema.safeParse({ productId: "prod-1", maxFlavors: 0 }).success).toBe(false);
      expect(configurePizzaFlavorsSchema.safeParse({ productId: "prod-1", maxFlavors: 5 }).success).toBe(false);
      expect(configurePizzaFlavorsSchema.safeParse({ productId: "prod-1", maxFlavors: -1 }).success).toBe(false);
    });
  });

  describe("Cálculo de Preço com Múltiplos Sabores", () => {
    it("deve calcular subtotal somando adicionais de sabores", () => {
      // Base: R$ 40,00 | Sabor 1: R$ 0,00 | Sabor 2 (Quatro queijos): R$ 2,50
      const optionsTotal = 2.5;
      const subtotal = calculateItemSubtotal(40.0, 1, optionsTotal);
      expect(subtotal).toBe(42.5);
    });

    it("deve multiplicar pelo quantitativo de pizzas corretamente", () => {
      const optionsTotal = 6.0; // 2.50 + 3.50
      const subtotal = calculateItemSubtotal(40.0, 2, optionsTotal);
      expect(subtotal).toBe(92.0); // (40 + 6) * 2 = 92.00
    });
  });
});
