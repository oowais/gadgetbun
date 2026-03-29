function nowSec() {
  return Math.floor(Date.now() / 1000);
}
function daysAgo(n: number) {
  return nowSec() - n * 86400;
}
function tsToDate(ts: number) {
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

export { daysAgo, nowSec, tsToDate };
