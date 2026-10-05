# DocuMind - Production Engineering Playbook

This document explains exactly how and why I built DocuMind the way I did. It covers architecture, database choices, scalability, and production-level edge cases.

## 1. The Existing Problem
Before I built the current architecture, I faced a major problem:
When a user uploads a heavy 50-page PDF, extracting text and generating 384-dimensional embeddings takes a long time. If I did this synchronously in the main API thread, the API would block. The user's screen would freeze, and other users wouldn't be able to make requests. 

## 2. Alternative Options I Considered
- **Option 1: Monolith (Do everything in one server):** Too slow. The API would time out on large documents.
- **Option 2: Paid Services (OpenAI + Pinecone):** Very easy to build, but very expensive to maintain. Data privacy is also a risk.
- **Option 3: Event-Driven Microservices (My Choice):** Separate the main API from the heavy machine learning tasks using a message queue (Kafka) and background workers.

## 3. The Current Architecture (How it works in production)
1. **Frontend:** The user uploads a document via the React frontend.
2. **Main API (FastAPI):** Receives the document, saves it to a storage bucket (AWS S3), and instantly returns a `200 OK` with a "Processing" status to the user.
3. **Message Queue (Kafka):** The main API sends an event to a Kafka topic saying "New document uploaded at this S3 link."
4. **AI Worker (FastAPI/Python):** 
   - Listens to Kafka.
   - Downloads the document.
   - Uses `PyMuPDF` to extract text.
   - Generates embeddings locally using the HuggingFace `all-MiniLM-L6-v2` model.
   - Saves the embeddings to PostgreSQL.
   - Updates the status to "Completed".
5. **Secure:** No data goes to OpenAI. Everything stays in our VPC network.

## 4. Scalability (What happens when 1,000 users upload PDFs at once?)
If traffic spikes, the Main API will not crash because it is just pushing events to Kafka and responding instantly. 
To scale the system:
- **Kafka Partitions:** I can increase the number of Kafka partitions.
- **Horizontal Scaling of Workers:** I can spin up more Docker containers of the AI Worker to consume messages from Kafka in parallel. 
- **Load Balancing:** Put an AWS Application Load Balancer in front of the FastAPI instances.

## 5. Database Decision & Scalability
I needed to store 384-dimensional vectors.
- I could use **Pinecone**, but it is external and expensive.
- I chose **PostgreSQL with the pgvector extension**. 
*Why?* Because I can store normal relational data (user ID, document status) and the vector embeddings in the exact same database. 
*How it scales:* I use **HNSW (Hierarchical Navigable Small World) indexing** in `pgvector`. Even if I have millions of vectors, HNSW allows for incredibly fast approximate nearest neighbor (ANN) searches without doing a full table scan.

## 6. Error Handling & Edge Cases
In a production application, things fail. Here is how I handle it:
- **Corrupt PDFs:** If `PyMuPDF` cannot read the file, the worker catches the exception, updates the database status to "Failed", and stops processing.
- **Model OOM (Out of Memory):** If the PDF is too large, the embeddings are generated in chunks (batching) so the server RAM does not crash.
- **Kafka Retries:** If the database goes down while saving embeddings, the worker fails to acknowledge the Kafka message. Kafka will retry sending the message later. If it fails 3 times, it goes to a Dead Letter Queue (DLQ) for manual debugging.

## 7. Cost to Build and Maintain
I focused on keeping costs extremely low while acting like a Senior Engineer:
- **Compute:** Running Docker containers on basic AWS EC2 instances is cheap.
- **Database:** Postgres is open source. `pgvector` is free. No $70/month Pinecone subscriptions.
- **ML Model:** HuggingFace `all-MiniLM-L6-v2` is open source and free.
- **Maintenance:** The architecture is decoupled. If the ML model breaks, the main API still works perfectly. It is very easy to debug.
