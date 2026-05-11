.PHONY: help setup build serve api-setup webhooks sync clean add-page

help: ## Show all available commands
	@echo ""
	@echo "Boulevard Marketing Sandbox"
	@echo "═══════════════════════════"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'
	@echo ""

setup: ## Run the setup wizard (first time only)
	@./setup.sh

build: ## Regenerate site from brand.json + templates
	@node scripts/generate.js

serve: ## Start local preview server on port 8080
	@echo "Serving at http://localhost:8080"
	@echo "Press Ctrl+C to stop."
	@python3 -m http.server 8080

api-setup: ## Install API dependencies and create .env
	@cd api && npm install
	@test -f api/.env || cp api/.env.example api/.env
	@echo ""
	@echo "✓ Dependencies installed."
	@echo "→ Edit api/.env with your API keys."

webhooks: ## Start the Boulevard webhook listener
	@cd api && node webhook-server.js

sync: ## Export all Boulevard clients as JSON
	@cd api && node blvd-client-sync.js

clean: ## Remove generated HTML files (keeps templates and brand.json)
	@rm -f index.html about.html services.html contact.html brand-guide.html
	@echo "✓ Generated files removed. Run 'make build' to regenerate."

add-page: ## Create a new blank page (usage: make add-page NAME=pricing)
	@if [ -z "$(NAME)" ]; then echo "Usage: make add-page NAME=pricing"; exit 1; fi
	@node scripts/add-page.js $(NAME)
