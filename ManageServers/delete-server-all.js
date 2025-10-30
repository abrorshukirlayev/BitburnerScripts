/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");
  ns.clearLog();

  ns.tprint("=== DELETE ALL SERVERS SCRIPT ===");

  const confirmWord = ns.args[0];
  const exceptFlag = ns.args[1];
  const exceptServer = ns.args[2];

  // === Confirmation Check ===
  if (confirmWord !== "confirm") {
    ns.tprint("USAGE: run delete-server-all.js confirm [--except <server-name>]");
    ns.tprint("ERROR: Confirmation missing or incorrect.");
    ns.tprint("EXAMPLE: run delete-server-all.js confirm");
    ns.tprint("EXAMPLE: run delete-server-all.js confirm --except my-server");
    ns.tprint("=== SCRIPT KILLED ===");
    return;
  }

  const servers = ns.getPurchasedServers();
  if (servers.length === 0) {
    ns.tprint("No purchased servers found.");
    ns.tprint("=== SCRIPT KILLED ===");
    return;
  }

  let filteredServers = servers;
  if (exceptFlag === "--except" && exceptServer) {
    filteredServers = servers.filter(s => s !== exceptServer);
    ns.tprint(`Skipping server: "${exceptServer}"`);
  }

  // === Deletion Process ===
  ns.tprint(`Found ${servers.length} servers. Deleting ${filteredServers.length}...`);

  for (const server of filteredServers) {
    try {
      const success = ns.deleteServer(server);
      if (success) ns.print(`SUCCESS: Deleted "${server}".`);
      else ns.print(`FAILED: Could not delete "${server}" (scripts may be running).`);
    } catch (e) {
      ns.print(`ERROR deleting "${server}": ${e}`);
    }
    await ns.sleep(100);
  }

  ns.tprint("=== ALL SERVERS PROCESSED ===");
  ns.tprint("=== SCRIPT COMPLETE ===");
}
