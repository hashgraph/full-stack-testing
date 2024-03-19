import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.platform.commons.logging.Logger;
import org.junit.platform.commons.logging.LoggerFactory;

import java.lang.invoke.MethodHandles;
import java.util.ArrayList;
import java.util.List;

@Disabled
public class IOTest {
    private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

    @RepeatedTest(50)
    void test1() {
        for (long loop = 0; loop < 10000; ++loop) {
            System.out.println("0123456789".repeat(50));
            System.out.println("0123456789".repeat(50));
        }
    }

    @RepeatedTest(50)
    void test2() throws Exception {
        List<Thread> threads = new ArrayList<>();
        for (int i = 0; i < 100; ++i) {
            threads.add(Thread.ofPlatform().start(() -> {
                for (int j = 0; j < 100; ++j) {
                    logger.info(() -> "0123456789".repeat(50));
                    logger.info(() -> "0123456789".repeat(50));
                }
            }));
        }
        for (Thread thread : threads) {
            thread.join();
        }
    }

    @RepeatedTest(50)
    void test3() throws Exception {
        List<Thread> threads = new ArrayList<>();
        for (int i = 0; i < 100; ++i) {
            threads.add(Thread.ofVirtual().start(() -> {
                for (int j = 0; j < 100; ++j) {
                    logger.info(() -> "0123456789".repeat(50));
                    logger.info(() -> "0123456789".repeat(50));
                }
            }));
        }
        for (Thread thread : threads) {
            thread.join();
        }
    }
}
