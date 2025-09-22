const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { Aptos, AptosConfig, Network } = require('@aptos-labs/ts-sdk');
const https = require('https');
const http = require('http');

const VAULT_ADDRESS = '0xe22a7dbf85b88f1c950b96923e29f0213121002f296c0572549f2a6a7e7fd6f5';

class HyperfillMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'hyperfill-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_vault_stats',
            description: 'Get current vault statistics including total assets, shares, and user balances',
            inputSchema: {
              type: 'object',
              properties: {
                user_address: {
                  type: 'string',
                  description: 'User address to get specific stats for (optional)',
                },
              },
            },
          },
          {
            name: 'get_market_data',
            description: 'Get current market data for APT and other tokens',
            inputSchema: {
              type: 'object',
              properties: {
                token_address: {
                  type: 'string',
                  description: 'Token address to get price for',
                },
              },
            },
          },
          {
            name: 'check_arbitrage_opportunities',
            description: 'Check for arbitrage opportunities across different DEXs',
            inputSchema: {
              type: 'object',
              properties: {
                min_profit_threshold: {
                  type: 'number',
                  description: 'Minimum profit threshold in APT',
                  default: 0.01,
                },
              },
            },
          },
          {
            name: 'execute_vault_action',
            description: 'Execute actions on the vault (deposit, withdraw, allocate funds)',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['deposit', 'withdraw', 'allocate', 'return_funds'],
                  description: 'Action to execute',
                },
                amount: {
                  type: 'string',
                  description: 'Amount in APT (for relevant actions)',
                },
                recipient: {
                  type: 'string',
                  description: 'Recipient address (for allocate action)',
                },
              },
              required: ['action'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_vault_stats':
            return await this.getVaultStats(args?.user_address);

          case 'get_market_data':
            return await this.getMarketData(args?.token_address);

          case 'check_arbitrage_opportunities':
            return await this.checkArbitrageOpportunities(args?.min_profit_threshold || 0.01);

          case 'execute_vault_action':
            return await this.executeVaultAction(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async getVaultStats(userAddress) {
    try {
      const [totalAssets, totalShares, sharePrice, availableAssets, minDeposit, isPaused] = await Promise.all([
        this.aptos.view({
          function: `${VAULT_ADDRESS}::hyperfill_vault::get_total_assets`,
          arguments: [VAULT_ADDRESS],
          type_arguments: [],
        }),
        this.aptos.view({
          function: `${VAULT_ADDRESS}::hyperfill_vault::get_total_shares`,
          arguments: [VAULT_ADDRESS],
          type_arguments: [],
        }),
        this.aptos.view({
          function: `${VAULT_ADDRESS}::hyperfill_vault::get_share_price`,
          arguments: [VAULT_ADDRESS],
          type_arguments: [],
        }),
        this.aptos.view({
          function: `${VAULT_ADDRESS}::hyperfill_vault::get_available_assets`,
          arguments: [VAULT_ADDRESS],
          type_arguments: [],
        }),
        this.aptos.view({
          function: `${VAULT_ADDRESS}::hyperfill_vault::get_min_deposit`,
          arguments: [VAULT_ADDRESS],
          type_arguments: [],
        }),
        this.aptos.view({
          function: `${VAULT_ADDRESS}::hyperfill_vault::is_paused`,
          arguments: [VAULT_ADDRESS],
          type_arguments: [],
        }),
      ]);

      let userShares = null;
      if (userAddress) {
        const userSharesResult = await this.aptos.view({
          function: `${VAULT_ADDRESS}::hyperfill_vault::get_user_shares`,
          arguments: [VAULT_ADDRESS, userAddress],
          type_arguments: [],
        });
        userShares = (parseInt(userSharesResult[0]) / 100000000).toFixed(4);
      }

      const stats = {
        total_assets_apt: (parseInt(totalAssets[0]) / 100000000).toFixed(4),
        total_shares: (parseInt(totalShares[0]) / 100000000).toFixed(4),
        share_price_apt: (parseInt(sharePrice[0]) / 1000000000000000000).toFixed(6),
        available_assets_apt: (parseInt(availableAssets[0]) / 100000000).toFixed(4),
        min_deposit_apt: (parseInt(minDeposit[0]) / 100000000).toFixed(4),
        is_paused: isPaused[0],
        user_shares: userShares,
        timestamp: new Date().toISOString(),
      };

      return {
        content: [
          {
            type: 'text',
            text: `Vault Statistics:\n${JSON.stringify(stats, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get vault stats: ${error.message}`);
    }
  }

  async getMarketData(tokenAddress = '0x1::aptos_coin::AptosCoin') {
    try {
      const aptPrice = await this.fetchAptPrice();

      const data = {
        price_usd: aptPrice.price_usd,
        price_change_24h: aptPrice.price_change_24h,
        volume_24h: aptPrice.volume_24h,
        market_cap: aptPrice.market_cap,
        highest_bid: aptPrice.price_usd * 0.999,
        lowest_ask: aptPrice.price_usd * 1.001,
        spread_percentage: 0.2,
      };

      return {
        content: [
          {
            type: 'text',
            text: `Market Data for ${tokenAddress}:\n${JSON.stringify({
              ...data,
              timestamp: new Date().toISOString(),
            }, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      const fallbackData = {
        price_usd: 12.50,
        price_change_24h: 2.5,
        volume_24h: 150000000,
        market_cap: 5000000000,
        highest_bid: 12.49,
        lowest_ask: 12.51,
        spread_percentage: 0.16,
      };

      return {
        content: [
          {
            type: 'text',
            text: `Market Data for ${tokenAddress} (fallback):\n${JSON.stringify({
              ...fallbackData,
              timestamp: new Date().toISOString(),
              note: 'Using fallback data due to API error',
            }, null, 2)}`,
          },
        ],
      };
    }
  }

  async fetchAptPrice() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.coingecko.com',
        path: '/api/v3/simple/price?ids=aptos&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true',
        method: 'GET',
        headers: {
          'User-Agent': 'HyperFill-Aptos/1.0.0'
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

  async checkArbitrageOpportunities(minProfitThreshold) {
    const mockOpportunities = [
      {
        dex_pair: 'PancakeSwap APT/USDC vs Thala APT/USDC',
        price_difference: 0.15,
        potential_profit_apt: 0.05,
        volume_available: 100,
        execution_complexity: 'medium',
      },
      {
        dex_pair: 'Liquidswap APT/BTC vs Aries APT/BTC',
        price_difference: 0.08,
        potential_profit_apt: 0.02,
        volume_available: 50,
        execution_complexity: 'high',
      },
    ];

    const viableOpportunities = mockOpportunities.filter(
      op => op.potential_profit_apt >= minProfitThreshold
    );

    return {
      content: [
        {
          type: 'text',
          text: `Arbitrage Opportunities (min profit: ${minProfitThreshold} APT):\n${JSON.stringify({
            opportunities: viableOpportunities,
            total_opportunities: viableOpportunities.length,
            timestamp: new Date().toISOString(),
          }, null, 2)}`,
        },
      ],
    };
  }

  async executeVaultAction(args) {
    const { action, amount, recipient } = args;

    const simulationResults = {
      deposit: {
        action: 'deposit',
        amount_apt: amount,
        estimated_shares: amount ? (parseFloat(amount) * 0.99).toFixed(4) : '0',
        gas_estimate: '0.001',
        success_probability: '95%',
      },
      withdraw: {
        action: 'withdraw',
        estimated_apt: amount || 'all_shares',
        withdrawal_fee: '0.1%',
        gas_estimate: '0.0015',
        success_probability: '98%',
      },
      allocate: {
        action: 'allocate_funds',
        amount_apt: amount,
        recipient: recipient,
        gas_estimate: '0.002',
        success_probability: '90%',
      },
      return_funds: {
        action: 'return_funds',
        amount_apt: amount,
        gas_estimate: '0.0018',
        success_probability: '95%',
      },
    };

    const result = simulationResults[action] || { error: 'Unknown action' };

    return {
      content: [
        {
          type: 'text',
          text: `Vault Action Simulation:\n${JSON.stringify({
            ...result,
            timestamp: new Date().toISOString(),
            note: 'This is a simulation. Actual execution requires transaction signing.',
          }, null, 2)}`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new HyperfillMCPServer();
server.run().catch(console.error);