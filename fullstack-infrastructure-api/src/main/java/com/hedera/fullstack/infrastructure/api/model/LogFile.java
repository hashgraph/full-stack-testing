package com.hedera.fullstack.infrastructure.api.model;

public enum LogFile {
    EXAMPLE_PLATFORM_LOG_FILE_1("log_file_1", "/var/log/hedera/hedera.log"),
    EXAMPLE_PLATFORM_LOG_FILE_2("log_file_2", "/var/log/hedera/hedera.log");

    private String name;
    private String path;

    LogFile(String name, String path) {
        this.name = name;
        this.path = path;
    }

}
