package com.hedera.fullstack.infrastructure.api.traits;

/*
  Deals with how to locate logs (e.g. labels
  - we never deal directly with lags
 */
public interface LogAware {

    void getLogs();

    void getLogs(String containerName);
}
