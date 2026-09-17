// provider_setup.js v3 — full EIP-1193 + legacy; round-trip signing via Python driver
(function(){
  if (window.__prov) return 'already';
  window.__signJob = null;
  window.__lastReq = null;
  window.__unhandled = null;
  window.__signLog = [];
  var ADDR = window.__ADDR;
  function req(method, params){
    window.__lastReq = {method: method, params: params ? JSON.stringify(params).slice(0,500) : null};
    if (method === 'eth_chainId') return Promise.resolve('0x38');
    if (method === 'net_version') return Promise.resolve('56');
    if (method === 'eth_accounts') return Promise.resolve([ADDR]);
    if (method === 'eth_requestAccounts') return Promise.resolve([ADDR]);
    if (method === 'personal_sign' || method === 'eth_sign') {
      var msg = method === 'personal_sign' ? params[0] : params[1];
      var mhex = typeof msg === 'string' ? msg : null;
      var mbytes;
      if (mhex && mhex.slice(0,2) === '0x') {
        var h = mhex.slice(2); if (h.length % 2) h = '0' + h;
        mbytes = h.match(/../g).map(function(b){return parseInt(b,16);});
      } else if (mhex) {
        mbytes = mhex.match(/../g).map(function(b){return parseInt(b,16);});
      } else {
        mbytes = Array.prototype.slice.call(new TextEncoder().encode(msg));
      }
      window.__signJob = {method: method, bytes: mbytes, ts: Date.now()};
      window.__signLog.push(method);
      window.__pendingSign = new Promise(function(res){ window.__resolveSign = res; });
      return window.__pendingSign;
    }
    if (method === 'wallet_requestPermissions' || method === 'wallet_permissions') return Promise.resolve([{ id: 'eth_accounts' }]);
    if (method === 'eth_sendTransaction' || method === 'eth_sendRawTransaction' || method === 'eth_signTransaction') {
      window.__unhandled = {method: method, params: params ? JSON.stringify(params) : null, ts: Date.now()};
      return new Promise(function(res){ window.__resolveUnhandled = res; });
    }
    // default: most read methods return empty; genuinely unknowns -> unhandled
    if (method === 'eth_getBalance') return Promise.resolve('0x0');
    if (method === 'eth_getTransactionCount') return Promise.resolve('0x0');
    if (method === 'eth_blockNumber') return Promise.resolve('0x5f5e0f');
    if (method === 'eth_gasPrice') return Promise.resolve('0x3B9ACA00');
    if (method === 'eth_estimateGas') return Promise.resolve('0x5208');
    if (method === 'eth_chainId' || method === 'net_version') return Promise.resolve('0x38');
    if (method === 'eth_call') return Promise.resolve('0x');
    if (method === 'eth_getCode') return Promise.resolve('0x');
    if (method === 'eth_getLogs') return Promise.resolve([]);
    if (method === 'eth_coinbase' || method === 'eth_accounts') return Promise.resolve([ADDR]);
    if (method === 'wallet_switchEthereumChain' || method === 'wallet_addEthereumChain') return Promise.resolve(null);
    window.__unhandled = {method: method, params: params ? JSON.stringify(params) : null, ts: Date.now()};
    return new Promise(function(res){ window.__resolveUnhandled = res; });
  }
  window.__prov = {
    isMetaMask: true,
    metamask: true,
    'io.metamask': true,
    'com.metamask': true,
    'org.tornado': true,
    isWalletConnectProvider: false,
    chainId: '0x38',
    selectedAddress: ADDR,
    networkVersion: '56',
    isConnected: function(){ return true; },
    isAuthorized: function(){ return true; },
    on: function(){}, removeListener: function(){}, removeAllListeners: function(){},
    once: function(){}, emit: function(){},
    _events: {},
    requestAccounts: function(){ return Promise.resolve([ADDR]); },
    send: function(a,b){
      // legacy: send(payload) or send(method, params)
      if (typeof a === 'string') return req(a, b);
      return req(a.method, a.params);
    },
    sendAsync: function(payload, cb){
      req(payload.method, payload.params).then(function(v){ cb(null, v); })
        .catch(function(e){ cb(e, null); });
    },
    request: function(o){ return req(o.method, o.params); }
  };
  Object.defineProperty(window, 'ethereum', {get: function(){ return window.__prov; }, configurable: true});
  return 'provider-ready-v3';
})()
