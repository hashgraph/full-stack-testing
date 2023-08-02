package com.hedera.fullstack.service.locator.api;

import java.net.URL;
import java.net.URLClassLoader;

class MutableClassLoader extends URLClassLoader {
    public MutableClassLoader() {
        super(new URL[0]);
    }

    public MutableClassLoader(final URL[] urls) {
        super(urls);
    }

    public MutableClassLoader(final URL[] urls, final ClassLoader parent) {
        super(urls, parent);
    }

    @Override
    public void addURL(final URL url) {
        super.addURL(url);
    }
}
