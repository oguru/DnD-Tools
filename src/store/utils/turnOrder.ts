type ScheduledCallback = () => void;

export const scheduleTurnOrderUpdate = (
  callback: ScheduledCallback,
  delay: number = 0
): void => {
  setTimeout(callback, delay);
};

