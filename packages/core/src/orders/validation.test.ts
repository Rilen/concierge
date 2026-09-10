import { describe, it, expect } from "vitest";
import {
  validateProductOptionSelections,
  DomainProduct,
} from "./validation.js";

describe("Server-Side Product Options Validation", () => {
  const restaurantA = "rest_tenant_aaa";
  const restaurantB = "rest_tenant_bbb";

  const sampleProduct: DomainProduct = {
    id: "prod_pizza_2_sabores",
    restaurantId: restaurantA,
    name: "Pizza 2 Sabores",
    active: true,
    optionGroups: [
      {
        id: "grp_sabor_1",
        name: "1º Sabor (Metade)",
        minSelect: 1,
        maxSelect: 1,
        required: true,
        options: [
          { id: "opt_calabresa_1", name: "Calabresa", price: "0.00", active: true, restaurantId: restaurantA },
          { id: "opt_frango_1", name: "Frango com Catupiry", price: "0.00", active: true, restaurantId: restaurantA },
        ],
      },
      {
        id: "grp_adicionais",
        name: "Adicionais",
        minSelect: 0,
        maxSelect: 2,
        required: false,
        options: [
          { id: "opt_bacon", name: "Bacon Extra", price: "4.50", active: true, restaurantId: restaurantA },
          { id: "opt_queijo", name: "Queijo Extra", price: "3.50", active: true, restaurantId: restaurantA },
          { id: "opt_cebola", name: "Cebola", price: "2.00", active: true, restaurantId: restaurantA },
        ],
      },
    ],
  };

  it("1. grupo obrigatório sem seleção → REJEITAR", () => {
    const result = validateProductOptionSelections(sampleProduct, [], restaurantA);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("exige no mínimo 1 opção(ões) selecionada(s)");
  });

  it("2. grupo obrigatório com seleção válida → ACEITAR", () => {
    const result = validateProductOptionSelections(sampleProduct, ["opt_calabresa_1"], restaurantA);
    expect(result.isValid).toBe(true);
    expect(result.verifiedOptions).toHaveLength(1);
    expect(result.verifiedOptions[0].optionName).toBe("Calabresa");
  });

  it("3. quantidade acima de maxSelect → REJEITAR", () => {
    const result = validateProductOptionSelections(
      sampleProduct,
      ["opt_calabresa_1", "opt_bacon", "opt_queijo", "opt_cebola"],
      restaurantA
    );
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("permite no máximo 2 opção(ões)");
  });

  it("4. quantidade dentro do limite → ACEITAR", () => {
    const result = validateProductOptionSelections(
      sampleProduct,
      ["opt_calabresa_1", "opt_bacon", "opt_queijo"],
      restaurantA
    );
    expect(result.isValid).toBe(true);
    expect(result.verifiedOptions).toHaveLength(3);
  });

  it("5. opção pertencente a outro grupo / outro produto → REJEITAR", () => {
    const result = validateProductOptionSelections(
      sampleProduct,
      ["opt_calabresa_1", "opt_arbitrary_or_other_product"],
      restaurantA
    );
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("não pertence ao produto");
  });

  it("6. opção pertencente a outro restaurante → REJEITAR", () => {
    const productWithForeignOption: DomainProduct = {
      ...sampleProduct,
      optionGroups: [
        {
          id: "grp_foreign",
          name: "Opção Invasora",
          minSelect: 1,
          maxSelect: 1,
          required: true,
          options: [
            { id: "opt_foreign_restaurant", name: "Item Restaurante B", price: "10.00", active: true, restaurantId: restaurantB },
          ],
        },
      ],
    };

    const result = validateProductOptionSelections(
      productWithForeignOption,
      ["opt_foreign_restaurant"],
      restaurantA
    );
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("não pertence ao produto 'Pizza 2 Sabores', está inativa ou pertence a outro estabelecimento.");
  });

  it("deve rejeitar produto inativo", () => {
    const inactiveProduct: DomainProduct = {
      ...sampleProduct,
      active: false,
    };
    const result = validateProductOptionSelections(inactiveProduct, ["opt_calabresa_1"], restaurantA);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("está inativo ou indisponível");
  });
});
