/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");

  const args = ns.args.slice();
  const script = args.shift();
  if (!script) {
    ns.tprint("USAGE: run run-script-all.js <script> [arg1 arg2 ...] [--threads N] [--except <server>]");
    ns.tprint("EXAMPLE: run run-script-all.js target-attack.js target 100000 --threads 4");
    return;
  }

  // parse flags and scriptArgs
  let overrideThreads = null;
  let exceptServer = null;
  const scriptArgs = [];
  for (let i = 0; i < args.length; i++) {
    const a = String(args[i]);
    if (a === "--threads") {
      const v = Number(args[i + 1]);
      if (Number.isFinite(v) && v > 0) overrideThreads = Math.floor(v);
      i++;
      continue;
    }
    if (a === "--except") {
      exceptServer = String(args[i + 1]);
      i++;
      continue;
    }
    scriptArgs.push(a);
  }

  const home = "home";
  ns.tprint("========== RUN-SCRIPT-ALL START ==========");
  ns.tprint(`Script: ${script}  threads=${overrideThreads ?? "max-per-host"}  except=${exceptServer ?? "none"}`);

  // BFS scan network
  const seen = new Set([home]);
  const q = [home];
  while (q.length) {
    const cur = q.shift();
    for (const n of ns.scan(cur)) {
      if (!seen.has(n)) { seen.add(n); q.push(n); }
    }
  }

  const targets = [...seen].filter(s => s !== home && s !== exceptServer);
  let launched = 0;

  for (const host of targets) {
    try {
      if (!ns.hasRootAccess(host)) {
        ns.tprint(`SKIP ${host} (no root)`);
        continue;
      }

      if (!ns.fileExists(script, host)) {
        ns.tprint(`SKIP ${host} (script missing)`);
        continue;
      }

      const ramPerThread = ns.getScriptRam(script, host);
      const freeRam = Math.max(0, ns.getServerMaxRam(host) - ns.getServerUsedRam(host));
      const maxThreads = Math.floor(freeRam / ramPerThread);

      // threads: default = maxThreads, or min(overrideThreads, maxThreads)
      let threads = maxThreads;
      if (overrideThreads !== null) threads = Math.min(maxThreads, Math.max(0, overrideThreads));
      threads = Math.floor(threads);

      if (threads <= 0) {
        ns.tprint(`SKIP ${host} (not enough RAM). free=${freeRam.toFixed(2)}GB req/thread=${ramPerThread.toFixed(2)}GB`);
        continue;
      }

      // avoid duplicate runs of same script
      const already = ns.ps(host).some(p => p.filename === script);
      if (already) {
        ns.tprint(`SKIP ${host} (already running ${script})`);
        continue;
      }

      const pid = ns.exec(script, host, threads, ...scriptArgs);
      if (pid === 0) {
        ns.tprint(`FAILED ${host} -> exec returned 0 (threads=${threads})`);
      } else {
        ns.tprint(`LAUNCHED ${script} on ${host} (threads=${threads}) -> PID ${pid}`);
        launched++;
      }
    } catch (e) {
      ns.tprint(`ERROR ${host}: ${e}`);
    }
    await ns.sleep(80); // throttle
  }

  ns.tprint(`========== RUN-SCRIPT-ALL DONE (launched=${launched}) ==========`);

}
