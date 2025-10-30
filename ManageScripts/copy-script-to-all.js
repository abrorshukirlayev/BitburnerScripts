/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");
  ns.clearLog();

  const script = ns.args[0];
  if (!script) {
    ns.tprint("USAGE: run copy-script-to-all.js <script> [--except <server>] [--override]");
    ns.tprint("EXAMPLES:");
    ns.tprint("  run copy-script-to-all.js my-script.js");
    ns.tprint("  run copy-script-to-all.js my-script.js --except n00dles");
    ns.tprint("  run copy-script-to-all.js my-script.js --override");
    ns.tprint("=== SCRIPT KILLED ===");
    return;
  }

  if (!ns.fileExists(script, "home")) {
    ns.tprint(`ERROR: Script "${script}" not found on home.`);
    ns.tprint("=== SCRIPT KILLED ===");
    return;
  }

  // parse flags
  const exceptIndex = ns.args.indexOf("--except");
  const exceptServer = exceptIndex !== -1 ? ns.args[exceptIndex + 1] : null;
  const override = ns.args.includes("--override");

  // BFS scan all reachable servers starting from home
  const home = "home";
  const seen = new Set([home]);
  const q = [home];
  while (q.length) {
    const cur = q.shift();
    for (const n of ns.scan(cur)) {
      if (!seen.has(n)) {
        seen.add(n);
        q.push(n);
      }
    }
  }

  // build targets: all servers except home, optionally excluding one server
  let targets = [...seen].filter(s => s !== home);
  if (exceptServer) targets = targets.filter(s => s !== exceptServer);

  ns.tprint(`Found ${targets.length} target servers. override=${override}${exceptServer ? ` skip=${exceptServer}` : ""}`);

  // copy loop
  let successCount = 0;
  for (const server of targets) {
    try {
      if (override && ns.fileExists(script, server)) {
        ns.tprint(`OVERRIDE: removing existing ${script} from ${server}`);
        try { ns.rm(script, server); } catch (e) { /* ignore */ }
        await ns.sleep(40);
      }

      await ns.scp(script, server, "home");
      ns.tprint(`SUCCESS: Copied "${script}" -> ${server}`);
      successCount++;
    } catch (e) {
      ns.tprint(`ERROR: Failed to copy to "${server}" — ${e}`);
    }
    await ns.sleep(80);
  }

  ns.tprint(`=== COPY COMPLETE: ${successCount}/${targets.length} succeeded ===`);
}
