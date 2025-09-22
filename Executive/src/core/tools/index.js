const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

function registerTools(server, aptosClient) {
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