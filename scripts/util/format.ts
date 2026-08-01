export const prefix = "§8[§aGenesis§8]§r ";

export const alertPrefix = "§8[§aGenesis §7Alert§8]§r ";

export function formatDuration(milliseconds: number) {
  if (milliseconds <= 0) return "expired";
  const seconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return days + "d " + hours + "h";
  if (hours > 0) return hours + "h " + minutes + "m";
  if (minutes > 0) return minutes + "m " + (seconds % 60) + "s";
  return seconds + "s";
}

export function formatClock(timestamp: number) {
  const date = new Date(timestamp);
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const seconds = date.getUTCSeconds().toString().padStart(2, "0");
  return hours + ":" + minutes + ":" + seconds;
}

