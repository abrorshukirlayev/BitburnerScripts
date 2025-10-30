/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");

  const scriptName = ns.args[0];
  if (!scriptName) {
    ns.tprint("SUMMARY: This script kills a specific script from all servers.")
    ns.tprint("USAGE: run kill-specific-script.js <script-name>");
    ns.tprint("EXAMPLE: run kill-specific-script.js my-script.js")
    ns.exit();
  }

  ns.tail();
  const home = "home";

  // BFS scan all servers
  const seen = new Set([home]);
  const queue = [home];
  while (queue.length) {
    const cur = queue.shift();
    for (const n of ns.scan(cur)) {
      if (!seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
    }
  }

  let killCount = 0;

  for (const host of seen) {
    const procs = ns.ps(host);
    for (const proc of procs) {
      if (proc.filename === scriptName) {
        try {
          ns.kill(proc.pid);
          ns.print(`Killed ${scriptName} on ${host} (PID ${proc.pid})`);
          killCount++;
        } catch (e) {
          ns.print(`FAILED to kill ${scriptName} on ${host}: ${e}`);
        }
      }
    }
  }

  ns.tprint(`Killed ${killCount} instances of "${scriptName}" across network.`);
}
