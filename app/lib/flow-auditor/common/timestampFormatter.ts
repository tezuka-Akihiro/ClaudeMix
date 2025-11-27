// timestampFormatter - Pure Logic (lib層)
// Format timestamp to "HH:MM" or "たった今"

const JUST_NOW_THRESHOLD_MS = 60000; // 1分

export function formatTimestamp(timestamp: Date): string {
  if (!timestamp || !(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
    return '--:--';
  }

  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();

  if (diff < JUST_NOW_THRESHOLD_MS) {
    return 'たった今';
  }

  const hours = String(timestamp.getHours()).padStart(2, '0');
  const minutes = String(timestamp.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
