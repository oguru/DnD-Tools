export const generateId = (): string => {
  return Date.now().toString();
};

export const generateIdWithOffset = (offset: number): string => {
  return (Date.now() + offset).toString();
};

export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

