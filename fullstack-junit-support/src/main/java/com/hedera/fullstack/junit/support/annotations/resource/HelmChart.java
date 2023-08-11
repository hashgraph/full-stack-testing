package com.hedera.fullstack.junit.support.annotations.resource;

import java.lang.annotation.*;

/**
 * Represents a Helm chart identifier in component form (repository, chart, version).
 */
@Inherited
@Documented
@Target({})
@Retention(RetentionPolicy.RUNTIME)
public @interface HelmChart {
    /**
     * The Helm repository URL where the chart is located. This is synonymous with the URL used by the Helm CLI
     * {@code helm repo add <name> <url>} command syntax.
     *
     * @return the Helm repository URL where the chart is located.
     */
    String repository();

    /**
     * The identifier of the Helm chart. This is synonymous with the name used by the Helm CLI
     * {@code helm install <release-name> <chart>} command syntax.
     *
     * @return the Helm chart identifier.
     */
    String chart();

    /**
     * The version of the Helm chart. This must be a valid Semantic Version (SemVer) string as required by the
     * Helm Chart v2 specification.
     *
     * @return the Helm chart semantic version.
     */
    String version();
}
