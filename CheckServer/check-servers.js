/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");

  const home = "home";
  const hackLevel = ns.getHackingLevel();

  const portPrograms = [
    "BruteSSH.exe",
    "FTPCrack.exe",
    "relaySMTP.exe",
    "HTTPWorm.exe",
    "SQLInject.exe",
  ];
  let portCount = 0;
  for (const p of portPrograms) if (ns.fileExists(p, home)) portCount++;

  // scan network (BFS)
  const seen = new Set([home]);
  const q = [home];
  while (q.length) {
    const cur = q.shift();
    for (const n of ns.scan(cur)) if (!seen.has(n)) { seen.add(n); q.push(n); }
  }

  const list = [];
  for (const host of [...seen]) {
    if (host === home) continue;
    try {
      const maxMoney = ns.getServerMaxMoney(host);
      if (maxMoney <= 0) continue;

      const curMoney = ns.getServerMoneyAvailable(host);
      const reqHack = ns.getServerRequiredHackingLevel(host);
      const portsReq = ns.getServerNumPortsRequired(host);
      const hasRoot = ns.hasRootAccess(host);
      const canNuke = !hasRoot && portsReq <= portCount;

      if (!(hasRoot || canNuke)) continue;
      if (hackLevel < reqHack) continue;

      const maxRam = ns.getServerMaxRam(host);
      const usedRam = ns.getServerUsedRam(host);
      const freeRam = Math.max(0, maxRam - usedRam);

      const minSec = ns.getServerMinSecurityLevel(host);
      const sec = ns.getServerSecurityLevel(host);

      let hackTime = null;
      try { hackTime = ns.getHackTime(host); } catch (e) { hackTime = null; }

      list.push({
        host,
        curMoney,
        maxMoney,
        freeRam,
        maxRam,
        reqHack,
        portsReq,
        hasRoot,
        minSec,
        sec,
        hackTime
      });
    } catch (e) {
      // ignore host-level errors
    }
  }

  // header
  ns.tprint("============== CHECK SERVERS: START ==============");
  ns.tprint("");

  // body
  if (list.length === 0) {
    ns.tprint("============== HACKABLE SERVERS ==============");
    ns.tprint("  (none)");
    ns.tprint(`Summary: hackable=0  hackLevel=${hackLevel}  ports=${portCount}`);
    return;
  }

  list.sort((a, b) => b.maxMoney - a.maxMoney);

  for (const s of list) {
    ns.tprint(`============== ${s.host} ==============`);
    ns.tprint(`Current money / Max money: $${Math.floor(s.curMoney).toLocaleString()} / $${Math.floor(s.maxMoney).toLocaleString()} | Free RAM / RAM: ${s.freeRam.toFixed(2)}GB / ${s.maxRam.toFixed(2)}GB`);
    ns.tprint(`Hack time: ${formatDuration(s.hackTime)} | Min security / Current security: ${formatNumber(s.minSec)} / ${formatNumber(s.sec, 2)}`);
    ns.tprint("");
  }

  ns.tprint(`============== Summary ==============`);
  ns.tprint(`hackable=${list.length}  hackLevel=${hackLevel}  ports=${portCount}`);
}

/** Helpers **/
function formatDuration(ms) {
  if (!ms || !isFinite(ms)) return "n/a";
  const totalSec = Math.round(ms / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function formatNumber(n, decimals = 0) {
  if (typeof n !== "number" || !isFinite(n)) return "n/a";
  if (decimals === 0) return `${Math.floor(n)}`;
  return `${n.toFixed(decimals)}`;
}
