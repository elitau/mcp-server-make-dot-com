#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

const READ_SCENARIO_BLUEPRINT_TOOL: Tool = {
  name: "read_make_dot_com_scenario_blueprint",
  description: "Reads the JSON blueprint of a Make.com scenario. Returns the complete blueprint structure including flow, connections, and metadata.",
  inputSchema: {
    type: "object",
    properties: {
      scenario_id: {
        type: "number",
        description: "Scenario ID to retrieve the blueprint for"
      },
      draft: {
        type: "boolean",
        description: "If true, retrieves the draft version. If false, retrieves the live version.",
        default: false
      }
    },
    required: ["scenario_id"]
  }
};

// Server implementation
console.log("Starting mcp-server-make-dot-com server...");
const server = new Server(
  {
    name: "mcp-server-make-dot-com",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Check for required environment variables
const MAKE_API_KEY = process.env.MAKE_DOT_COM_API_KEY!;
const MAKE_BASE_URL = process.env.MAKE_DOT_COM_BASE_URL || "eu2.make.com";

if (!MAKE_API_KEY) {
  console.error("Error: MAKE_DOT_COM_API_KEY environment variable is required");
  process.exit(1);
}

console.log(`Configured with Make.com base URL: ${MAKE_BASE_URL}`);

interface MakeBlueprint {
  code: string;
  response: {
    blueprint: {
      flow: Array<{
        id: number;
        module: string;
        version: number;
        parameters: Record<string, unknown>;
        [key: string]: unknown;
      }>;
      [key: string]: unknown;
    };
  };
}

function isMakeScenarioBlueprintArgs(args: unknown): args is { scenario_id: number; draft?: boolean } {
  return (
    typeof args === "object" &&
    args !== null &&
    "scenario_id" in args &&
    typeof (args as { scenario_id: number }).scenario_id === "number"
  );
}

async function getScenarioBlueprint(scenarioId: number, draft: boolean = false): Promise<string> {
  const url = `https://${MAKE_BASE_URL}/api/v2/scenarios/${scenarioId}/blueprint${draft ? '?draft=true' : ''}`;
  console.log(`Fetching blueprint for scenario ${scenarioId}${draft ? ' (draft version)' : ''}`);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Token ${MAKE_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Make.com API error: ${response.status} ${response.statusText}\n${await response.text()}`);
  }

  console.log(`Successfully retrieved blueprint for scenario ${scenarioId}`);
  const data = await response.json() as MakeBlueprint;
  return JSON.stringify(data.response.blueprint, null, 2);
}

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [READ_SCENARIO_BLUEPRINT_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (!args) {
      throw new Error("No arguments provided");
    }

    switch (name) {
      case "read_make_dot_com_scenario_blueprint": {
        if (!isMakeScenarioBlueprintArgs(args)) {
          throw new Error("Invalid arguments for read_make_dot_com_scenario_blueprint");
        }
        const { scenario_id, draft = false } = args;
        const blueprint = await getScenarioBlueprint(scenario_id, draft);
        return {
          content: [{ type: "text", text: blueprint }],
          isError: false,
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Make.com MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
