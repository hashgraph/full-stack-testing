package com.swirldslabs.fullstacktest.api.v3;

import java.util.function.Consumer;

@FunctionalInterface
public interface Monitor {
    void monitor(Runnable ready);
}
