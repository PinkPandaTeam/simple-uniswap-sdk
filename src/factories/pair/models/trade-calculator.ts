import { BigNumber } from "bignumber.js";
import Big from "big.js";

export interface Quote {
  oldMarketPrice: Big;
  newMarketPrice: Big;
  recieve: Big;
  priceImpact: Big;
}

export interface TradeCalculator {
  quote: (input: BigNumber) => Quote;
  reverseQuote: (input: BigNumber) => Quote;
}
