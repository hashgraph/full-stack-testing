package com.swirldslabs.fullstacktest.api;

import org.junit.jupiter.api.Test;

import java.lang.ref.ReferenceQueue;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class VirtualThreadsTest {
    ThreadLocal<String> tls = new ThreadLocal<>();

    @Test
    void test() {
        System.out.println("tls: " + tls.get());
        ThreadFactory factory = Thread.ofVirtual().name("fred", 0).factory();
        List<Thread> list = new ArrayList<>();
        for (int i = 0; i < 10; ++i) {
            int j = i;
            list.add(factory.newThread(() -> {
                while (true) {
                    try {
                        tls.set(String.valueOf(j));
                        Thread.sleep(j * 1000);
                        break;
                    } catch (InterruptedException e) {
                        Thread.interrupted();
                    }
                }
                System.out.println("tls: " + tls.get() + " hello from " + Thread.currentThread());
            }));
        }
        list.forEach(Thread::start);
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
        for (Thread thread : list) {
            try {
                thread.interrupt();
                thread.join(10);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        }
        System.out.println("tls: " + tls.get());
    }

    @Test
    void test2() throws ExecutionException, InterruptedException {
        var es = Executors.newThreadPerTaskExecutor(Thread.ofVirtual().name("joe", 0).factory());
        CompletableFuture<String> cf = CompletableFuture.supplyAsync(() -> Thread.currentThread().toString(), es);
        System.out.println(cf.get());

        Thread.startVirtualThread(() -> System.out.println(Thread.currentThread()));

        //
        var executor = Executors.newVirtualThreadPerTaskExecutor();

        Runnable[] monitors = {
                () -> {
                    try {
                        Thread.sleep(500);
                    } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                    }
                    System.out.println("monitor: " + Thread.currentThread());
                    throw new RuntimeException();
                }
        };

        /// maybe supply a boolean?
        var cf2 = CompletableFuture.anyOf(
//                CompletableFuture.runAsync(() -> { System.out.println("test");}),
                Stream.concat(Stream.of(() -> {
                    try {
                        Thread.sleep(100);
                    } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                    }
                    System.out.println("test");
                }), Arrays.stream(monitors))
                        .map($ -> CompletableFuture.runAsync($, executor)).toArray(CompletableFuture[]::new));

        cf2.get();
    }

    void faketest() {
        assertEquals("A", "A");
    }

    void fakemonitor() {
        int j = 0;
        for (int i = 0;; i++) {
//            try {
//                Thread.sleep(1000);
//            } catch (InterruptedException e) {
//                throw new RuntimeException(e);
//            }
            if (0 == i) {
                System.err.println("hello from monitor " + Thread.currentThread());
                if (j++ > 10) { break; }
            }
        }
    }

    @Test
    void t3() throws Throwable {
        try (ExecutorService executorService = Executors.newVirtualThreadPerTaskExecutor()) {
            List<CompletableFuture<?>> list = new ArrayList<>();
            list.add(CompletableFuture.runAsync(this::faketest, executorService));
            list.add(CompletableFuture.runAsync(this::fakemonitor, executorService));
            CompletableFuture<?> first = CompletableFuture.anyOf(list.toArray(CompletableFuture[]::new));
            System.err.println(first.get());
//            executorService.shutdownNow();
            //throw new Throwable();
        } catch (ExecutionException e) {
            throw new RuntimeException(e);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
//        try {
//            Thread.sleep(5000);
//        } catch (InterruptedException e) {
//            throw new RuntimeException(e);
//        }
    }

    @Test
    void t4() {
        ThreadFactory factory = Thread.ofVirtual().factory();
        List<Thread> list = new ArrayList<>();
        list.add(factory.newThread(this::faketest));
        list.add(factory.newThread(this::fakemonitor));
    }

    Runnable task(long sleep, boolean interruptable, boolean raise) {
        return () -> {
            while (true) {
                try {
                    System.out.println("hello from " + Thread.currentThread());
                    Thread.sleep(sleep);
                    break;
                } catch (InterruptedException e) {
                    if (interruptable) {
                        throw new RuntimeException(e);
                    }
                }
            }
            System.out.println("goodbye from " + Thread.currentThread());
            if (raise) {
                throw new RuntimeException();
            }
        };
    }

    sealed interface Result {}
    record Success() implements Result {}
    record Failure(Exception exception) implements Result {}

    Runnable run(Runnable runnable, BlockingQueue<Result> queue, boolean success) {
        return () -> {
            try {
                runnable.run();
                if (success) {
                    queue.put(new Success());
                }
            } catch (Exception exception) {
                try {
                    queue.put(new Failure(exception));
                } catch (InterruptedException e) {
                    throw new RuntimeException(e);
                }
            }
        };
    }

    /*
    * This seems to allow me to properly wait for test to complete or fail or monitor to fail.
    *
    * Some remaining concerns are:
    * * handle interrupt while waiting for result and killing client when shutting down
    *
    * Would like to use scoped-value, but since that's still in preview, lets use thread-local
    *
    * */
    @Test
    void successfulWait() {
        LinkedBlockingQueue<Result> queue = new LinkedBlockingQueue<>();
        ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();
        executor.submit(run(task(999, false, false), queue, false));
        executor.submit(run(task(9999, false, true), queue, false));
        executor.submit(run(task(999, true, false), queue, false));
        executor.submit(run(task(9999, true, true), queue, false));
        executor.submit(run(task(3000, false, false), queue, true));
        System.out.println("waiting... " + Thread.currentThread());
        Result result = null;
        try {
            result = queue.take();
        } catch (InterruptedException e) {
            // test may have timed out, perform immediate shutdown!
            throw new RuntimeException(e);
        }
        System.out.println("got result: " + result);
        executor.shutdownNow(); // shutdown should also kill client
    }

    interface Client extends AutoCloseable {
        boolean isOpen();
    }

    class MyClient implements Client {

        boolean open = true;
        @Override
        public void close() throws Exception {
            open = false;
        }

        @Override
        public boolean isOpen() { return open; }
    }

//    AtomicBoolean open = new AtomicBoolean(true);
//
//    class MyInvocationHandler implements InvocationHandler {
//        MyClient myClient = new MyClient();
//        @Override
//        public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
//            if (!open.get() && myClient.isOpen()) { myClient.close(); }
//            return method.invoke(myClient, args);
//        }
//    }
    @Test
    void clientProxy() throws Exception {
//        InvocationHandler handler = new MyInvocationHandler();
//        Client f = (Client) Proxy.newProxyInstance(Client.class.getClassLoader(),
//                new Class<?>[] { Client.class },
//                handler);
        MyClient myClient = new MyClient();
        AtomicBoolean open = new AtomicBoolean(true);
        Client f = (Client) Proxy.newProxyInstance(Client.class.getClassLoader(),
                new Class<?>[] { Client.class },
                (proxy, method, args) ->
                {
                    if (!open.get() && myClient.isOpen()) { myClient.close(); }
                    return method.invoke(myClient, args);
                });
        System.out.println("isOpen: " + f.isOpen());
//        f.close();
        open.set(false);
        System.out.println("isOpen: " + f.isOpen());
    }

    ThreadLocal<AtomicReference<MyClient>> objRef;

    /*
    * Note: ThreadLocal object is shared between threads. Internally thread-local maintains a map from thread to value.
    *       With "inheritance" each child thread gets its own map entry with its own reference to the thread-local value.
    *       Therefore, modifications to value may be visible to all threads.
    * */
    @Test
    void threadLocal() {
        ThreadLocal<AtomicReference<MyClient>> client = new InheritableThreadLocal<>();
        objRef = client;
        client.set(new AtomicReference<>());
        client.get().compareAndSet(null, new MyClient());
        System.out.println("" + Objects.toIdentityString(client));
        Thread child = Thread.ofVirtual()./*inheritInheritableThreadLocals(true).*/start(() -> {
            System.out.println("" + (objRef == client));
            System.out.println("isOpen " + client.get().get().isOpen() + " " + Thread.currentThread() + " " + client + " " + client.get().get());
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            try {
                client.get().get().close();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
            System.out.println("isOpen " + client.get().get().isOpen() + " " + Thread.currentThread() + " " + client + " " + client.get().get());
        });
        System.out.println("isOpen " + client.get().get().isOpen() + " " + Thread.currentThread() + " " + client + " " + client.get().get());
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
        try {
            client.get().get().close();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        System.out.println("isOpen " + client.get().get().isOpen() + " " + Thread.currentThread() + " " + client + " " + client.get().get());
//        client.get().set(null);
//        System.out.println(client.get());
        try {
            child.join();
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    /*
    * Could maintain some concurrent collection of resources, which implement
    * */
}
