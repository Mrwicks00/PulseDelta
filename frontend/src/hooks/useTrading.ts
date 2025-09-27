import { useWriteContract, useAccount, useBalance } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import { config } from "@/configs";
import { MARKET_ABIS } from "@/lib/marketABIs";
import { CONTRACT_ADDRESSES, ABI } from "@/lib/abiAndAddress";
import { formatPrice } from "@/lib/utils";
import { toast } from "react-toastify";
import { useTradingHistory } from "@/hooks/useTradingHistory";
import type { Market } from "@/types/market";

interface TradingParams {
  market: Market;
  outcomeIndex: number;
  shares: string;
  isBuy: boolean;
}

interface TradingState {
  isTrading: boolean;
  error: string | null;
  txHash: `0x${string}` | null;
}

interface TradingResult {
  txHash: `0x${string}`;
  shares: number;
  cost: number;
  fee: number;
}

export function useTrading() {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { addTrade } = useTradingHistory();

  const [tradingState, setTradingState] = useState<TradingState>({
    isTrading: false,
    error: null,
    txHash: null,
  });

  // Get user's BDAG (native DAG) balance
  const { data: bDAGBalance } = useBalance({
    address: address,
  });

  // Calculate the cost of buying shares using AMM formula
  const calculateCost = useCallback(
    async (market: Market, outcomeIndex: number, shares: number) => {
      if (!market.address || shares <= 0) return { cost: 0, fee: 0 };

      try {
        console.log("Calculating cost for:", {
          market: market.address,
          outcomeIndex,
          shares,
        });

        const marketABIKey = `${market.type}Market` as keyof typeof MARKET_ABIS;

        // Get fee basis points from the market contract
        const feeBps = await readContract(config, {
          address: market.address as `0x${string}`,
          abi: MARKET_ABIS[marketABIKey],
          functionName: "feeBps",
        });

        console.log("Fee basis points from contract:", feeBps);

        // Get current price from the market contract
        const price = await readContract(config, {
          address: market.address as `0x${string}`,
          abi: MARKET_ABIS[marketABIKey],
          functionName: "price",
          args:
            market.type === "binary"
              ? [outcomeIndex === 0] // true for YES, false for NO
              : market.type === "multi"
              ? [outcomeIndex]
              : [outcomeIndex === 0], // true for LONG, false for SHORT
        });

        console.log("Price from contract:", price);

        const priceInWei = price as bigint;
        const priceInWdag = Number(priceInWei) / 1e18;

        console.log("Price in wDAG:", priceInWdag);

        // Calculate cost using simple formula (contract uses more complex AMM)
        const cost = shares * priceInWdag;

        // Calculate fee using contract's fee basis points
        const feeBpsNumber = Number(feeBps);
        const fee = (cost * feeBpsNumber) / 10000;

        console.log("Calculated cost:", { cost, fee, feeBps: feeBpsNumber });

        return { cost, fee };
      } catch (error) {
        console.error("Error calculating cost:", error);
        return { cost: 0, fee: 0 };
      }
    },
    []
  );

  // Execute the trade
  const executeTrade = useCallback(
    async (params: TradingParams): Promise<TradingResult> => {
      const { market, outcomeIndex, shares, isBuy } = params;

      if (!address) throw new Error("No wallet connected");
      if (!market.address) throw new Error("Invalid market address");
      if (!isBuy)
        throw new Error("Selling not implemented - use opposite outcome");

      setTradingState({ isTrading: true, error: null, txHash: null });

      try {
        const sharesNumber = parseFloat(shares);
        if (sharesNumber <= 0) throw new Error("Invalid shares amount");

        // Calculate cost
        const { cost, fee } = await calculateCost(
          market,
          outcomeIndex,
          sharesNumber
        );
        const totalCost = cost + fee;
        const totalCostWei = BigInt(Math.floor(totalCost * 1e18));

        console.log("Executing trade:", {
          market: market.address,
          type: market.type,
          outcomeIndex,
          shares: sharesNumber,
          totalCost,
          totalCostWei: totalCostWei.toString(),
        });

        const wDAGAddress = CONTRACT_ADDRESSES.wDAG;
        const wDAGAbi = ABI.wDAG;

        // Step 1: Check current wDAG balance
        const wDAGBalance = await readContract(config, {
          address: wDAGAddress as `0x${string}`,
          abi: wDAGAbi,
          functionName: "balanceOf",
          args: [address],
        });

        console.log("Current wDAG balance:", Number(wDAGBalance) / 1e18, "wDAG");

        // Step 2: Check current allowance
        const currentAllowance = await readContract(config, {
          address: wDAGAddress as `0x${string}`,
          abi: wDAGAbi,
          functionName: "allowance",
          args: [address, market.address],
        });

        console.log("Current allowance:", Number(currentAllowance) / 1e18, "wDAG");
        console.log("Required amount:", totalCost, "wDAG");

        // Step 3: Convert BDAG to wDAG only if needed
        if ((wDAGBalance as bigint) < totalCostWei) {
          const neededAmount = totalCostWei - (wDAGBalance as bigint);
          const bDAGBalance = bDAGBalance?.value || BigInt(0);
          
          if (bDAGBalance < neededAmount) {
            throw new Error(
              `Insufficient BDAG balance. Need ${formatPrice(
                Number(neededAmount) / 1e18
              )} BDAG to convert to wDAG but have ${formatPrice(Number(bDAGBalance) / 1e18)}`
            );
          }

          toast.info("Converting BDAG to wDAG...");

          const depositTxHash = await writeContractAsync({
            address: wDAGAddress as `0x${string}`,
            abi: wDAGAbi,
            functionName: "deposit",
            value: neededAmount,
          });

          console.log("Deposit transaction submitted:", depositTxHash);
          await waitForTransactionReceipt(config, { hash: depositTxHash });
          console.log("BDAG converted to wDAG");
        } else {
          console.log("Sufficient wDAG balance, skipping conversion");
        }

        // Step 4: Approve only if needed
        if ((currentAllowance as bigint) < totalCostWei) {
          toast.info("Approving market to spend wDAG...");

          const approveTxHash = await writeContractAsync({
            address: wDAGAddress as `0x${string}`,
            abi: wDAGAbi,
            functionName: "approve",
            args: [market.address, totalCostWei],
          });

          console.log("Approve transaction submitted:", approveTxHash);
          await waitForTransactionReceipt(config, { hash: approveTxHash });
          console.log("Market approved to spend wDAG");
        } else {
          console.log("Sufficient allowance already exists");
        }

        toast.info("Executing trade...");

        // Step 5: Execute the buy transaction (no value needed, uses transferFrom)
        let txHash: `0x${string}`;

        if (market.type === "binary") {
          // Binary market: buy(bool isYes, uint256 shares)
          txHash = await writeContractAsync({
            address: market.address as `0x${string}`,
            abi: MARKET_ABIS.binaryMarket,
            functionName: "buy",
            args: [outcomeIndex === 0, BigInt(Math.floor(sharesNumber * 1e18))],
            // No value - uses transferFrom
          });
        } else if (market.type === "multi") {
          // Multi market: buy(uint256 outcome, uint256 shares)
          txHash = await writeContractAsync({
            address: market.address as `0x${string}`,
            abi: MARKET_ABIS.multiMarket,
            functionName: "buy",
            args: [outcomeIndex, BigInt(Math.floor(sharesNumber * 1e18))],
            // No value - uses transferFrom
          });
        } else if (market.type === "scalar") {
          // Scalar market: buy(bool isLong, uint256 shares)
          txHash = await writeContractAsync({
            address: market.address as `0x${string}`,
            abi: MARKET_ABIS.scalarMarket,
            functionName: "buy",
            args: [outcomeIndex === 0, BigInt(Math.floor(sharesNumber * 1e18))],
            // No value - uses transferFrom
          });
        } else {
          throw new Error("Unsupported market type");
        }

        console.log("Trade transaction submitted:", txHash);

        // Wait for transaction to be confirmed
        await waitForTransactionReceipt(config, { hash: txHash });

        console.log("Trade confirmed:", txHash);

        // Record the trade in history
        if (market.address) {
          addTrade();
        }

        // Only show success toast after transaction is confirmed
        toast.success(
          "Trade successful! Your trade has been confirmed on the blockchain",
          {
            onClick: () =>
              window.open(`https://explorer.celo.org/tx/${txHash}`, "_blank"),
          }
        );

        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["markets"] });
        queryClient.invalidateQueries({ queryKey: ["userProfile", address] });

        setTradingState({ isTrading: false, error: null, txHash });

        return {
          txHash,
          shares: sharesNumber,
          cost,
          fee,
        };
      } catch (error) {
        console.error("Trade failed:", error);

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";

        setTradingState({
          isTrading: false,
          error: errorMessage,
          txHash: null,
        });

        toast.error(`Trade failed: ${errorMessage}`);
        throw error;
      }
    },
    [
      address,
      calculateCost,
      bDAGBalance,
      writeContractAsync,
      queryClient,
      addTrade,
    ]
  );

  // Reset trading state
  const resetTradingState = useCallback(() => {
    setTradingState({ isTrading: false, error: null, txHash: null });
  }, []);

  return {
    executeTrade,
    calculateCost,
    tradingState,
    resetTradingState,
    bDAGBalance: bDAGBalance ? Number(bDAGBalance.value) / 1e18 : 0,
  };
}
