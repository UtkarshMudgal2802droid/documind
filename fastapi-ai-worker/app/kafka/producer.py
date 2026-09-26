import json
import os
from confluent_kafka import Producer
from dotenv import load_dotenv

load_dotenv()

KAFKA_BROKER_URL = os.getenv("KAFKA_BROKER_URL")

producer_config = {
    'bootstrap.servers': KAFKA_BROKER_URL,
    'client.id': 'documind-api-worker'
}

producer = Producer(producer_config)

def delivery_report(err, msg):
    if err is not None:
        print(f"Message delivery failed: {err}")
    else:
        print(f"Message delivered to {msg.topic()} [{msg.partition()}]")

def publish_document_event(document_id: str):
    topic = "document-uploads"
    payload = {"document_id": str(document_id), "status": "pending"}
    
    producer.produce(
        topic, 
        value=json.dumps(payload).encode('utf-8'), 
        callback=delivery_report
    )
    producer.flush()