const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

function registerTools(server, marketManager) {
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "get_market_list",
          description: "Get list of available markets",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "get_market_data",
          description: "Get real-time market data for a specific market",
          inputSchema: {
            type: "object",
            properties: {
              marketName: { type: "string", description: "Market name" }
            },
            required: ["marketName"]
          }
        },
        {
          name: "get_order_book",
          description: "Get order book data for a specific market",
          inputSchema: {
            type: "object",
            properties: {
              marketName: { type: "string", description: "Market name" }
            },
            required: ["marketName"]
          }
        },
        {
          name: "get_market_analysis",
          description: "Get comprehensive market analysis including trends, volatility, and sentiment",
          inputSchema: {
            type: "object",
            properties: {
              marketName: { type: "string", description: "Market name" }
            },
            required: ["marketName"]
          }
        },
        {
          name: "analyze_trend",
          description: "Analyze market trend for a specific market",
          inputSchema: {
            type: "object",
            properties: {
              marketName: { type: "string", description: "Market name" }
            },
            required: ["marketName"]
          }
        },
        {
          name: "calculate_volatility",
          description: "Calculate market volatility metrics",
          inputSchema: {
            type: "object",
            properties: {
              marketName: { type: "string", description: "Market name" }
            },
            required: ["marketName"]
          }
        },
        {
          name: "analyze_sentiment",
          description: "Analyze market sentiment indicators",
          inputSchema: {
            type: "object",
            properties: {
              marketName: { type: "string", description: "Market name" }
            },
            required: ["marketName"]
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
        case "get_market_list":
          result = marketManager.getMarketList();
          break;

        case "get_market_data":
          const marketClient = marketManager.getMarketClient(args.marketName);
          if (!marketClient) {
            throw new Error(`Market client not found for ${args.marketName}`);
          }
          result = await marketClient.getMarketData();
          break;

        case "get_order_book":
          const orderBookClient = marketManager.getMarketClient(args.marketName);
          if (!orderBookClient) {
            throw new Error(`Market client not found for ${args.marketName}`);
          }
          result = await orderBookClient.getOrderBook();
          break;

        case "get_market_analysis":
          const analysisClient = marketManager.getMarketClient(args.marketName);
          if (!analysisClient) {
            throw new Error(`Market client not found for ${args.marketName}`);
          }
          result = await analysisClient.getMarketAnalysis();
          break;

        case "analyze_trend":
          const trendClient = marketManager.getMarketClient(args.marketName);
          if (!trendClient) {
            throw new Error(`Market client not found for ${args.marketName}`);
          }
          const marketData = await trendClient.getMarketData();
          result = {
            trend: trendClient.analyzeTrend(marketData),
            timestamp: new Date().toISOString()
          };
          break;

        case "calculate_volatility":
          const volatilityClient = marketManager.getMarketClient(args.marketName);
          if (!volatilityClient) {
            throw new Error(`Market client not found for ${args.marketName}`);
          }
          const volData = await volatilityClient.getMarketData();
          result = {
            volatility: volatilityClient.calculateVolatility(volData),
            timestamp: new Date().toISOString()
          };
          break;

        case "analyze_sentiment":
          const sentimentClient = marketManager.getMarketClient(args.marketName);
          if (!sentimentClient) {
            throw new Error(`Market client not found for ${args.marketName}`);
          }
          const sentData = await sentimentClient.getMarketData();
          result = {
            sentiment: sentimentClient.analyzeSentiment(sentData),
            timestamp: new Date().toISOString()
          };
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