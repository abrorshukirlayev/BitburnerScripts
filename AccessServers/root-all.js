/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");
  const home = "home";

  ns.tprint("========== ROOT-ALL: START ==========");

  // Gather port tools available on home
  const portTools = [
    { name: "BruteSSH.exe", fn: h => ns.brutessh(h) },
    { name: "FTPCrack.exe", fn: h => ns.ftpcrack(h) },
    { name: "relaySMTP.exe", fn: h => ns.relaysmtp(h) },
    { name: "HTTPWorm.exe", fn: h => ns.httpworm(h) },
    { name: "SQLInject.exe", fn: h => ns.sqlinject(h) },
  ].filter(p => ns.fileExists(p.name, home));

  const portCount = portTools.length;
  ns.tprint(`Port tools available on home: ${portCount}`);

  // BFS network scan to get all hosts
  const seen = new Set([home]);
  const q = [home];
  while (q.length) {
    const cur = q.shift();
    for (const n of ns.scan(cur)) {
      if (!seen.has(n)) { seen.add(n); q.push(n); }
    }
  }

  const allHosts = [...seen].filter(h => h !== home);
  const purchased = ns.getPurchasedServers();

  // Process each host
  for (const host of allHosts) {
    try {
      if (purchased.includes(host)) {
        ns.tprint(`SKIP ${host} (purchased server)`);
        continue;
      }

      const needed = ns.getServerNumPortsRequired(host);
      ns.tprint(`========== ${host} ==========`);
      // If already have root, report and skip
      if (ns.hasRootAccess(host)) {
        ns.tprint(`ALREADY ROOTED: ${host} (needs ${needed}, you have ${portCount})`);
        continue;
      }

      // Try every port tool we have
      for (const p of portTools) {
        try { p.fn(host); ns.tprint(`Ran ${p.name}`); } catch (e) { /* ignore per-tool errors */ }
      }

      if (ns.getServerNumPortsRequired(host) <= portCount) {
        try {
          ns.nuke(host);
          ns.tprint(`NUKED ${host}`);
        } catch (e) {
          ns.tprint(`NUKE FAILED ${host}: ${e}`);
        }
      } else {
        ns.tprint(`CANNOT NUKE ${host} (needs ${needed}, you have ${portCount})`);
        continue;
      }

      // Verify root success
      if (!ns.hasRootAccess(host)) {
        ns.tprint(`NO ROOT AFTER ATTEMPT: ${host}`);
        continue;
      } else {
        ns.tprint(`ROOT SUCCESS: ${host}`);
      }
    } catch (err) {
      ns.tprint(`ERROR ${host}: ${err}`);
    }

    // throttle to avoid hammering game loop
    await ns.sleep(120);
  }

  ns.tprint('');
  ns.tprint("========== ROOT-ALL: DONE ==========");
}
