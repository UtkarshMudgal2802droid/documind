import json
from confluent_kafka import Producer
from app.core.config import settings

producer_config = {
    'bootstrap.servers': settings.KAFKA_BROKER_URL,
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