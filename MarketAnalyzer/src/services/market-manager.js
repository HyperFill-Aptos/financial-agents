class MarketManager {
  constructor() {
    this._supportedMarkets = [];
    this._marketList = [
      {
        marketName: "hyperfill",
        id: "123"
      }
    ];
  }

  getMarketList() {
    return this._marketList;
  }

  getMarketClient(marketName) {
    const { HyperFillMMClient } = require("../market_clients/hyper-fillmm-client");
    if (marketName === "hyperfill") {
      return new HyperFillMMClient({
        account: '0xe22a7dbf85b88f1c950b96923e29f0213121002f296c0572549f2a6a7e7fd6f5',
        privateKey: process.env.HYPERFILL_PRIVATE_KEY || '0x1824fec805082d0ec3416b0040e82729d01c2930b16460d8906c3499b0d535e0',
        simulationMode: true
      });
    }
    return undefined;
  }
}

module.exports = { MarketManager };