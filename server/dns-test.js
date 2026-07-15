const dns = require("dns").promises;

dns.resolveSrv("_mongodb._tcp.cluster0.n2ryrf6.mongodb.net")
  .then(console.log)
  .catch(console.error);