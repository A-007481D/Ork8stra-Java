# Ork8stra Makefile

.PHONY: help build run test up down logs clean shell

# Default target
help:
	@echo "Available commands:"
	@echo "  make build      - Build the project (skip tests)"
	@echo "  make run        - Run the application locally"
	@echo "  make test       - Run tests"
	@echo "  make up         - Start infrastructure (Docker Compose)"
	@echo "  make down       - Stop infrastructure"
	@echo "  make logs       - View infrastructure logs"
	@echo "  make clean      - Clean target directory"
	@echo "  make all        - Full reset: clean, build, up"

build:
	./mvnw clean package -DskipTests

run:
	./mvnw spring-boot:run

test:
	./mvnw test

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	./mvnw clean

all: down clean build up
