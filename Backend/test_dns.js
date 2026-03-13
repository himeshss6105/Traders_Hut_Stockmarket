import dns from 'dns';
import fs from 'fs';

dns.resolveSrv('_mongodb._tcp.cluster0.utt1hwi.mongodb.net', (err, addresses) => {
  if (err) {
    fs.writeFileSync('dns_status.txt', "ERROR: " + err.message);
  } else {
    fs.writeFileSync('dns_status.txt', "SUCCESS: " + JSON.stringify(addresses));
  }
});
