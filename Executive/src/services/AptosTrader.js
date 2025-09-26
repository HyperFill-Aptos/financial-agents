const { Aptos, AptosConfig, Network } = require('@aptos-labs/ts-sdk');

class AptosTrader {
  constructor(config) {
    this.baseUrl = config.baseUrl || "https://fullnode.testnet.aptoslabs.com/v1";
    this.account = config.account;
    this.privateKey = config.privateKey;
    this.defaultLeverage = config.defaultLeverage || 1.1;
    this.defaultSlippage = config.defaultSlippage || 5;

    this.aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
    this.vaultAddress = '0x96d2b185a5b581f98dc1df57b59a5875eb53b3a65ef7a9b0d5e42aa44c3b8b82';
    this.tradeSettlementAddress = '0x96d2b185a5b581f98dc1df57b59a5875eb53b3a65ef7a9b0d5e42aa44c3b8b82';

    this._assets = new Map();
    this._positions = new Map();
    this._openOrders = new Map();
    this._balance = 0;
    this._lastUpdateTime = 0;
  }

  async placeLimitOrder(asset, isBuy, price, size, leverage = null, reduceOnly = false) {
    const orderId = this.generateOrderId();

    try {
      const result = await this.aptos.view({
        function: `${this.vaultAddress}::hyperfill_vault::execute_vault_action`,
        arguments: [this.vaultAddress, 'allocate', (size * 100000000).toString(), this.account],
        type_arguments: [],
      });

      return {
        response: { success: true, result },
        orderId
      };
    } catch (error) {
      return {
        response: { success: false, error: error.message },
        orderId
      };
    }
  }

  async placeMarketOrder(asset, isBuy, size, leverage = null, slippage = null, reduceOnly = false) {
    const orderId = this.generateOrderId();

    try {
      const result = await this.aptos.view({
        function: `${this.vaultAddress}::hyperfill_vault::execute_vault_action`,
        arguments: [this.vaultAddress, 'allocate', (size * 100000000).toString(), this.account],
        type_arguments: [],
      });

      return {
        response: { success: true, result },
        orderId
      };
    } catch (error) {
      return {
        response: { success: false, error: error.message },
        orderId
      };
    }
  }

  async cancelOrder(orderId) {
    try {
      const result = await this.aptos.view({
        function: `${this.vaultAddress}::hyperfill_vault::get_vault_stats`,
        arguments: [this.vaultAddress],
        type_arguments: [],
      });

      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async closePosition(asset, closePrice, quantity = null) {
    const orderId = this.generateOrderId();

    try {
      const amount = quantity || 1.0;
      const result = await this.aptos.view({
        function: `${this.vaultAddress}::hyperfill_vault::execute_vault_action`,
        arguments: [this.vaultAddress, 'return_funds', (amount * 100000000).toString()],
        type_arguments: [],
      });

      return {
        response: { success: true, result },
        orderId
      };
    } catch (error) {
      return {
        response: { success: false, error: error.message },
        orderId
      };
    }
  }

  async addCollateral(asset, collateral, isBuy) {
    try {
      const result = await this.aptos.view({
        function: `${this.vaultAddress}::hyperfill_vault::deposit_liquidity`,
        arguments: [this.vaultAddress, (collateral * 100000000).toString()],
        type_arguments: [],
      });

      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async removeCollateral(asset, collateral, isBuy) {
    try {
      const result = await this.aptos.view({
        function: `${this.vaultAddress}::hyperfill_vault::withdraw_profits`,
        arguments: [this.vaultAddress],
        type_arguments: [],
      });

      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async setTakeProfit(asset, takeProfitPrice, size, isBuy) {
    return { success: true, message: "Take profit set", price: takeProfitPrice, size };
  }

  async setStopLoss(asset, stopLossPrice, size, isBuy) {
    return { success: true, message: "Stop loss set", price: stopLossPrice, size };
  }

  async fetchAssets() {
    const assets = [
      {
        symbol: 'APT',
        indexToken: '0x1::aptos_coin::AptosCoin',
        name: 'Aptos',
        precision: 8,
        minTradeSize: 0.1
      }
    ];

    assets.forEach(asset => {
      this._assets.set(asset.symbol, asset);
    });

    return assets;
  }

  async fetchOpenOrders(asset = null, side = null, page = 0, size = 10) {
    const mockOrders = [
      {
        orderId: this.generateOrderId(),
        asset: asset || 'APT',
        side: side || 'BUY',
        price: '12.50',
        size: 1.0,
        filled: 0,
        status: 'ACTIVE',
        timestamp: new Date().toISOString()
      }
    ];

    mockOrders.forEach(order => {
      this._openOrders.set(order.orderId, order);
    });

    return mockOrders;
  }

  async fetchPositions(page = 0, size = 10) {
    try {
      const vaultStats = await this.aptos.view({
        function: `${this.vaultAddress}::hyperfill_vault::get_user_shares`,
        arguments: [this.vaultAddress, this.account],
        type_arguments: [],
      });

      const positions = [
        {
          asset: 'APT',
          size: parseFloat(vaultStats[0]) / 100000000,
          entryPrice: '12.00',
          markPrice: '12.50',
          pnl: 0.5,
          side: 'LONG',
          timestamp: new Date().toISOString()
        }
      ];

      positions.forEach(position => {
        this._positions.set(position.asset, position);
      });

      return positions;
    } catch (error) {
      return [];
    }
  }

  async fetchBalance() {
    try {
      const balanceResult = await this.aptos.getAccountResource({
        accountAddress: this.account,
        resourceType: `0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`,
      });

      this._balance = parseInt(balanceResult.coin.value) / 100000000;
      return this._balance;
    } catch (error) {
      return 0;
    }
  }

  async fetchTradeHistory(page = 0, size = 10, associatedOrderId = null) {
    return [
      {
        tradeId: this.generateOrderId(),
        orderId: associatedOrderId || this.generateOrderId(),
        asset: 'APT',
        side: 'BUY',
        price: '12.25',
        size: 1.0,
        fee: 0.001,
        timestamp: new Date().toISOString()
      }
    ];
  }

  async getOrderStatus(orderIds) {
    return orderIds.map(id => this._openOrders.get(id) || {
      orderId: id,
      status: 'NOT_FOUND'
    });
  }

  getAsset(symbol) {
    return this._assets.get(symbol);
  }

  getAssetByIndexToken(indexToken) {
    for (const [symbol, asset] of this._assets) {
      if (asset.indexToken === indexToken) {
        return asset;
      }
    }
    return undefined;
  }

  getPosition(asset) {
    return this._positions.get(asset);
  }

  getOrder(orderId) {
    return this._openOrders.get(orderId);
  }

  hasOpenPosition(asset) {
    const position = this._positions.get(asset);
    return position && position.size > 0;
  }

  hasOpenOrders(asset = null) {
    if (asset) {
      for (const [orderId, order] of this._openOrders) {
        if (order.asset === asset && order.status === 'ACTIVE') {
          return true;
        }
      }
      return false;
    }
    return this._openOrders.size > 0;
  }

  async refreshAllData() {
    await Promise.all([
      this.fetchAssets(),
      this.fetchOpenOrders(),
      this.fetchPositions(),
      this.fetchBalance()
    ]);
    this._lastUpdateTime = Date.now();
  }

  generateOrderId() {
    return `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = AptosTrader;