/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");

  ns.tprint("=== BUY SERVER SCRIPT STARTED ===");
  ns.tprint("");

  const [name, ramArg] = ns.args;
  const ramReq = Number(ramArg);

  // === Input Validation ===
  if (!name || !Number.isFinite(ramReq) || ramReq <= 0) {
    ns.tprint("USAGE: run buy-server.js <name> <ramGB>");
    ns.tprint("ERROR: Invalid input parameters.");
    ns.tprint("EXAMPLE: run buy-server.js my-server 32");
    ns.tprint("");
    ns.tprint("=== SCRIPT KILLED ===");
    return;
  }

  // === Helpers ===
  const nextPow2 = n => {
    let p = 1;
    while (p < n) p <<= 1;
    return p;
  };

  const maxRam = ns.getPurchasedServerMaxRam();
  const limit = ns.getPurchasedServerLimit();
  const owned = ns.getPurchasedServers();

  // === Pre-checks ===
  if (owned.length >= limit) {
    ns.tprint(`FAILED: Purchased server limit reached (${limit}).`);
    ns.tprint("=== SCRIPT KILLED ===");
    return;
  }

  if (owned.includes(name)) {
    ns.tprint(`FAILED: Server "${name}" already exists.`);
    ns.tprint("=== SCRIPT KILLED ===");
    return;
  }

  const ram = nextPow2(Math.floor(ramReq));
  if (ram !== ramReq) ns.tprint(`NOTE: RAM rounded to next power of two -> ${ram}GB`);

  if (ram > maxRam) {
    ns.tprint(`FAILED: Requested RAM ${ram}GB exceeds max purchasable ${maxRam}GB.`);
    ns.tprint("=== SCRIPT KILLED ===");
    return;
  }

  // === Attempt Purchase ===
  try {
    const cost = ns.getPurchasedServerCost(ram);
    const money = ns.getServerMoneyAvailable("home");

    if (money < cost) {
      ns.tprint(`FAILED: Need $${Math.floor(cost).toLocaleString()}, have $${Math.floor(money).toLocaleString()}.`);
      ns.tprint("=== SCRIPT KILLED ===");
      return;
    }

    const res = ns.purchaseServer(name, ram);
    if (!res) {
      ns.tprint("FAILED: purchaseServer() returned null (check funds/limit).");
    } else {
      ns.tprint(`SUCCESS: Purchased server "${res}" with ${ram}GB RAM.`);
    }
  } catch (err) {
    ns.tprint("ERROR: " + err);
  }

  ns.tprint("");
  ns.tprint("=== SCRIPT KILLED ===");
}