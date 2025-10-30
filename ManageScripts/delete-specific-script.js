/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");
  const scriptName = ns.args[0];
  if (!scriptName) {
    ns.tprint("SUMMARY: This script deletes a specific script from all servers.")
    ns.tprint("USAGE: run delete-specific-script.js <script-name>");
    ns.tprint("EXAMPLE: run delete-specific-script.js my-script.js")
    ns.exit();
  }

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

  let deletedCount = 0;

  for (const host of seen) {
    if (ns.fileExists(scriptName, host)) {
      try {
        ns.rm(scriptName, host);
        ns.tprint(`Deleted ${scriptName} from ${host}`);
        deletedCount++;
      } catch (e) {
        ns.tprint(`FAILED to delete ${scriptName} from ${host}: ${e}`);
      }
    }
  }

  ns.tprint(`Deleted ${deletedCount} copies of "${scriptName}" from network.`);
}
