import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestReporter;

import static org.junit.jupiter.api.Assumptions.assumeTrue;

public class AssumptionsAndReportsTest {
    @Test
    void test0(TestReporter reporter) {
        reporter.publishEntry("this is a report!");
        assumeTrue(false, "hello?");
    }
}
