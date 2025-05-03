export const mapValue = (
  sourceRange: [number, number],
  targetRange: [number, number],
  sourceValue: number,
  step: number,
) => {
  const [sourceMin, sourceMax] = sourceRange;
  const [targetMin, targetMax] = targetRange;
  const clampedSourceValue = Math.max(sourceMin, Math.min(sourceMax, sourceValue));
  const ratio = (clampedSourceValue - sourceMin) / (sourceMax - sourceMin);
  const exactTargetValue = targetMin + ratio * (targetMax - targetMin);
  const stepCount = Math.round(exactTargetValue / step);
  const steppedValue = stepCount * step;
  return Math.max(targetMin, Math.min(targetMax, steppedValue));
};

export const objectEntries = <T extends Record<string, unknown>>(obj: T) => {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
};
