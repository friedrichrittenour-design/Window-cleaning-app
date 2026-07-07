function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateAmountDue(finalPrice: number, creditApplied: number): number {
  return Math.max(0, roundToCents(finalPrice - creditApplied));
}
