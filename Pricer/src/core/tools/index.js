const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

function registerTools(server, aptosClient) {
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "fetch_assets",
          description: "Fetch available trading assets",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "fetch_open_orders",
          description: "Fetch open orders for a specific asset",
          inputSchema: {
            type: "object",
            properties: {
              asset: { type: "string", description: "Asset symbol (optional)" },
              side: { type: "string", enum: ["BUY", "SELL"], description: "Order side (optional)" },
              page: { type: "number", description: "Page number (default: 0)" },
              size: { type: "number", description: "Page size (default: 10)" }
            }
          }
        },
        {
          name: "fetch_positions",
          description: "Fetch current trading positions",
          inputSchema: {
            type: "object",
            properties: {
              page: { type: "number", description: "Page number (default: 0)" },
              size: { type: "number", description: "Page size (default: 10)" }
            }
          }
        },
        {
          name: "fetch_balance",
          description: "Fetch account balance",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "fetch_trade_history",
          description: "Fetch trade history",
          inputSchema: {
            type: "object",
            properties: {
              page: { type: "number", description: "Page number (default: 0)" },
              size: { type: "number", description: "Page size (default: 10)" },
              associatedOrderId: { type: "string", description: "Associated order ID (optional)" }
            }
          }
        },
        {
          name: "get_order_status",
          description: "Get status of specific orders",
          inputSchema: {
            type: "object",
            properties: {
              orderIds: { type: "array", items: { type: "string" }, description: "Array of order IDs" }
            },
            required: ["orderIds"]
          }
        },
        {
          name: "get_asset",
          description: "Get asset information by symbol",
          inputSchema: {
            type: "object",
            properties: {
              symbol: { type: "string", description: "Asset symbol" }
            },
            required: ["symbol"]
          }
        },
        {
          name: "get_position",
          description: "Get position information for an asset",
          inputSchema: {
            type: "object",
            properties: {
              asset: { type: "string", description: "Asset symbol" }
            },
            required: ["asset"]
          }
        },
        {
          name: "has_open_position",
          description: "Check if there's an open position for an asset",
          inputSchema: {
            type: "object",
            properties: {
              asset: { type: "string", description: "Asset symbol" }
            },
            required: ["asset"]
          }
        },
        {
          name: "has_open_orders",
          description: "Check if there are open orders",
          inputSchema: {
            type: "object",
            properties: {
              asset: { type: "string", description: "Asset symbol (optional)" }
            }
          }
        },
        {
          name: "refresh_all_data",
          description: "Refresh all portfolio data",
          inputSchema: {
            type: "object",
            properties: {}
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
        case "fetch_assets":
          result = await aptosClient.fetchAssets();
          break;

        case "fetch_open_orders":
          result = await aptosClient.fetchOpenOrders(
            args.asset,
            args.side,
            args.page || 0,
            args.size || 10
          );
          break;

        case "fetch_positions":
          result = await aptosClient.fetchPositions(
            args.page || 0,
            args.size || 10
          );
          break;

        case "fetch_balance":
          result = await aptosClient.fetchBalance();
          break;

        case "fetch_trade_history":
          result = await aptosClient.fetchTradeHistory(
            args.page || 0,
            args.size || 10,
            args.associatedOrderId
          );
          break;

        case "get_order_status":
          result = await aptosClient.getOrderStatus(args.orderIds);
          break;

        case "get_asset":
          result = aptosClient.getAsset(args.symbol);
          break;

        case "get_position":
          result = aptosClient.getPosition(args.asset);
          break;

        case "has_open_position":
          result = aptosClient.hasOpenPosition(args.asset);
          break;

        case "has_open_orders":
          result = aptosClient.hasOpenOrders(args.asset);
          break;

        case "refresh_all_data":
          await aptosClient.refreshAllData();
          result = { success: true, timestamp: new Date().toISOString() };
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