const ExecutiveApp = require("./Executive/src/server/server");
const AnalyzerApp = require("./MarketAnalyzer/src/server/server");
const PricerApp = require("./Pricer/src/server/server");

async function main() {
    const mcp_servers = [ExecutiveApp, AnalyzerApp, PricerApp];

    mcp_servers.map((server, index) => {
        let port = (index + 1) * 1000;
        server.listen(port, () => {
            console.log(server.get("name") + " MCP server listening on :" + port);
        });
    });

    console.log("HyperFill Multi-Agent System Started:");
    console.log("- Executive Agent (Order Execution): http://localhost:1000");
    console.log("- Market Analyzer Agent: http://localhost:2000");
    console.log("- Pricer Agent (Portfolio & Risk): http://localhost:3000");
}

main().then(res => {
    console.log("All agents initialized successfully");
}).catch(err => {
    console.log("Error starting agents:", err);
});