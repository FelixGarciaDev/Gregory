const staleDays = 14;

function logScan() {
  const now = new Date().toISOString();
  console.log(`[worker] ${now} stale-offer scan configured for ${staleDays} days.`);
}

logScan();
setInterval(logScan, 60_000);
