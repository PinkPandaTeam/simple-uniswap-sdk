import { ETH } from "../../common/tokens";
import { ChainId } from "../../enums/chain-id";
import { UniswapVersion } from "../../enums/uniswap-version";
import { MockEthereumAddress } from "../../mocks/ethereum-address.mock";
import { MOCKFUN } from "../../mocks/fun-token.mock";
import { UniswapPairContextForChainId } from "./models/uniswap-pair-contexts";
import { UniswapPairSettings } from "./models/uniswap-pair-settings";
import { UniswapPair } from "./uniswap-pair";
import { UniswapPairContractFactoryPublicV2 } from "./v2/uniswap-pair-contract.factory.public.v2";
import { UniswapPairContractV2 } from "./v2/uniswap-pair-contract.v2";
import Big from "big.js";
import { BigNumber } from "ethers";

const calculateTrade = (
  poolA: BigNumber,
  poolB: BigNumber,
  tradeInput: BigNumber
) => {
  const _poolA = new Big(poolA.toString());
  const _poolB = new Big(poolB.toString());
  const input = new Big(tradeInput.toString());

  console.log("poolA: ", poolA.toString());
  console.log("poolB: ", poolB.toString());
  // constant prduct is the starting value of the A side of the pool
  const CP = new Big(_poolA.toString());

  const marketPrice = _poolA.div(_poolB);
  const newPoolA = _poolA.add(input);

  console.log(
    "new pool => ",
    newPoolA.toString(),
    _poolA.toString(),
    input.toString(),
    newPoolA.cmp(_poolA)
  );

  const x = CP.div(newPoolA);
  console.log("x => ", x.toString());
  const newPoolB = x.mul(_poolB);
  const recieve = _poolB.sub(newPoolB);

  console.log(
    "=> ",
    recieve.toString(),
    _poolB.toString(),
    newPoolB.toString()
  );

  const newMarketPrice = input.div(recieve);

  const priceDifference = newMarketPrice.sub(marketPrice);

  const priceImpact = priceDifference.div(marketPrice).mul(100);

  return {
    oldMarketPrice: marketPrice.toString(),
    newMarketPrice: newMarketPrice.toString(),
    recieve: recieve.toString(),
    priceImpact: priceImpact.toString(),
  };
};

describe("playground tests", () => {
  it("creates a pair", async () => {
    const context: UniswapPairContextForChainId = {
      fromTokenContractAddress: "0x6b175474e89094c44da98b954eedeac495271d0f",
      toTokenContractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      ethereumAddress: MockEthereumAddress(),
      chainId: ChainId.MAINNET,
      settings: new UniswapPairSettings({
        uniswapVersions: [UniswapVersion.v2],
        // cloneUniswapContractDetails: {
        //   v2Override: {
        //     routerAddress: "",
        //     factoryAddress: "",
        //     pairAddress: "",
        //   },
        // },
      }),
    };

    // console.log("context: ", context);
    const uniswapPair = new UniswapPair(context);

    const factory = await uniswapPair.createFactory();
    // console.log("factory: ", factory);

    const tradeCtx = await factory.trade("1");
    // console.log("trade ctx: ", tradeCtx);

    const pairFactory = new UniswapPairContractFactoryPublicV2({
      chainId: ChainId.MAINNET,
    });

    const pairAddress = await pairFactory.getPair(
      context.fromTokenContractAddress,
      context.toTokenContractAddress
    );

    console.log("pair addr:", pairAddress);

    const pairContract = new UniswapPairContractV2(
      uniswapPair.provider(),
      pairAddress
    );

    const reserves = await pairContract.getReserves();
    console.log("reserves: ", reserves);
    console.log("timestamp: ", reserves.timestamp);

    // const tradeData = calculateTrade(
    //   reserves.tokenA,
    //   reserves.tokenB,
    //   BigNumber.from(100000)
    //   // BigNumber.from(1000),
    //   // BigNumber.from(1000),
    //   // BigNumber.from(1000)
    // );

    // console.log("trade data: ", tradeData);
    // pairContract.subsribeSwap((aIn, aOut, bIn, bOut, to) => {
    //   console.log("got event: ", aIn, aOut, bIn, bOut);
    // });

    // tradeCtx.quoteChanged$.subscribe({
    //     next(ctx) { console.log("quote changed!", ctx) },
    //     error(err: Error) { console.log("there was an error", err) },
    //     complete() {
    //         console.log("completed")
    //     }
    // })

    // expect(factory.fromToken).toEqual(ETH.MAINNET());
    // expect(factory.toToken).toEqual(MOCKFUN());
  });
});
