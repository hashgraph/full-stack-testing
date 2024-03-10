package com.swirldslabs.fullstacktest.api.v4;

/**
 * Interface for all constraint verification.
 * */
public sealed interface ConstraintVerifier permits ConstraintChecker, ConstraintMonitor {}
