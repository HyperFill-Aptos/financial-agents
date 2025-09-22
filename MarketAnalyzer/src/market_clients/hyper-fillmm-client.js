const { Aptos, AptosConfig, Network } = require('@aptos-labs/ts-sdk');
const https = require('https');

class HyperFillMMClient {
  constructor(config) {
    this.account = config.account;
    this.privateKey = config.privateKey;
    this.simulationMode = config.simulationMode || false;
    this.aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
    this.vaultAddress = '0xe22a7dbf85b88f1c950b96923e29f0213121002f296c0572549f2a6a7e7fd6f5';
  }

  async getMarketData() {
    try {
      const aptPrice = await this.fetchAptPrice();

      return {
        price: aptPrice.price_usd,
        volume24h: aptPrice.volume_24h,
        priceChange24h: aptPrice.price_change_24h,
        marketCap: aptPrice.market_cap,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        price: 12.50,
        volume24h: 150000000,
        priceChange24h: 2.5,
        marketCap: 5000000000,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async getOrderBook() {
    const marketData = await this.getMarketData();
    const spreadPercentage = 0.5;

    const bidPrice = marketData.price * (1 - spreadPercentage / 100);
    const askPrice = marketData.price * (1 + spreadPercentage / 100);

    const bids = [];
    const asks = [];

    for (let i = 0; i < 5; i++) {
      const bidPriceLevel = bidPrice * (1 - (i * 0.001));
      const askPriceLevel = askPrice * (1 + (i * 0.001));
      const volume = Math.max(0.1, Math.random() * 10);

      bids.push([bidPriceLevel.toFixed(4), volume.toFixed(2)]);
      asks.push([askPriceLevel.toFixed(4), volume.toFixed(2)]);
    }

    return {
      bids: bids.sort((a, b) => parseFloat(b[0]) - parseFloat(a[0])),
      asks: asks.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])),
      timestamp: new Date().toISOString()
    };
  }

  async getMarketAnalysis() {
    const marketData = await this.getMarketData();
    const orderBook = await this.getOrderBook();

    const analysis = {
      trend: this.analyzeTrend(marketData),
      volatility: this.calculateVolatility(marketData),
      momentum: this.calculateMomentum(marketData),
      support_levels: this.calculateSupportLevels(marketData),
      resistance_levels: this.calculateResistanceLevels(marketData),
      market_sentiment: this.analyzeSentiment(marketData),
      liquidity_analysis: this.analyzeLiquidity(orderBook),
      timestamp: new Date().toISOString()
    };

    return analysis;
  }

  analyzeTrend(marketData) {
    if (marketData.priceChange24h > 2) return 'bullish';
    if (marketData.priceChange24h < -2) return 'bearish';
    return 'neutral';
  }

  calculateVolatility(marketData) {
    return Math.abs(marketData.priceChange24h) / 100;
  }

  calculateMomentum(marketData) {
    return marketData.priceChange24h / 100;
  }

  calculateSupportLevels(marketData) {
    const price = marketData.price;
    return [
      price * 0.95,
      price * 0.90,
      price * 0.85
    ];
  }

  calculateResistanceLevels(marketData) {
    const price = marketData.price;
    return [
      price * 1.05,
      price * 1.10,
      price * 1.15
    ];
  }

  analyzeSentiment(marketData) {
    const change = marketData.priceChange24h;
    if (change > 5) return 'very_positive';
    if (change > 2) return 'positive';
    if (change < -5) return 'very_negative';
    if (change < -2) return 'negative';
    return 'neutral';
  }

  analyzeLiquidity(orderBook) {
    const bidDepth = orderBook.bids.reduce((sum, [price, volume]) => sum + (parseFloat(price) * parseFloat(volume)), 0);
    const askDepth = orderBook.asks.reduce((sum, [price, volume]) => sum + (parseFloat(price) * parseFloat(volume)), 0);

    return {
      bid_depth: bidDepth,
      ask_depth: askDepth,
      total_depth: bidDepth + askDepth,
      imbalance: (bidDepth - askDepth) / (bidDepth + askDepth)
    };
  }

  async fetchAptPrice() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.coingecko.com',
        path: '/api/v3/simple/price?ids=aptos&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true',
        method: 'GET',
        headers: {
          'User-Agent': 'HyperFill-MarketAnalyzer/1.0.0'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.aptos) {
              resolve({
                price_usd: response.aptos.usd,
                price_change_24h: response.aptos.usd_24h_change || 0,
                volume_24h: response.aptos.usd_24h_vol || 0,
                market_cap: response.aptos.usd_market_cap || 0,
              });
            } else {
              reject(new Error('Invalid API response'));
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      req.end();
    });
  }
}

module.exports = { HyperFillMMClient };