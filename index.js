var request = require('request');

function updatePowerDns(hostname, ipAddress) {
  const apiKey = process.env.POWERDNS_API_KEY;
  const dnsZone = process.env.DNS_ZONE;
  const apiUrl = process.env.POWERDNS_API_URL;
  const powerDnsRequest = request.defaults({
    headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json"
    },
    baseUrl: apiUrl,
    json: true
  });
  const newRrsets = { rrsets : [{
    name: hostname + ".",
    type: "A",
    ttl: 120,
    changetype: "REPLACE",
    records: [{
      content: ipAddress,
      disabled: false
    }]
  }]};
  powerDnsRequest({
    url: `/zones/${dnsZone}`,
    method: "PATCH",
    body: newRrsets
  }, (err, response) => {
    if (err) {
      console.log("Error talking to PowerDNS");
      console.log(err);
    }
  });
}

function updateDns() {
  try {
    const url = process.env.TRAEFIK_API_URL;
    const loadBalancerIp = process.env.LB_IP;
    console.log("Updating DNS entries.")
    request(url, function (error, response, body) {
      const parsedBody = JSON.parse(body);
      if (parsedBody.docker.frontends) {
        const frontendKeys = Object.keys(parsedBody.docker.frontends);
        for (const key of frontendKeys) {
          const frontend = parsedBody.docker.frontends[key];
          if (frontend.routes) {
            hostKey = Object.keys(frontend.routes)[0];
            const rule = frontend.routes[hostKey];
            const hostname = rule.rule.replace("Host:","");
            console.log("Setting DNS Value for : " + hostname + " to " + loadBalancerIp.toString());
            updatePowerDns(hostname, loadBalancerIp);
          }
        }
      }
    });
  } catch (err) {
    console.log("Error attempting to update dns.");
    if (err.message) {
      console.log(err.message);
    }
    if (err.stack) {
      console.log("Stack:");
      console.log(err.stack);
    }
  }
  setTimeout(updateDns, 30000);
}

function validateThenUpdate() {
  if (process.env.TRAEFIK_API_URL === undefined) {
    console.log("Environment variable undefined: TRAEFIK_API_URL.")
    return;
  }
  if (process.env.LB_IP === undefined) {
    console.log("Environment variable undefined: LB_IP.")
    return;
  }
  if (process.env.POWERDNS_API_KEY === undefined) {
    console.log("Environment variable undefined: POWERDNS_API_KEY.")
    return;
  }
  if (process.env.DNS_ZONE === undefined) {
    console.log("Environment variable undefined: DNS_ZONE.")
    return;
  }
  if (process.env.POWERDNS_API_URL === undefined) {
    console.log("Environment variable undefined: POWERDNS_API_URL.")
    return;
  }
  setTimeout(updateDns, 0);
}

validateThenUpdate();