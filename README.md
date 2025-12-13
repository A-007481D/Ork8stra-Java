# KubeLite

A lightweight a self-hosted Platform-as-a-Service (PaaS) designed to simplify container-based application deployment. KubeLite provides an intuitive way to deploy and manage containerized applications without the complexity of full Kubernetes orchestration.

## 🏗️ Architecture

KubeLite follows a **modular monolith** architecture using Spring Modulith, organized into distinct layers:

```
src/main/java/com/kubelite/
├── api/              # REST API controllers and endpoints
├── application/      # Application services and use cases
├── domain/           # Core business logic and entities
└── infrastructure/   # External integrations and persistence
```

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Language** | Java 21 |
| **Framework** | Spring Boot 3.5 |
| **Architecture** | Spring Modulith |
| **Database** | PostgreSQL |
| **Real-time** | WebSocket |
| **API** | REST |
| **Build Tool** | Maven |
| **Containerization** | Docker Compose |

## 📋 Prerequisites

- **Java 21** or higher
- **Docker** and **Docker Compose**
- **Maven** 3.9+

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kubelite
   ```

2. **Start the application**
   ```bash
   ./mvnw spring-boot:run
   ```
   > Docker Compose will automatically start PostgreSQL when the application runs (thanks to Spring Boot Docker Compose support).

3. **Access the API**
   ```
   http://localhost:8080
   ```

## 🧪 Running Tests

```bash
./mvnw test
```

## 📁 Project Structure

```
kubelite/
├── src/
│   ├── main/
│   │   ├── java/com/kubelite/    # Application source code
│   │   └── resources/             # Configuration files
│   └── test/                      # Test files
├── compose.yaml                   # Docker Compose configuration
├── pom.xml                        # Maven dependencies
└── README.md
```

## 📄 License

This project is part of a school final project.

---

*KubeLite - Kubernetes complexity, minus the complexity.*
