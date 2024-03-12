import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

public class SecondTest {
    @Test
    void test1() {}
    @Test
    void test2() {
        assumeTrue(false);
    }
    @Test
    void test3() {
        assertTrue(false);
    }
//    @Disabled
    @Test
    void test4() {

    }
}
