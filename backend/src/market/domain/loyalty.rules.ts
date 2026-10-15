const DAY_DURATION_MS = 24 * 60 * 60 * 1000;

export function calculateLoyalty(end: Date, moment: Date) {
  const remainingDays = Math.max(
    0,
    Math.ceil((end.getTime() - moment.getTime()) / DAY_DURATION_MS),
  );
  const penaltyRate =
    remainingDays === 0 ? 0 : remainingDays <= 30 ? 5 : remainingDays <= 180 ? 10 : 20;
  return { remainingDays, penaltyRate };
}
