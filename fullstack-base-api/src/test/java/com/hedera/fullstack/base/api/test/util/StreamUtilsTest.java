package com.hedera.fullstack.base.api.test.util;

import static org.junit.jupiter.api.Assertions.*;

import com.hedera.fullstack.base.api.util.StreamUtils;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class StreamUtilsTest {

    @Test
    @DisplayName("Test streamToString")
    void streamToString() {
        String testString = "This is a test string";
        InputStream inputStream = new ByteArrayInputStream(testString.getBytes());
        String result = StreamUtils.streamToString(inputStream);
        assertEquals(testString, result);
    }
}