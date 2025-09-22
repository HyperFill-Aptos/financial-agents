const { spawn } = require('child_process');
const { EventEmitter } = require('events');

class HyperfillAIAgent extends EventEmitter {
  constructor() {
    super();
    this.mcpProcess = null;
    this.isRunning = false;
    this.requestId = 0;
    this.pendingRequests = new Map();
    this.strategies = {
      arbitrage: true,
      yield_farming: false,
      liquidity_provision: false,
    };
    this.riskParams = {
      max_position_size: 10.0,
      stop_loss_percent: 5.0,
      max_daily_trades: 20,
    };
  }

  async start() {
    if (this.isRunning) return;

    this.mcpProcess = spawn('node', ['server.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: __dirname,
    });

    this.mcpProcess.stdout.on('data', (data) => {
      this.handleMCPResponse(data.toString());
    });

    this.mcpProcess.stderr.on('data', (data) => {
      console.error('MCP Error:', data.toString());
    });

    this.mcpProcess.on('close', (code) => {
      console.log(`MCP process exited with code ${code}`);
      this.isRunning = false;
    });

    await this.initializeMCP();
    this.isRunning = true;
    this.startTradingLoop();
  }

  async initializeMCP() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  }

  async sendMCPRequest(method, params = {}) {
    const id = ++this.requestId;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      this.mcpProcess.stdin.write(JSON.stringify(request) + '\n');

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 10000);
    });
  }

  handleMCPResponse(data) {
    try {
      const lines = data.trim().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          const response = JSON.parse(line);
          if (response.id && this.pendingRequests.has(response.id)) {
            const { resolve, reject } = this.pendingRequests.get(response.id);
            this.pendingRequests.delete(response.id);

            if (response.error) {
              reject(new Error(response.error.message));
            } else {
              resolve(response.result);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error parsing MCP response:', error);
    }
  }

  async getVaultStats() {
    try {
      const result = await this.sendMCPRequest('tools/call', {
        name: 'get_vault_stats',
        arguments: {},
      });
      return this.parseToolResult(result);
    } catch (error) {
      console.error('Error getting vault stats:', error);
      return null;
    }
  }

  async checkArbitrageOpportunities() {
    try {
      const result = await this.sendMCPRequest('tools/call', {
        name: 'check_arbitrage_opportunities',
        arguments: {
          min_profit_threshold: 0.01,
        },
      });
      return this.parseToolResult(result);
    } catch (error) {
      console.error('Error checking arbitrage:', error);
      return null;
    }
  }

  async executeVaultAction(action, amount, recipient) {
    try {
      const result = await this.sendMCPRequest('tools/call', {
        name: 'execute_vault_action',
        arguments: {
          action,
          amount: amount?.toString(),
          recipient,
        },
      });
      return this.parseToolResult(result);
    } catch (error) {
      console.error('Error executing vault action:', error);
      return null;
    }
  }

  parseToolResult(result) {
    if (result && result.content && result.content[0] && result.content[0].text) {
      try {
        const lines = result.content[0].text.split('\n');
        const jsonLine = lines.find(line => line.includes('{'));
        if (jsonLine) {
          return JSON.parse(jsonLine.substring(jsonLine.indexOf('{')));
        }
      } catch (error) {
        console.error('Error parsing tool result:', error);
      }
    }
    return result;
  }

  async analyzeMarketConditions() {
    const vaultStats = await this.getVaultStats();
    const arbitrageOpps = await this.checkArbitrageOpportunities();

    if (!vaultStats || !arbitrageOpps) {
      return { action: 'wait', reason: 'insufficient_data' };
    }

    console.log('Vault Stats:', vaultStats);
    console.log('Arbitrage Opportunities:', arbitrageOpps);

    if (vaultStats.is_paused) {
      return { action: 'wait', reason: 'vault_paused' };
    }

    const availableAssets = parseFloat(vaultStats.available_assets_apt);
    if (availableAssets < 1.0) {
      return { action: 'wait', reason: 'insufficient_liquidity' };
    }

    if (arbitrageOpps.opportunities && arbitrageOpps.opportunities.length > 0) {
      const bestOpp = arbitrageOpps.opportunities[0];
      if (bestOpp.potential_profit_apt >= 0.05) {
        return {
          action: 'execute_arbitrage',
          opportunity: bestOpp,
          suggested_amount: Math.min(availableAssets * 0.1, 5.0),
        };
      }
    }

    return { action: 'wait', reason: 'no_profitable_opportunities' };
  }

  async executeTradeDecision(decision) {
    console.log('Trade Decision:', decision);

    switch (decision.action) {
      case 'execute_arbitrage':
        console.log(`Executing arbitrage for ${decision.suggested_amount} APT`);

        const allocationResult = await this.executeVaultAction(
          'allocate',
          decision.suggested_amount,
          '0xe22a7dbf85b88f1c950b96923e29f0213121002f296c0572549f2a6a7e7fd6f5'
        );

        if (allocationResult) {
          console.log('Allocation simulation:', allocationResult);

          setTimeout(async () => {
            const profit = decision.suggested_amount * 0.02;
            const returnAmount = decision.suggested_amount + profit;

            const returnResult = await this.executeVaultAction(
              'return_funds',
              returnAmount
            );

            if (returnResult) {
              console.log(`Returned ${returnAmount} APT with ${profit} APT profit`);
              this.emit('trade_completed', {
                type: 'arbitrage',
                profit_apt: profit,
                amount_traded: decision.suggested_amount,
              });
            }
          }, 5000);
        }
        break;

      case 'wait':
        console.log(`Waiting: ${decision.reason}`);
        break;

      default:
        console.log('Unknown action:', decision.action);
    }
  }

  async startTradingLoop() {
    console.log('Starting trading loop...');

    const tradingInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(tradingInterval);
        return;
      }

      try {
        const decision = await this.analyzeMarketConditions();
        await this.executeTradeDecision(decision);
      } catch (error) {
        console.error('Error in trading loop:', error);
      }
    }, 30000);

    this.on('trade_completed', (trade) => {
      console.log('Trade completed:', trade);
    });
  }

  async stop() {
    this.isRunning = false;
    if (this.mcpProcess) {
      this.mcpProcess.kill();
    }
  }
}

async function main() {
  const agent = new HyperfillAIAgent();

  process.on('SIGINT', async () => {
    console.log('Shutting down agent...');
    await agent.stop();
    process.exit(0);
  });

  await agent.start();
  console.log('HyperFill AI Agent started successfully');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { HyperfillAIAgent };