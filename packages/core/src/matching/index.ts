/**
 * MATCHING & RECOMMENDATION DOMAIN
 */

export interface VendorProfile {
  id: string;
  name: string;
  slug: string;
  categories: string[];
  priceTier: 1 | 2 | 3 | 4; // $ to $$$$
  rating: number; // 0 to 5
  estimatedTimeMin: number;
  estimatedTimeMax: number;
  isOpen: boolean;
  deliveryAvailable: boolean;
  dineInAvailable: boolean;
  distanceKm?: number;
}

export interface MatchingQuery {
  cuisine?: string;
  maxDeliveryTime?: number;
  maxPriceTier?: number;
  deliveryOnly?: boolean;
  openOnly?: boolean;
  searchTerm?: string;
}

export interface ScoredVendor {
  vendor: VendorProfile;
  score: number;
  matchReasons: string[];
}

/**
 * Ranks vendors based on proximity, status, rating, and user constraints.
 */
export function rankVendors(vendors: VendorProfile[], query: MatchingQuery): ScoredVendor[] {
  return vendors
    .filter((v) => {
      if (query.openOnly && !v.isOpen) return false;
      if (query.deliveryOnly && !v.deliveryAvailable) return false;
      if (query.maxPriceTier && v.priceTier > query.maxPriceTier) return false;
      if (query.maxDeliveryTime && v.estimatedTimeMax > query.maxDeliveryTime) return false;
      return true;
    })
    .map((vendor) => {
      let score = vendor.rating * 20; // 0 - 100 base score
      const matchReasons: string[] = [];

      if (vendor.isOpen) {
        score += 30;
        matchReasons.push("Aberto agora");
      }

      if (query.cuisine && vendor.categories.some((c) => c.toLowerCase().includes(query.cuisine!.toLowerCase()))) {
        score += 40;
        matchReasons.push(`Especialidade em ${query.cuisine}`);
      }

      if (query.searchTerm && vendor.name.toLowerCase().includes(query.searchTerm.toLowerCase())) {
        score += 50;
        matchReasons.push("Correspondência direta no nome");
      }

      if (vendor.distanceKm !== undefined) {
        // Less distance -> higher score
        const proximityBonus = Math.max(0, 30 - vendor.distanceKm * 5);
        score += proximityBonus;
        if (vendor.distanceKm < 3) {
          matchReasons.push(`Muito próximo (${vendor.distanceKm.toFixed(1)} km)`);
        }
      }

      return {
        vendor,
        score,
        matchReasons,
      };
    })
    .sort((a, b) => b.score - a.score);
}
