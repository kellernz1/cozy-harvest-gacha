import { describe, expect, it } from "vitest";
import { PACKS, RARITIES, SEED_TYPES, type Seed } from "../game/constants";
import { getMarketBonus, getSeedValue } from "../game/state";

describe("game economy", () => {
  it("keeps every pack rate on a known rarity", () => {
    for (const pack of PACKS) {
      for (const rarity of Object.keys(pack.rates)) {
        expect(RARITIES).toContain(rarity);
      }
    }
  });

  it("has a deterministic daily market fruit", () => {
    const date = new Date("2026-06-04T12:00:00.000Z");
    const market = getMarketBonus(date);

    expect(SEED_TYPES).toContain(market.seedType);
    expect(market.multiplier).toBeGreaterThan(1);
    expect(getMarketBonus(date)).toEqual(market);
  });

  it("boosts sell value for the daily market fruit", () => {
    const date = new Date("2026-06-04T12:00:00.000Z");
    const market = getMarketBonus(date);
    const seed: Seed = { id: "seed_test", type: market.seedType, rarity: "Rare" };

    expect(getSeedValue(seed, date)).toBe(6);
  });
});
