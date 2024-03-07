package com.swirldslabs.fullstacktest.api.v2;

import org.junit.jupiter.api.extension.ExtensionContext.Store.CloseableResource;

import java.lang.reflect.Proxy;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Could possibly disable this based on config & RuntimeUtils::isDebugMode similar to:
 * junit.jupiter.execution.timeout.mode=disabled_on_debug
 */
@Deprecated
public class ExceptionalProxy {
    public record ExceptionalProxyRecord<T>(T object, AtomicReference<Throwable> throwable, T proxy) implements CloseableResource {
        @Override
        public void close() throws Throwable {
            if (object instanceof CloseableResource resource) {
                resource.close();
            }
        }
    }

    public static <T> ExceptionalProxyRecord<T> create(Class<T> aClass, T object, AtomicReference<Throwable> throwable) {
        return new ExceptionalProxyRecord<>(object, throwable,
                aClass.cast(Proxy.newProxyInstance(aClass.getClassLoader(),
                        new Class<?>[]{aClass},
                        (proxy, method, args) ->
                        {
                            if (null != throwable.get()) {
                                throw new RuntimeException(throwable.get());
                            }
                            return method.invoke(object, args);
                        })));
    }
}
