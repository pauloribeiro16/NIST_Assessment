import asyncio
from typing import Optional
from contextlib import AsyncExitStack

from mcp import ClientSession
from mcp.client.stdio import stdio_client, StdioServerParameters

class NISTMCPClient:
    def __init__(self):
        self.server_parameters = StdioServerParameters(
            command="docker",
            args=["exec", "-i", "nist-mcp-server", "node", "dist/index.js"],
            env=None
        )
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()

    async def connect(self):
        """Connect to the MCP server"""
        transport_mac, write_mac = await self.exit_stack.enter_async_context(
            stdio_client(self.server_parameters)
        )
        self.session = await self.exit_stack.enter_async_context(
            ClientSession(transport_mac, write_mac)
        )
        await self.session.initialize()

    async def get_tools(self):
        if not self.session:
            await self.connect()
        response = await self.session.list_tools()
        return response.tools

    async def call_tool(self, name: str, arguments: dict):
        if not self.session:
            await self.connect()
        response = await self.session.call_tool(name, arguments)
        return response

    async def cleanup(self):
        await self.exit_stack.aclose()

# Global instance for the FastAPI app
mcp_client = NISTMCPClient()
