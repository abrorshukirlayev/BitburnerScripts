/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");
  ns.clearLog();

  // === Required args (no defaults) ===
  const target = String(ns.args[0] || "");

  if (!target) {
    ns.tprint("USAGE: run target-attack.js <target> [targetMoney] [minSecurity]");
    return;
  }

  const targetMoney = (ns.args[1] !== undefined && Number.isFinite(Number(ns.args[1])))
  ? Number(ns.args[1])
  : ns.getServerMaxMoney(target);

  const minSecurity = (ns.args[2] !== undefined && Number.isFinite(Number(ns.args[2])))
  ? Number(ns.args[2])
  : ns.getServerMinSecurityLevel(target);
  
  const host = ns.getHostname();

  // Target existence check
  if (!ns.serverExists(target)) {
    ns.tprint(`ERROR: target "${target}" does not exist.`);
    return;
  }

  // Hacking level check (must meet requirement)
  const reqHack = ns.getServerRequiredHackingLevel(target);
  const myHack = ns.getHackingLevel();
  if (myHack < reqHack) {
    ns.tprint(`ERROR: Your hacking level ${myHack} is below target requirement ${reqHack}.`);
    return;
  }

  // Optional: warn if no root (we'll still attempt operations but they may fail)
  const hasRoot = ns.hasRootAccess(target);
  if (!hasRoot) ns.tprint(`WARN: No root on ${target}. grow/weaken/hack may fail or be slower.`);

  ns.tprint("========================================");
  ns.tprint(`TARGET-ATTACK START -> target=${target}`);
  ns.tprint(`TargetMoney=$${Math.floor(targetMoney).toLocaleString()}  MinSecurity=${minSecurity}`);
  ns.tprint(`Runner host=${host}  yourHack=${myHack}  targetReqHack=${reqHack}  hasRoot=${hasRoot}`);
  ns.tprint("========================================");

  while (true) {
    try {
      const sec = ns.getServerSecurityLevel(target);
      const curMoney = ns.getServerMoneyAvailable(target);

      // Times
      let hackTime = "n/a", growTime = "n/a", weakenTime = "n/a";
      try { hackTime = formatDuration(ns.getHackTime(target)); } catch (e) { /* ignore */ }
      try { growTime = formatDuration(ns.getGrowTime(target)); } catch (e) { /* ignore */ }
      try { weakenTime = formatDuration(ns.getWeakenTime(target)); } catch (e) { /* ignore */ }

      // WEAKEN if above minSecurity threshold
      if (sec > minSecurity + 0.1) {
        ns.print(`Action: WEAKEN (${weakenTime}) | security=${sec.toFixed(2)} (target<=${(minSecurity+0.1).toFixed(2)})`);
        await ns.weaken(target);
        continue;
      }

      // GROW if money below targetMoney
      if (curMoney < targetMoney) {
        ns.print(`Action: GROW   (${growTime}) | money=$${Math.floor(curMoney).toLocaleString()} (target=$${Math.floor(targetMoney).toLocaleString()})`);
        await ns.grow(target);
        continue;
      }

      // HACK otherwise
      ns.print(`Action: HACK   (${hackTime}) | money=$${Math.floor(curMoney).toLocaleString()} (target reached)`);
      await ns.hack(target);
    } catch (e) {
      ns.tprint(`ERROR: target-attack failed: ${e}`);
      return;
    }

    await ns.sleep(50);
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
}
