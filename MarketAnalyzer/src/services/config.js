const config = {
  account: '0x96d2b185a5b581f98dc1df57b59a5875eb53b3a65ef7a9b0d5e42aa44c3b8b82',
  agentPrivateKey: process.env.HYPERFILL_PRIVATE_KEY || '0x1824fec805082d0ec3416b0040e82729d01c2930b16460d8906c3499b0d535e0',
  agentWallet: '0x96d2b185a5b581f98dc1df57b59a5875eb53b3a65ef7a9b0d5e42aa44c3b8b82',
  vaultContractAddress: '0x96d2b185a5b581f98dc1df57b59a5875eb53b3a65ef7a9b0d5e42aa44c3b8b82',
  tradeSettlementAddress: '0x96d2b185a5b581f98dc1df57b59a5875eb53b3a65ef7a9b0d5e42aa44c3b8b82',
  groqApiKey: process.env.GROQ_API_KEY,
  network: 'testnet',
  defaultLeverage: 1.1,
  defaultSlippage: 5
};

module.exports = { config };