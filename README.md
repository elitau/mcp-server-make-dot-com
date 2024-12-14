# Make.com MCP Server

An MCP server implementation that integrates the Make.com API, providing reading make resources like scenario blueprints, users.

## Scopes of API_KEY

I granted the following scopes to the API key:

* `agents:read`
* `apps:read`
* `connections:read`
* `custom-property-structures:read`
* `datastores:read`
* `devices:read`
* `scenarios:read`
* `scenarios:run`
* `scenarios:write`
* `teams:read`

## Features

- **Blueprint**: Reads the blueprint of a scenario.

## Tools

- **read_make_dot_com_scenario_blueprint**
  - Reads the JSON blueprint of a scenario
  - Inputs:
    - `scenario_id` (number): Scenario ID
    - `draft` (boolean, optional): If this parameter is set to true, the draft version of the scenario blueprint will be retrieved. If set to false, the live version of the blueprint will be retrieved. In case that the blueprintId parameter is set to the query as well, this parameter is ignored.

## Configuration

### Usage with Claude Desktop

Clone this repo, run `npm install` in it. This should generate a `dist/index.js` file. Copy the path of this file into the `claude_desktop_config.json` like this:

```json
{
  "mcpServers": {
    "make-dot-com": {
      "command": "node",
      "args": [
        "/full/absolute/path/to/mcp-server-make-dot-com/dist/index.js"
      ],
      "env": {
        "MAKE_DOT_COM_API_KEY": "your-api-key-from-make-dot-com",
        "MAKE_DOT_COM_BASE_URL": "eu2.make.com"
      }
    }
  }
}
```

