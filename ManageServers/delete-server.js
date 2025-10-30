/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");
  ns.clearLog();
  ns.tprint("=== DELETE SERVER SCRIPT ===");

  const name = ns.args[0];

  // === Input Validation ===
  if (!name) {
    ns.tprint("USAGE: run delete-server.js <name>");
    ns.tprint("ERROR: No server name provided.");
    ns.tprint("EXAMPLE: run delete-server.js my-server");
    ns.tprint("=== SCRIPT KILLED ===");
    return;
  }

  const owned = ns.getPurchasedServers();
  if (!owned.includes(name)) {
    ns.tprint(`FAILED: No purchased server found with name "${name}".`);
    ns.tprint("=== SCRIPT KILLED ===");
    return;
  }

  // === Deletion ===
  try {
    const success = ns.deleteServer(name);
    if (!success) {
      ns.tprint(`FAILED: Could not delete server "${name}".`);
      ns.tprint("Make sure all scripts are stopped and files removed.");
    } else {
      ns.tprint(`SUCCESS: Deleted server "${name}".`);
    }
  } catch (e) {
    ns.tprint("ERROR: " + e);
  }

  ns.tprint("=== SCRIPT KILLED ===");
}
