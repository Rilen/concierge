export interface DomainProductOption {
  id: string;
  name: string;
  price: string | number;
  active: boolean;
  restaurantId: string;
}

export interface DomainProductOptionGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  required: boolean;
  options: DomainProductOption[];
}

export interface DomainProduct {
  id: string;
  restaurantId: string;
  name: string;
  active: boolean;
  optionGroups: DomainProductOptionGroup[];
}

export interface VerifiedOptionResult {
  productOptionId: string;
  groupName: string;
  optionName: string;
  price: number;
}

/**
 * Server-side authority validation for product options (C1).
 * Validates required groups, maxSelect, minSelect, active status and tenant ownership.
 */
export function validateProductOptionSelections(
  product: DomainProduct,
  selectedOptionIds: string[],
  expectedRestaurantId: string
): {
  isValid: boolean;
  error?: string;
  verifiedOptions: VerifiedOptionResult[];
} {
  if (!product.active) {
    return {
      isValid: false,
      error: `Produto '${product.name}' está inativo ou indisponível.`,
      verifiedOptions: [],
    };
  }

  if (product.restaurantId !== expectedRestaurantId) {
    return {
      isValid: false,
      error: `Produto '${product.name}' não pertence ao restaurante solicitado.`,
      verifiedOptions: [],
    };
  }

  // Map all valid active options by ID with their group
  const validOptionMap = new Map<
    string,
    { option: DomainProductOption; group: DomainProductOptionGroup }
  >();

  for (const group of product.optionGroups) {
    for (const opt of group.options) {
      if (opt.active && opt.restaurantId === expectedRestaurantId) {
        validOptionMap.set(opt.id, { option: opt, group });
      }
    }
  }

  // 1. Verify every selected option belongs to this product and restaurant
  for (const optId of selectedOptionIds) {
    if (!validOptionMap.has(optId)) {
      return {
        isValid: false,
        error: `Opção '${optId}' não pertence ao produto '${product.name}', está inativa ou pertence a outro estabelecimento.`,
        verifiedOptions: [],
      };
    }
  }

  // 2. Count selections per group
  const selectionsByGroup = new Map<string, VerifiedOptionResult[]>();
  for (const group of product.optionGroups) {
    selectionsByGroup.set(group.id, []);
  }

  for (const optId of selectedOptionIds) {
    const entry = validOptionMap.get(optId)!;
    const list = selectionsByGroup.get(entry.group.id)!;
    list.push({
      productOptionId: entry.option.id,
      groupName: entry.group.name,
      optionName: entry.option.name,
      price: Number(entry.option.price),
    });
  }

  // 3. Enforce minSelect, maxSelect and required rules per group
  for (const group of product.optionGroups) {
    const selected = selectionsByGroup.get(group.id) || [];
    const minRequired = group.required ? Math.max(1, group.minSelect) : group.minSelect;

    if (minRequired > 0 && selected.length < minRequired) {
      return {
        isValid: false,
        error: `O grupo obrigatório '${group.name}' do produto '${product.name}' exige no mínimo ${minRequired} opção(ões) selecionada(s).`,
        verifiedOptions: [],
      };
    }

    if (group.maxSelect > 0 && selected.length > group.maxSelect) {
      return {
        isValid: false,
        error: `O grupo '${group.name}' do produto '${product.name}' permite no máximo ${group.maxSelect} opção(ões). Foram enviadas ${selected.length}.`,
        verifiedOptions: [],
      };
    }
  }

  const allVerified = Array.from(selectionsByGroup.values()).flat();

  return {
    isValid: true,
    verifiedOptions: allVerified,
  };
}
