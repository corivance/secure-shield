// IRDAI city-tier classification for city_tier_classifier. Tier drives room-rent
// caps and (in some policies) co-pay.
const TIER_1 = ['mumbai', 'delhi', 'new delhi', 'bengaluru', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'ahmedabad'];
const TIER_2 = ['jaipur', 'lucknow', 'kanpur', 'nagpur', 'indore', 'bhopal', 'coimbatore', 'kochi', 'visakhapatnam', 'surat', 'vadodara', 'chandigarh'];

export const classifyCity = (city) => {
  if (!city) return { tier: 3, label: 'Tier 3' };
  const c = String(city).trim().toLowerCase();
  if (TIER_1.includes(c)) return { tier: 1, label: 'Tier 1' };
  if (TIER_2.includes(c)) return { tier: 2, label: 'Tier 2' };
  return { tier: 3, label: 'Tier 3' };
}

// Rough regional benchmark multipliers for hospital_cost_estimator.
export const tierCostMultiplier = { 1: 1.0, 2: 0.8, 3: 0.65 };
