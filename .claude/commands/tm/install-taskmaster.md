Install TaskMaster
Check if Task Master is installed and install it if needed.

This command helps you get Task Master set up globally on your system.

## Detection and Installation Process

1. **Check Current Installation**
   ```bash
   # Check if task-master command exists
   which task-master || echo "Task Master not found"

   # Check bun global packages
   bun pm ls -g task-master-ai
   ```

2. **System Requirements Check**
   ```bash
   # Verify Bun is installed
   bun --version

   # Check Bun version (need 1.0+)
   ```

3. **Install Task Master Globally**
   If not installed, run:
   ```bash
   bun install -g task-master-ai
   ```

4. **Verify Installation**
   ```bash
   # Check version
   task-master --version

   # Verify command is available
   which task-master
   ```

5. **Initial Setup**
   ```bash
   # Initialize in current directory
   task-master init
   ```

6. **Configure AI Provider**
   Ensure you have at least one AI provider API key set:
   ```bash
   # Check current configuration
   task-master models --status

   # If no API keys found, guide setup
   echo "You'll need at least one API key:"
   echo "- ANTHROPIC_API_KEY for Claude"
   echo "- OPENAI_API_KEY for GPT models"
   echo "- PERPLEXITY_API_KEY for research"
   echo ""
   echo "Set them in your shell profile or .env file"
   ```

7. **Quick Test**
   ```bash
   # Create a test PRD
   echo "Build a simple hello world API" > test-prd.txt

   # Try parsing it
   task-master parse-prd test-prd.txt -n 3
   ```

## Troubleshooting

If installation fails:

**Permission Errors:**
```bash
# Try with sudo (macOS/Linux)
sudo bun install -g task-master-ai

# Or fix bun permissions
mkdir -p ~/.bun/bin
export PATH="$HOME/.bun/bin:$PATH"
```

**Network Issues:**
```bash
# Use different registry
bun install -g task-master-ai --registry https://registry.npmjs.org/
```

**Bun Version Issues:**
```bash
# Update to latest bun
curl -fsSL https://bun.sh/install | bash
```

## Success Confirmation

Once installed, you should see:
```
✅ Task Master installed
✅ Command 'task-master' available globally
✅ AI provider configured
✅ Ready to use slash commands!

Try: /taskmaster:init your-prd.md
```

## Next Steps

After installation:
1. Run `/taskmaster:status` to verify setup
2. Configure AI providers with `/taskmaster:setup-models`
3. Start using Task Master commands!
