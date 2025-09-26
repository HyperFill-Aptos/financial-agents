const Groq = require('groq-sdk');

class GroqDecisionEngine {
  constructor(apiKey) {
    this.groq = new Groq({ apiKey });
  }

  async analyzeMarketConditions(marketData, vaultStats, positions) {
    const prompt = `As the Executive Agent for HyperFill trading platform on Aptos, analyze the following data and provide trading decisions:

MARKET DATA:
${JSON.stringify(marketData, null, 2)}

VAULT STATS:
${JSON.stringify(vaultStats, null, 2)}

CURRENT POSITIONS:
${JSON.stringify(positions, null, 2)}

Based on this data, provide a strategic trading decision with the following format:
{
  "action": "buy|sell|hold|close_position|allocate_liquidity",
  "asset": "APT",
  "amount": number,
  "price": number,
  "confidence": number (0-1),
  "reasoning": "explanation of decision",
  "risk_level": "low|medium|high",
  "expected_profit": number,
  "stop_loss": number,
  "take_profit": number
}

Consider:
1. Market volatility and trends
2. Available liquidity in vault
3. Risk management principles
4. Profit optimization
5. Position sizing based on vault capacity`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert DeFi trading strategist for HyperFill on Aptos. Make data-driven decisions to maximize profits while managing risk. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama3-70b-8192",
        temperature: 0.3,
        max_tokens: 1000
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Error in Groq analysis:', error);
      return {
        action: "hold",
        asset: "APT",
        amount: 0,
        price: 0,
        confidence: 0.1,
        reasoning: "Error in AI analysis, defaulting to hold",
        risk_level: "low",
        expected_profit: 0,
        stop_loss: 0,
        take_profit: 0
      };
    }
  }

  async evaluateRiskParameters(position, marketVolatility, vaultExposure) {
    const prompt = `Evaluate risk parameters for a trading position:

POSITION:
${JSON.stringify(position, null, 2)}

MARKET VOLATILITY: ${marketVolatility}%
VAULT EXPOSURE: ${vaultExposure}%

Provide risk management recommendations:
{
  "position_size_adjustment": number (-1 to 1, where 0 = no change),
  "stop_loss_distance": number (percentage),
  "take_profit_distance": number (percentage),
  "max_exposure_percent": number,
  "risk_score": number (1-10),
  "recommendations": ["string array of specific actions"]
}`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a risk management specialist. Provide conservative, data-driven risk parameters to protect capital."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama3-8b-8192",
        temperature: 0.2,
        max_tokens: 500
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Error in risk evaluation:', error);
      return {
        position_size_adjustment: 0,
        stop_loss_distance: 5,
        take_profit_distance: 10,
        max_exposure_percent: 10,
        risk_score: 5,
        recommendations: ["Maintain current position", "Monitor market conditions"]
      };
    }
  }

  async generateExecutionPlan(decision, currentPositions, availableLiquidity) {
    const prompt = `Generate a detailed execution plan for this trading decision:

DECISION:
${JSON.stringify(decision, null, 2)}

CURRENT POSITIONS:
${JSON.stringify(currentPositions, null, 2)}

AVAILABLE LIQUIDITY: ${availableLiquidity} APT

Create a step-by-step execution plan:
{
  "steps": [
    {
      "order": number,
      "action": "string",
      "parameters": {},
      "estimated_gas": number,
      "success_probability": number
    }
  ],
  "total_estimated_cost": number,
  "execution_time_estimate": "string",
  "prerequisites": ["string array"],
  "risk_mitigation": ["string array"]
}`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an execution specialist. Create detailed, actionable plans for trading decisions on Aptos blockchain."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama3-8b-8192",
        temperature: 0.1,
        max_tokens: 800
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Error generating execution plan:', error);
      return {
        steps: [],
        total_estimated_cost: 0,
        execution_time_estimate: "Unknown",
        prerequisites: [],
        risk_mitigation: []
      };
    }
  }
}

module.exports = GroqDecisionEngine;