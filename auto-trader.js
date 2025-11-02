/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");
  ns.tail();
  ns.clearLog();

  const buyThreshold = Number(ns.args[0]) || 0.65;
  const sellThreshold = Number(ns.args[1]) || 0.55;
  const moneyKeep = Number(ns.args[2]) || 1_000_000_000;
  const cycleMs = Number(ns.args[3]) || 5000;

  if (!ns.stock || typeof ns.stock.getSymbols !== "function") {
    ns.print("ERROR: Stock API not available.");
    return;
  }

  const stock = ns.stock;
  const fn = {
    getSymbols: stock.getSymbols.bind(stock),
    getForecast: (sym) =>
      stock.getForecast ? stock.getForecast(sym) :
      stock.getStockForecast ? stock.getStockForecast(sym) : null,
    getVolatility: (sym) =>
      stock.getVolatility ? stock.getVolatility(sym) : null,
    getPrice: (sym) =>
      stock.getPrice ? stock.getPrice(sym) :
      stock.getAskPrice ? stock.getAskPrice(sym) :
      stock.getBidPrice ? stock.getBidPrice(sym) : null,
    getMaxShares: (sym) =>
      stock.getMaxShares ? stock.getMaxShares(sym) : Infinity,
    getPosition: (sym) =>
      stock.getPosition ? stock.getPosition(sym) : [0, 0, 0, 0],
    buy: (sym, shares) =>
      stock.buyStock ? stock.buyStock(sym, shares) :
      stock.buy ? stock.buy(sym, shares) : null,
    sell: (sym, shares) =>
      stock.sellStock ? stock.sellStock(sym, shares) :
      stock.sell ? stock.sell(sym, shares) : null,
  };

  ns.print("========================================");
  ns.print(`AUTO-TRADER START | buy>=${buyThreshold} | sell<${sellThreshold} | keep=$${formatMoney(moneyKeep)} | cycle=${cycleMs}ms`);
  ns.print("========================================");

  const symbols = fn.getSymbols();
  if (!symbols || symbols.length === 0) {
    ns.print("ERROR: No tradable symbols.");
    return;
  }

  while (true) {
    try {
      let homeCash = ns.getServerMoneyAvailable("home");

      for (const sym of symbols) {
        const forecast = fn.getForecast(sym);
        const vol = fn.getVolatility(sym);
        const price = fn.getPrice(sym);
        const maxShares = fn.getMaxShares(sym);
        const pos = fn.getPosition(sym);
        const shares = pos[0] || 0;
        const avgPrice = pos[1] || 0;

        const shouldSell = shares > 0 && forecast < sellThreshold;
        const shouldBuy = forecast >= buyThreshold && price && homeCash > moneyKeep + 1000;

        if (!shouldBuy && !shouldSell) continue; // skip HOLDs

        const totalCost = shares * avgPrice;
        const profit = shares * price - totalCost;
        const profitPct = totalCost > 0 ? (profit / totalCost) * 100 : 0;
        const glyph = mapForecastToGlyph(forecast);
        const status = shouldSell ? "SELL" : "BUY";

        ns.print(`${sym}  |  $${formatMoney(price)}  |  Volatility: ${(vol*100).toFixed(2)}%  |  Forecast: ${glyph}`);
        ns.print(`Status: ${status}`);
        ns.print(`Shares owned: ${formatShares(shares)} (Max: ${formatShares(maxShares)})`);
        ns.print(`Average Price: $${formatMoney(avgPrice)} (Total Cost: $${formatMoney(totalCost)})`);
        ns.print(`Profit: $${formatMoney(profit)} (${profitPct.toFixed(2)}%)`);
        ns.print("========================================");

        if (shouldSell) {
          try {
            fn.sell(sym, shares);
            ns.print(`[ACTION] SOLD ${sym} shares=${formatShares(shares)} at $${formatMoney(price)}`);
          } catch (e) {
            ns.print(`[ERROR SELL] ${sym}: ${e}`);
          }
        } else if (shouldBuy) {
          const available = Math.max(0, homeCash - moneyKeep);
          const spend = Math.min(available * 0.95, available);
          const sharesAffordable = Math.floor(spend / price);
          const sharesToBuy = Math.min(sharesAffordable, maxShares - shares);
          if (sharesToBuy > 0) {
            try {
              fn.buy(sym, sharesToBuy);
              ns.print(`[ACTION] BOUGHT ${sym} shares=${formatShares(sharesToBuy)} at $${formatMoney(price)}`);
              homeCash = ns.getServerMoneyAvailable("home");
            } catch (e) {
              ns.print(`[ERROR BUY] ${sym}: ${e}`);
            }
          }
        }

        await ns.sleep(50);
      }
    } catch (err) {
      ns.print(`[AUTO-TRADER ERROR] ${err}`);
    }

    await ns.sleep(cycleMs);
  }

  function mapForecastToGlyph(f) {
    if (f >= 0.66) return "+++";
    if (f >= 0.60) return "++";
    if (f >= 0.55) return "+";
    if (f >= 0.50) return "~";
    if (f >= 0.45) return "-";
    if (f >= 0.40) return "--";
    return "---";
  }

  function formatMoney(v) {
    if (v >= 1e12) return (v / 1e12).toFixed(3) + "t";
    if (v >= 1e9)  return (v / 1e9).toFixed(3) + "b";
    if (v >= 1e6)  return (v / 1e6).toFixed(3) + "m";
    if (v >= 1e3)  return (v / 1e3).toFixed(3) + "k";
    return v.toFixed(2);
  }

  function formatShares(s) {
    if (s >= 1e9) return (s/1e9).toFixed(3) + "b";
    if (s >= 1e6) return (s/1e6).toFixed(3) + "m";
    if (s >= 1e3) return (s/1e3).toFixed(3) + "k";
    return s.toFixed(2);
  }
}
