import { BigNumber } from "bignumber.js";
import { ContractContext as PairContractContext } from "../../../ABI/types/uniswap-pair-v2-real";
import { EthersProvider } from "../../../ethers-provider";
import { UniswapContractContextV2 } from "../../../uniswap-contract-context/uniswap-contract-context-v2";

export interface PairReserves {
  tokenA: BigNumber;
  tokenB: BigNumber;
  timestamp: number;
}

interface SwapListener {
  (
    tokenAIn: BigNumber,
    tokenBIn: BigNumber,
    tokenAOut: BigNumber,
    tokenBOut: BigNumber,
    to: string
  ): void;
}

export class UniswapPairContractV2 {
  private _uniswapPair = this._ethersProvider.getContract<PairContractContext>(
    JSON.stringify(UniswapContractContextV2.pairAbiReal),
    this._pairAddress
  );

  constructor(
    private _ethersProvider: EthersProvider,
    private _pairAddress: string = UniswapContractContextV2.pairAddress
  ) {}

  public async getReserves(): Promise<PairReserves> {
    const resp = await this._uniswapPair.getReserves();
    return {
      tokenA: new BigNumber(resp[0].toString()),
      tokenB: new BigNumber(resp[1].toString()),
      timestamp: resp[2],
    };
  }

  public subsribeSwap(listener: SwapListener) {
    this._uniswapPair.addListener("Swap", listener);
  }

  public removeSwapListeners() {
    this._uniswapPair.removeAllListeners("Swap");
  }
}
