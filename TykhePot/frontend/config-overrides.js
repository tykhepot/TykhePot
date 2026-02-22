module.exports = function override(config, env) {
  // 添加 polyfill
  config.resolve.fallback = {
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer/'),
    process: require.resolve('process/browser.js'),
    events: require.resolve('events/'),
    util: require.resolve('util/'),
    vm: false,
    path: false,
    fs: false,
    os: false,
    net: false,
    tls: false,
    http: false,
    https: false,
    zlib: false,
    querystring: false,
    url: false,
    assert: false,
    constants: false,
    timers: false,
    punycode: false,
    dgram: false,
    dns: false,
    cluster: false,
    module: false,
    v8: false,
    async_hooks: false,
    inspector: false,
    perf_hooks: false,
    worker_threads: false,
    child_process: false,
    repl: false,
    readline: false,
    tty: false,
    console: false,
    domain: false,
    string_decoder: false,
    sys: false,
  };

  // 添加 buffer polyfill 插件
  const webpack = require('webpack');
  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser.js',
    })
  );

  return config;
};
