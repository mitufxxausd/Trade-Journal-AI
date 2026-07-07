/**
 * Summary Service
 * High-level service for trade summarization
 */

import type { AIRequestOptions, AIResponse } from "../types/common";
import { providerRegistry } from "../providers/registry";
import { isSummaryProvider } from "../providers/interfaces";

class SummaryService {
  private getProvider() {
    const provider = providerRegistry.getPrimaryForCapability("summary");
    if (!provider || !isSummaryProvider(provider)) {
      throw new SummaryError("No summary provider available");
    }
    return provider;
  }

  async summarizeTrade(tradeId: string, options?: AIRequestOptions): Promise<AIResponse<string>> {
    const provider = this.getProvider();
    return provider.summarizeTrade(tradeId, options);
  }

  async summarizeTrades(tradeIds: string[], options?: AIRequestOptions): Promise<AIResponse<string>> {
    const provider = this.getProvider();
    return provider.summarizeTrades(tradeIds, options);
  }
}

class SummaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SummaryError";
  }
}

export const summaryService = new SummaryService();
export { SummaryService, SummaryError };
