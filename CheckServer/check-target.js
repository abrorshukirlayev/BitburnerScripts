/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");

  const target = ns.args[0];
  const doTest = String(ns.args[1] || "").toLowerCase() === "test";

  if (!target) {
    ns.tprint("USAGE: run check-target.js <target> [test]");
    ns.tprint("EXAMPLE: run check-target.js n00dles");
    ns.tprint("EXAMPLE (live tests): run check-target.js n00dles test");
    return;
  }

  // Basic existence & permissions
  const exists = ns.serverExists(target);
  ns.tprint("============== CHECK TARGET ==============");
  ns.tprint(`Target: ${target}`);
  ns.tprint(`Exists: ${exists}`);
  if (!exists) {
    ns.tprint("ERROR: Target does not exist.");
    return;
  }

  const hackLevel = ns.getHackingLevel();
  const reqHack = ns.getServerRequiredHackingLevel(target);
  const hasRoot = ns.hasRootAccess(target);
  const portsReq = ns.getServerNumPortsRequired(target);

  ns.tprint(`Your hacking level: ${hackLevel}  Required: ${reqHack}`);
  ns.tprint(`Root: ${hasRoot}  Ports required: ${portsReq}`);

  // Money & security snapshot
  const maxMoney = ns.getServerMaxMoney(target);
  const curMoney = ns.getServerMoneyAvailable(target);
  const minSec = ns.getServerMinSecurityLevel(target);
  const sec = ns.getServerSecurityLevel(target);

  ns.tprint(`Money: $${Math.floor(curMoney).toLocaleString()} / $${Math.floor(maxMoney).toLocaleString()}`);
  ns.tprint(`Security: ${sec.toFixed(2)} (min ${minSec.toFixed(2)})`);

  // Times
  let hackTime = "n/a", growTime = "n/a", weakenTime = "n/a";
  try { hackTime = formatDuration(ns.getHackTime(target)); } catch {}
  try { growTime = formatDuration(ns.getGrowTime(target)); } catch {}
  try { weakenTime = formatDuration(ns.getWeakenTime(target)); } catch {}

  ns.tprint(`Times: hack=${hackTime}  grow=${growTime}  weaken=${weakenTime}`);

  // Optional live tests (may take time)
  if (doTest) {
    ns.tprint("=== RUNNING LIVE ACTION TESTS ===");
    try {
      ns.tprint(`weaken() started. Expected time: ${weakenTime}`)
      await ns.weaken(target);
      ns.tprint(`weaken() completed. Security now: ${ns.getServerSecurityLevel(target).toFixed(2)}`);
    } catch (e) {
      ns.tprint(`weaken() ERROR: ${e}`);
    }

    try {
      ns.tprint(`grow() started. Expected time: ${growTime}`)
      await ns.grow(target);
      ns.tprint(`grow() completed. Money now: $${Math.floor(ns.getServerMoneyAvailable(target)).toLocaleString()}`);
    } catch (e) {
      ns.tprint(`grow() ERROR: ${e}`);
    }

    try {
      ns.tprint(`hack() started. Expected time: ${hackTime}`)
      const hacked = await ns.hack(target);
      ns.tprint(`hack() returned: ${hacked}`);
      ns.tprint(`Money now: $${Math.floor(ns.getServerMoneyAvailable(target)).toLocaleString()}`);
    } catch (e) {
      ns.tprint(`hack() ERROR: ${e}`);
    }
  }

  ns.tprint("============== CHECK COMPLETE ==============");
}

/** Helpers **/
function formatDuration(ms) {
  if (!ms || !isFinite(ms)) return "n/a";
  const s = Math.round(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}