SHELL := /bin/bash
.PHONY: help dev-frontend build-frontend install-frontend dev-backend build-backend docker-up docker-down clean reset run stop

# Ensure Java 21 is used for Maven commands
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64

help: ## Show this help menu
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# --- Frontend Commands ---

dev-frontend: ## Start the React/Vite frontend development server (runs on port 5173)
	cd frontend && npm run dev

build-frontend: ## Build the React frontend for production
	cd frontend && npm run build

install-frontend: ## Install frontend NPM dependencies
	cd frontend && npm install

# --- Backend Commands ---

dev-backend: ## Start the Spring Boot backend development server (runs on port 8080)
	./mvnw spring-boot:run

build-backend: ## Build the Spring Boot backend JAR (skips tests)
	./mvnw clean package -DskipTests

# --- Infrastructure Commands ---

docker-up: ## Start the required infrastructure (PostgreSQL, Redis, MinIO, RabbitMQ)
	docker compose up -d

docker-down: ## Stop and remove the infrastructure containers
	docker compose down

docker-logs: ## View logs for the infrastructure containers
	docker compose logs -f

# --- Kubernetes Commands ---
minikube-start: ## Start the Minikube cluster
	@echo "Checking minikube status..."
	@minikube status >/dev/null 2>&1 || minikube start

k8s-reset: ## Delete all Kubernetes resources managed by Ork8stra
	@echo "Purging Ork8stra managed resources from Kubernetes..."
	-kubectl delete deployments -l managed-by=ork8stra --all-namespaces
	-kubectl delete services -l managed-by=ork8stra --all-namespaces
	-kubectl delete ingresses -l managed-by=ork8stra --all-namespaces
	-kubectl delete pods -l managed-by=ork8stra --all-namespaces
	@echo "Kubernetes cleanup complete."

# --- Utility Commands ---

test: ## Run all backend unit and integration tests
	./mvnw test

db-reset: ## Hard reset of the database (removes all data and volumes)
	docker compose down -v
	docker compose up -d
	@echo "Database has been reset and infrastructure is restarting..."

run: minikube-start docker-up ## Start the entire application (Infrastructure, Backend, Frontend) in development mode
	@echo "Starting backend and frontend..."
	@# Run backend and frontend concurrently
	npx -y concurrently -k -p "[{name}]" -n "Backend,Frontend" -c "bgBlue.bold,bgMagenta.bold" \
		"set -a && . ./.env && set +a && JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ./mvnw spring-boot:run" \
		"cd frontend && npm run dev"

stop: docker-down ## Stop all infrastructure and background processes
	@echo "Stopping application processes..."
	@pkill -f "spring-boot:run" || true
	@pkill -f "vite" || true
	@echo "All processes stopped."

clean: ## Clean Maven target directory and frontend build artifacts
	./mvnw clean
	rm -rf frontend/dist

reset: db-reset clean k8s-reset ## Deep cleanup: Reset DB, stop containers, clean builds, and purge Kubernetes
	rm -rf frontend/node_modules
	@echo "Deep reset complete. Run 'make install-frontend' then 'make run' to start fresh."
