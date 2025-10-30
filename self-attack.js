/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");
  ns.clearLog();

  const host = ns.getHostname();
  const purchased = ns.getPurchasedServers();

  // Safety: do NOT run this aggressive attacker on home or purchased servers.
  if (host === "home" || purchased.includes(host)) {
    ns.tprint("========================================");
    ns.tprint("SELF-ATTACK ABORTED");
    ns.tprint(`Reason: Script running on protected host: ${host}`);
    ns.tprint("Do NOT run self-attack on 'home' or purchased servers (causes errors).");
    ns.tprint("Script terminated.");
    ns.tprint("========================================");
    return; // stop immediately
  }

  const targetMoney = ns.getServerMaxMoney(host);
  const minSecurity = ns.getServerMinSecurityLevel(host);

  ns.print("========================================");
  ns.print(`SELF-ATTACK START -> host=${host}`);
  ns.print(`TargetMoney=$${Math.floor(targetMoney).toLocaleString()}  MinSecurity=${minSecurity}`);
  ns.print("========================================");

  while (true) {
    try {
      const sec = ns.getServerSecurityLevel(host);
      const curMoney = ns.getServerMoneyAvailable(host);
      
      // Times
      let hackTime = "n/a", growTime = "n/a", weakenTime = "n/a";
      try { hackTime = formatDuration(ns.getHackTime(host)); } catch (e) {ns.print(`ERROR: ${e}`)}
      try { growTime = formatDuration(ns.getGrowTime(host)); } catch (e) {ns.print(`ERROR: ${e}`)}
      try { weakenTime = formatDuration(ns.getWeakenTime(host)); } catch (e) {ns.print(`ERROR: ${e}`)}

      if (sec > minSecurity + 0.1) {
        ns.print(`Action: WEAKEN (${weakenTime}) | security level=${sec.toFixed(2)} (target<=${(minSecurity+0.1).toFixed(2)})`);
        await ns.weaken(host);
        continue;
      }

      if (curMoney < targetMoney) {
        ns.print(`Action: GROW (${growTime})   | money=$${Math.floor(curMoney).toLocaleString()} (target=$${Math.floor(targetMoney).toLocaleString()})`);
        await ns.grow(host);
        continue;
      }

      ns.print(`Action: HACK (${hackTime})   | money=$${Math.floor(curMoney).toLocaleString()} (target reached)`);
      await ns.hack(host);
    } catch (e) {
      ns.print(`ERROR: self-attack failed: ${e}`);
      return;
    }

    await ns.sleep(50);
  }
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