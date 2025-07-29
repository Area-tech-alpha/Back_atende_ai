export function getCurrentDateTime() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
} 