/**
 * @deprecated Tournament prices now come directly from EMS event records.
 * Kept as a compatibility module for legacy imports.
 */
export const toDemoPrize = (amount: number): number => amount
export const entryFeeForPrize = (_prize: number): number => 0
