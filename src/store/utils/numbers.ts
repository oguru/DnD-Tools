export const clamp = (value: number, min: number, max: number): number => {
  if (min > max) {
    throw new Error(`clamp: min (${min}) must be <= max (${max})`);
  }
  return Math.max(min, Math.min(max, value));
};

export const clampHp = (value: number, min: number, max: number): number => {
  return clamp(value, min, max);
};

export const clampCharges = (
  value: number | undefined,
  maxCharges: number
): number => {
  if (value === undefined || typeof value !== 'number') {
    return maxCharges;
  }
  return clamp(value, 0, maxCharges);
};

export const ensurePositive = (value: number): number => {
  return Math.max(0, value);
};

