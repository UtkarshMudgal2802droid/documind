# DocuMind

DocuMind is an enterprise-grade AI Document Intelligence platform designed to extract knowledge from unstructured data using state-of-the-art vector search. It allows users to upload documents and perform semantic searches using natural language.

## Architecture & Tech Stack

The platform is built with a modern, decoupled architecture:

**Frontend**
- React with Vite
- TypeScript
- Custom Design System (CSS Variables, Framer Motion)

**Backend API & Workers**
- FastAPI (Python)
- SQLAlchemy (ORM)
- Sentence Transformers (Hugging Face models for text embeddings)
- Confluent Kafka (Event streaming for real-time document processing)

**Infrastructure & Database**
- PostgreSQL with `pgvector` extension for high-performance similarity search
- Zookeeper (Kafka dependency)
- Docker & Docker Compose for containerized deployment

## Core Features

- **Secure Authentication:** Role-based access control with JWT and bcrypt password hashing.
- **Document Ingestion:** Support for PDF and TXT file uploads (up to 10MB per file) processed asynchronously.
- **Semantic Search:** Natural language querying over document content using vector embeddings, returning highly relevant matches.
- **Real-time Processing:** Event-driven architecture using Kafka ensures scalable and non-blocking document indexing.
- **Premium User Interface:** A highly responsive, accessible, and theme-consistent frontend designed for professional environments.

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (v18+)
- Python 3.10+ (for local backend development)

### Local Development Setup

1. **Clone the repository and configure environment variables**

   Ensure the root `.env` file is populated with the necessary configuration. A sample configuration requires setting database credentials, JWT secrets, and admin user details.

2. **Start the Infrastructure and Backend**

   The project includes a `docker-compose.yml` file that provisions the PostgreSQL database, Kafka, Zookeeper, the FastAPI backend, and the background worker.

   ```bash
   docker-compose up -d
   ```

   This command spins up:
   - `documind-postgres` (Port 5432)
   - `documind-kafka` (Port 9092)
   - `documind-zookeeper` (Port 2181)
   - `documind-api` (Port 8085)
   - `documind-worker`

3. **Start the Frontend Application**

   Navigate to the frontend directory, install dependencies, and start the development server.

   ```bash
   cd documind-frontend
   npm install
   npm run dev
   ```

   The application will be accessible at `http://localhost:5173`.

## Deployment

The frontend is optimized for deployment on platforms like Vercel (using the included `vercel.json` configuration). The backend services and infrastructure are containerized and can be deployed to any Docker-compatible environment (e.g., AWS EC2, ECS, or Kubernetes).

## Security Notes

- The authentication flow relies on secure HTTP-only configurations where applicable and standard JWT bearer tokens.
- Ensure the `JWT_SECRET_KEY` and default administrator credentials are changed before deploying to a production environment.
- The `passlib` dependency issue with modern `bcrypt` versions has been explicitly resolved by pinning `bcrypt==3.2.2`.
