import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

dns.resolveSrv(
  "_mongodb._tcp.cluster0.n2ryrf6.mongodb.net",
  (err, records) => {
    console.log("ERROR:", err);
    console.log("RECORDS:", records);
  }
);