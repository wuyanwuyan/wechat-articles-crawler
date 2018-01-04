const AnyProxy = require('anyproxy');
const options = {
    port: 8001,
    rule: require('./myRuleModule'),
    webInterface: {
        enable: true,
        webPort: 8002,
        wsPort: 8003,
    },
    throttle: 10000,
    forceProxyHttps: true,
    silent: true
};
const proxyServer = new AnyProxy.ProxyServer(options);

proxyServer.on('ready', () => {
    console.log('-------------------------- start --------------------------------');
});
proxyServer.on('error', (e) => {

});
proxyServer.start();

//when finished
// proxyServer.close();