# Quick Start: Connect Figma to Bob via MCP

## 🚀 Fast Setup (3 Steps)

### Step 1: Run the Setup Script

```bash
./setup-figma-mcp.sh
```

When prompted, paste your Figma Personal Access Token.

### Step 2: Restart VS Code

Completely quit and restart VS Code for the MCP configuration to take effect.

### Step 3: Test the Connection

Open Bob and ask:
```
"Get information about this Figma file: https://www.figma.com/file/YOUR_FILE_KEY/YOUR_FILE_NAME"
```

## ✅ That's It!

Bob can now access your Figma designs through MCP.

---

## 📖 What You Can Do Now

### Extract Design Tokens
```
"Extract all colors and typography from [figma-url]"
```

### Generate Components
```
"Create React components based on the button designs in [figma-url]"
```

### Analyze Designs
```
"What components are in this Figma file: [figma-url]"
```

### Get Specific Elements
```
"Get the spacing values from the design system in [figma-url]"
```

---

## 🔧 Manual Setup (Alternative)

If you prefer manual setup or the script doesn't work:

1. **Locate MCP Config File:**
   - macOS: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
   - Linux: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

2. **Create/Edit the file with:**
   ```json
   {
     "mcpServers": {
       "figma": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-figma"],
         "env": {
           "FIGMA_PERSONAL_ACCESS_TOKEN": "your-token-here"
         }
       }
     }
   }
   ```

3. **Restart VS Code**

---

## 🆘 Troubleshooting

### Bob Can't Access Figma
- ✅ Did you restart VS Code?
- ✅ Is your token correct?
- ✅ Is the MCP config file in the right location?

### "MCP Server Not Found"
Run: `npx -y @modelcontextprotocol/server-figma` to test if the package works.

### Need More Help?
See the detailed guide: `FIGMA_MCP_SETUP.md`

---

## 🔐 Security Reminder

- Never commit your Figma token to Git
- The token is stored in your local VS Code settings
- You can regenerate tokens anytime in Figma settings

---

## 📚 Additional Resources

- Full Setup Guide: `FIGMA_MCP_SETUP.md`
- Example Config: `mcp-config-example.json`
- [Figma API Docs](https://www.figma.com/developers/api)