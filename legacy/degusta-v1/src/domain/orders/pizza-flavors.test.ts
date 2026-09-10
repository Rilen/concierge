import { describe, it, expect } from "vitest";
import {
  validateProductOptionSelections,
  DomainProduct,
} from "./validation";
import { calculateItemSubtotal } from "./calculations";
import { configurePizzaFlavorsSchema } from "../validators";

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

  describe("Caso 5: Seleção abaixo de minSelect", () => {
    const pizza = createPizzaProduct(3);

    it("0 seleções em grupo obrigatório → FAIL", () => {
      const result = validateProductOptionSelections(pizza, [], restaurantId);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("exige no mínimo 1 opção(ões) selecionada(s)");
    });
  });

  describe("Caso 6: Cálculo de Preço (base + soma dos adicionais)", () => {
    it("mantém fórmula exata com centavos: base + opções adicionais", () => {
      const unitPrice = 50.0; // Pizza base
      const optionsSum = 0.0 + 0.0 + 2.5 + 3.5; // 4 sabores (dois grátis + R$ 6.00 em adicionais)

      const subtotal1 = calculateItemSubtotal(unitPrice, 1, optionsSum);
      expect(subtotal1).toBe(56.0);

      const subtotal2 = calculateItemSubtotal(unitPrice, 2, optionsSum);
      expect(subtotal2).toBe(112.0);
    });
  });

  describe("Validação de Schema Zod (configurePizzaFlavorsSchema)", () => {
    const validUuid = "123e4567-e89b-12d3-a456-426614174000";

    it("aceita valores de 1 a 4", () => {
      for (const val of [1, 2, 3, 4]) {
        const parsed = configurePizzaFlavorsSchema.safeParse({
          productId: validUuid,
          maxFlavors: val,
        });
        expect(parsed.success).toBe(true);
      }
    });

    it("rejeita valores menores que 1 ou maiores que 4", () => {
      expect(configurePizzaFlavorsSchema.safeParse({ productId: validUuid, maxFlavors: 0 }).success).toBe(false);
      expect(configurePizzaFlavorsSchema.safeParse({ productId: validUuid, maxFlavors: 5 }).success).toBe(false);
      expect(configurePizzaFlavorsSchema.safeParse({ productId: validUuid, maxFlavors: -1 }).success).toBe(false);
    });

    it("rejeita valores não inteiros", () => {
      expect(configurePizzaFlavorsSchema.safeParse({ productId: validUuid, maxFlavors: 2.5 }).success).toBe(false);
    });
  });
});
