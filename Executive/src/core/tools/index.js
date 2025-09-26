const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const GroqDecisionEngine = require('../../services/GroqDecisionEngine.js');
const { config } = require('../../services/config.js');

function registerTools(server, aptosClient) {
  const decisionEngine = new GroqDecisionEngine(config.groqApiKey);
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "place_limit_order",
          description: "Place a limit order for a specific asset",
          inputSchema: {
            type: "object",
            properties: {
              asset: { type: "string", description: "Asset symbol" },
              isBuy: { type: "boolean", description: "True for buy, false for sell" },
              price: { type: "string", description: "Order price" },
              size: { type: "number", description: "Order size" },
              leverage: { type: "number", description: "Leverage (optional)" },
              reduceOnly: { type: "boolean", description: "Reduce only flag (optional)" }
            },
            required: ["asset", "isBuy", "price", "size"]
          }
        },
        {
          name: "place_market_order",
          description: "Place a market order for a specific asset",
          inputSchema: {
            type: "object",
            properties: {
              asset: { type: "string", description: "Asset symbol" },
              isBuy: { type: "boolean", description: "True for buy, false for sell" },
              size: { type: "number", description: "Order size" },
              leverage: { type: "number", description: "Leverage (optional)" },
              slippage: { type: "number", description: "Slippage tolerance (optional)" },
              reduceOnly: { type: "boolean", description: "Reduce only flag (optional)" }
            },
            required: ["asset", "isBuy", "size"]
          }
        },
        {
          name: "cancel_order",
          description: "Cancel an existing order",
          inputSchema: {
            type: "object",
            properties: {
              orderId: { type: "string", description: "Order ID to cancel" }
            },
            required: ["orderId"]
          }
        },
        {
          name: "close_position",
          description: "Close an existing position",
          inputSchema: {
            type: "object",
            properties: {
              asset: { type: "string", description: "Asset symbol" },
              closePrice: { type: "string", description: "Close price" },
              quantity: { type: "number", description: "Quantity to close (optional)" }
            },
            required: ["asset", "closePrice"]
          }
        },
        {
          name: "add_collateral",
          description: "Add collateral to a position",
          inputSchema: {
            type: "object",
            properties: {
              asset: { type: "string", description: "Asset symbol" },
              collateral: { type: "number", description: "Collateral amount" },
              isBuy: { type: "boolean", description: "Position side" }
            },
            required: ["asset", "collateral", "isBuy"]
          }
        },
        {
          name: "remove_collateral",
          description: "Remove collateral from a position",
          inputSchema: {
            type: "object",
            properties: {
              asset: { type: "string", description: "Asset symbol" },
              collateral: { type: "number", description: "Collateral amount" },
              isBuy: { type: "boolean", description: "Position side" }
            },
            required: ["asset", "collateral", "isBuy"]
          }
        },
        {
          name: "set_take_profit",
          description: "Set take profit for a position",
          inputSchema: {
            type: "object",
            properties: {
              asset: { type: "string", description: "Asset symbol" },
              takeProfitPrice: { type: "string", description: "Take profit price" },
              size: { type: "string", description: "Position size" },
              isBuy: { type: "boolean", description: "Position side" }
            },
            required: ["asset", "takeProfitPrice", "size", "isBuy"]
          }
        },
        {
          name: "set_stop_loss",
          description: "Set stop loss for a position",
          inputSchema: {
            type: "object",
            properties: {
              asset: { type: "string", description: "Asset symbol" },
              stopLossPrice: { type: "string", description: "Stop loss price" },
              size: { type: "string", description: "Position size" },
              isBuy: { type: "boolean", description: "Position side" }
            },
            required: ["asset", "stopLossPrice", "size", "isBuy"]
          }
        },
        {
          name: "analyze_market_and_decide",
          description: "Use AI to analyze market conditions and make trading decisions",
          inputSchema: {
            type: "object",
            properties: {
              marketData: { type: "object", description: "Current market data" },
              includeRiskAnalysis: { type: "boolean", description: "Include risk analysis" }
            }
          }
        },
        {
          name: "generate_execution_plan",
          description: "Generate detailed execution plan for trading decisions",
          inputSchema: {
            type: "object",
            properties: {
              decision: { type: "object", description: "Trading decision object" },
              availableLiquidity: { type: "number", description: "Available liquidity in APT" }
            },
            required: ["decision", "availableLiquidity"]
          }
        },
        {
          name: "evaluate_risk_parameters",
          description: "Evaluate and adjust risk parameters for positions",
          inputSchema: {
            type: "object",
            properties: {
              position: { type: "object", description: "Position data" },
              marketVolatility: { type: "number", description: "Market volatility percentage" },
              vaultExposure: { type: "number", description: "Vault exposure percentage" }
            },
            required: ["position", "marketVolatility", "vaultExposure"]
          }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result;

      switch (name) {
        case "place_limit_order":
          result = await aptosClient.placeLimitOrder(
            args.asset,
            args.isBuy,
            args.price,
            args.size,
            args.leverage,
            args.reduceOnly
          );
          break;

        case "place_market_order":
          result = await aptosClient.placeMarketOrder(
            args.asset,
            args.isBuy,
            args.size,
            args.leverage,
            args.slippage,
            args.reduceOnly
          );
          break;

        case "cancel_order":
          result = await aptosClient.cancelOrder(args.orderId);
          break;

        case "close_position":
          result = await aptosClient.closePosition(
            args.asset,
            args.closePrice,
            args.quantity
          );
          break;

        case "add_collateral":
          result = await aptosClient.addCollateral(
            args.asset,
            args.collateral,
            args.isBuy
          );
          break;

        case "remove_collateral":
          result = await aptosClient.removeCollateral(
            args.asset,
            args.collateral,
            args.isBuy
          );
          break;

        case "set_take_profit":
          result = await aptosClient.setTakeProfit(
            args.asset,
            args.takeProfitPrice,
            args.size,
            args.isBuy
          );
          break;

        case "set_stop_loss":
          result = await aptosClient.setStopLoss(
            args.asset,
            args.stopLossPrice,
            args.size,
            args.isBuy
          );
          break;

        case "analyze_market_and_decide":
          const vaultStats = await aptosClient.aptos.view({
            function: `${aptosClient.vaultAddress}::vault::get_vault_state`,
            arguments: [aptosClient.vaultAddress],
            type_arguments: ['0x1::aptos_coin::AptosCoin'],
          });

          const positions = await aptosClient.fetchPositions();
          result = await decisionEngine.analyzeMarketConditions(
            args.marketData || {},
            vaultStats,
            positions
          );
          break;

        case "generate_execution_plan":
          const currentPositions = await aptosClient.fetchPositions();
          result = await decisionEngine.generateExecutionPlan(
            args.decision,
            currentPositions,
            args.availableLiquidity
          );
          break;

        case "evaluate_risk_parameters":
          result = await decisionEngine.evaluateRiskParameters(
            args.position,
            args.marketVolatility,
            args.vaultExposure
          );
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error executing ${name}: ${error.message}`
          }
        ],
        isError: true
      };
    }
  });
}

module.exports = { registerTools };