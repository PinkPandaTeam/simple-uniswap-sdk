import { EthersProvider } from "../..";
import {
  PairReserves,
  UniswapPairContractV2,
} from "./v2/uniswap-pair-contract.v2";
import { UniswapPairContractFactoryPublicV2 } from "./v2/uniswap-pair-contract.factory.public.v2";
import BigNumber from "bignumber.js";
import { Quote } from "./models/trade-calculator";
import Big from "big.js";

export class UniswapPairCalculator {
  pairFactory: UniswapPairContractFactoryPublicV2;
  provider: EthersProvider;
  pairContract?: UniswapPairContractV2;
  fromAddr: string;
  toAddr: string;
  reserves?: PairReserves;

  constructor(provider: EthersProvider, fromAddr: string, toAddr: string) {
    this.pairFactory = new UniswapPairContractFactoryPublicV2(
      provider._providerContext
    );
    this.provider = provider;
    this.fromAddr = fromAddr;
    this.toAddr = toAddr;
  }

  public async init() {
    const pairAddress = await this.pairFactory.getPair(
      this.fromAddr,
      this.toAddr
    );
    this.pairContract = new UniswapPairContractV2(this.provider, pairAddress);
    // refresh reserves any time there is a swap on the pair contract
    this.pairContract.subsribeSwap(this.setReserves);
    await this.setReserves();
  }

  public async setReserves() {
    if (this.pairContract) {
      this.reserves = await this.pairContract.getReserves();
    }
  }

  public cleanup() {
    if (this.pairContract) {
      this.pairContract.removeSwapListeners();
    }
  }

  private calculateTrade(
    poolA: BigNumber,
    poolB: BigNumber,
    tradeInput: BigNumber
  ): Quote {
    const _poolA = new Big(poolA.toString());
    const _poolB = new Big(poolB.toString());
    const input = new Big(tradeInput.toString());

    // constant prduct is the starting value of the A side of the pool
    const CP = new Big(_poolA.toString());

    const marketPrice = _poolA.div(_poolB);
    const newPoolA = _poolA.add(input);
    const newPoolB = CP.div(newPoolA).mul(_poolB);
    const recieve = _poolB.sub(newPoolB);
    const newMarketPrice = input.div(recieve);

    const priceDifference = newMarketPrice.sub(marketPrice);

    const priceImpact = priceDifference.div(marketPrice).mul(100);

    return {
      oldMarketPrice: marketPrice,
      newMarketPrice: newMarketPrice,
      recieve: recieve,
      priceImpact: priceImpact,
    };
  }

  public quote(input: BigNumber) {
    if (
      !this.reserves ||
      !this.reserves.byAddress[this.fromAddr] ||
      !this.reserves.byAddress[this.toAddr]
    ) {
      throw new Error("invalid reserves");
    }

    return this.calculateTrade(
      this.reserves.byAddress[this.fromAddr],
      this.reserves.byAddress[this.toAddr],
      input
    );
  }

  public reverseQuote(input: BigNumber) {
    if (
      !this.reserves ||
      !this.reserves.byAddress[this.fromAddr] ||
      !this.reserves.byAddress[this.toAddr]
    ) {
      throw new Error("invalid reserves");
    }

    return this.calculateTrade(
      this.reserves.byAddress[this.toAddr],
      this.reserves.byAddress[this.fromAddr],
      input
    );
  }
}
