const dns = require("dns");
const path = require("path");
const dotenv = require("dotenv");

const envPath = path.resolve(__dirname, "..", ".env");

dotenv.config({
  path: envPath,
  quiet: true,
});

// Node on Windows can inherit a loopback DNS server (127.0.0.1) from
// VPN / antivirus / "secure DNS" tools. If nothing is listening there,
// mongodb+srv SRV lookups fail with querySrv ECONNREFUSED.
function usePublicDnsIfLocalResolverIsBroken() {
  const servers = dns.getServers();
  const onlyLoopback =
    servers.length === 0 ||
    servers.every((server) => {
      const host = String(server).split("%")[0].replace(/^\[|\]$/g, "");
      return host === "127.0.0.1" || host === "::1" || host.startsWith("127.");
    });

  if (onlyLoopback) {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  }
}

usePublicDnsIfLocalResolverIsBroken();

module.exports = {
  envPath,
};
