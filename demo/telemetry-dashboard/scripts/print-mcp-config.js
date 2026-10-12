// Prints the MCP config snippet (with this machine's absolute path) for ~/.copilot/mcp-config.json.
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "mcp-server", "server.js");
const config = {
  mcpServers: {
    "copilot-app-telemetry": {
      type: "local",
      command: "node",
      args: [serverPath],
      tools: ["*"],
    },
  },
};
console.log(JSON.stringify(config, null, 2));
