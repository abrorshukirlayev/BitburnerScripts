/** @param {NS} ns **/
export async function main(ns) {
  const servers = getAllServers(ns);
  for (const server of servers) {
    if (ns.ps(server).length > 0) {
      ns.killall(server);
      ns.tprint(`Killed all scripts on ${server}`);
    }
  }
}

// Helper to recursively find all servers
function getAllServers(ns) {
  const seen = new Set(["home"]);
  const stack = ["home"];
  while (stack.length > 0) {
    const host = stack.pop();
    for (const next of ns.scan(host)) {
      if (!seen.has(next)) {
        seen.add(next);
        stack.push(next);
      }
    }
  }
  return [...seen];
}