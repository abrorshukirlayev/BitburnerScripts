/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");

  const host = ns.args[0];
  const home = "home";

  if (!host) {
    ns.tprint("USAGE: run root-target.js <hostname>");
    ns.tprint("EXAMPLE: run root-target.js n00dles");
    return;
  }
  if (!ns.serverExists(host)) {
    ns.tprint(`ERROR: target "${host}" does not exist.`);
    return;
  }

  ns.tprint("============== ROOT TARGET: START ==============");
  ns.tprint(`Target: ${host}`);

  // gather port tools on home
  const portTools = [
    { name: "BruteSSH.exe", fn: h => ns.brutessh(h) },
    { name: "FTPCrack.exe", fn: h => ns.ftpcrack(h) },
    { name: "relaySMTP.exe", fn: h => ns.relaysmtp(h) },
    { name: "HTTPWorm.exe", fn: h => ns.httpworm(h) },
    { name: "SQLInject.exe", fn: h => ns.sqlinject(h) },
  ].filter(p => ns.fileExists(p.name, home));

  const portsAvailable = portTools.length;
  const portsNeeded = ns.getServerNumPortsRequired(host);
  ns.tprint(`Ports needed: ${portsNeeded}  Tools available: ${portsAvailable}`);

  // if not rooted, attempt to open ports
  if (!ns.hasRootAccess(host)) {
    for (const p of portTools) {
      try { p.fn(host); ns.tprint(`Ran ${p.name}`); } catch (e) { /* ignore single-tool errors */ }
      await ns.sleep(20); // small throttle
    }

    if (ns.getServerNumPortsRequired(host) <= portsAvailable) {
      try { ns.nuke(host); ns.tprint(`NUKED: ${host}`); }
      catch (e) { ns.tprint(`NUKE FAILED: ${e}`); ns.tprint("============== ROOT TARGET: END =============="); return; }
    } else {
      ns.tprint(`CANNOT NUKE ${host} (needs ${portsNeeded}, have ${portsAvailable}).`);
      ns.tprint("============== ROOT TARGET: END ==============");
      return;
    }
  } else {
    ns.tprint(`STATUS: already have root on ${host}`);
  }

  if (!ns.hasRootAccess(host)) {
    ns.tprint(`FAILED: No root access on ${host} after attempts.`);
    ns.tprint("============== ROOT TARGET: END ==============");
    return;
  }

  ns.tprint(`ROOT COMPLETE: ${host}`);
  ns.tprint("============== ROOT TARGET: END ==============");
}
