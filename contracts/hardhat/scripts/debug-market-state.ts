import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Debugging Market State...\n");

  // Contract addresses (replace with actual deployed addresses)
  const MARKET_ADDRESS = "0x41d584e681e066d1f3319d14a320b8afa93400ca";
  const WDAG_ADDRESS = "0xA967CE077dD5beEc5aB4019E3714F4f6af5b5c08";

  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log("Using wallet:", signer.address);

  // Contract ABIs
  const wDAGABI = [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address, address) view returns (uint256)",
  ];

  const marketABI = [
    "function state() view returns (uint8)",
    "function startTime() view returns (uint256)",
    "function endTime() view returns (uint256)",
    "function qYes() view returns (uint256)",
    "function qNo() view returns (uint256)",
    "function liquidity() view returns (uint256)",
    "function price(bool) view returns (uint256)",
    "function _calculateCost(uint256, bool) view returns (uint256)",
  ];

  try {
    const wDAG = new ethers.Contract(WDAG_ADDRESS, wDAGABI, signer);
    const market = new ethers.Contract(MARKET_ADDRESS, marketABI, signer);

    // Check current state
    console.log("📊 MARKET STATE");
    console.log("===============");

    const [state, startTime, endTime, qYes, qNo, liquidity, currentTime] = await Promise.all([
      market.state(),
      market.startTime(),
      market.endTime(),
      market.qYes(),
      market.qNo(),
      market.liquidity(),
      ethers.provider.getBlock("latest").then(block => block.timestamp)
    ]);

    console.log("Market State:", ["Open", "Closed", "Resolved"][Number(state)]);
    console.log("Start Time:", new Date(Number(startTime) * 1000).toLocaleString());
    console.log("End Time:", new Date(Number(endTime) * 1000).toLocaleString());
    console.log("Current Time:", new Date(Number(currentTime) * 1000).toLocaleString());
    console.log("qYes (YES reserves):", ethers.formatEther(qYes));
    console.log("qNo (NO reserves):", ethers.formatEther(qNo));
    console.log("Liquidity:", ethers.formatEther(liquidity));

    // Check if market is in valid state for trading
    console.log("\n✅ VALIDATION CHECKS");
    console.log("===================");
    console.log("Market is open:", state === 0);
    console.log("Market has started:", currentTime >= Number(startTime));
    console.log("Market has ended:", currentTime >= Number(endTime));
    console.log("Can trade:", state === 0 && currentTime >= Number(startTime) && currentTime < Number(endTime));

    // Test cost calculation for 5 shares
    console.log("\n🧮 COST CALCULATION TEST");
    console.log("========================");
    
    const shares = ethers.parseEther("5");
    console.log("Shares to buy:", ethers.formatEther(shares));
    
    // Calculate cost manually
    const currentSupply = qYes; // For YES shares
    const totalLiquidity = liquidity * 2n;
    const cost = (shares * totalLiquidity) / currentSupply;
    
    console.log("Current YES supply:", ethers.formatEther(currentSupply));
    console.log("Total liquidity:", ethers.formatEther(totalLiquidity));
    console.log("Calculated cost:", ethers.formatEther(cost), "wDAG");
    
    // Check if this would cause underflow
    console.log("\n⚠️  UNDERFLOW CHECK");
    console.log("==================");
    console.log("qYes before trade:", ethers.formatEther(qYes));
    console.log("Shares to subtract:", ethers.formatEther(shares));
    console.log("qYes after trade would be:", ethers.formatEther(qYes - shares));
    console.log("Would cause underflow:", qYes < shares);

    // Check wDAG balance and allowance
    console.log("\n💰 WALLET STATE");
    console.log("===============");
    
    const [wDAGBalance, allowance] = await Promise.all([
      wDAG.balanceOf(signer.address),
      wDAG.allowance(signer.address, MARKET_ADDRESS)
    ]);

    console.log("wDAG Balance:", ethers.formatEther(wDAGBalance));
    console.log("Allowance:", ethers.formatEther(allowance));
    console.log("Has enough wDAG:", wDAGBalance >= cost);
    console.log("Has enough allowance:", allowance >= cost);

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

