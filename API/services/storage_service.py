import os
import boto3
import logging
from botocore.client import Config
from botocore.exceptions import NoCredentialsError, EndpointConnectionError

logger = logging.getLogger(__name__)

# Load config
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL", "http://localhost:9000")
S3_ACCESS_KEY_ID = os.getenv("S3_ACCESS_KEY_ID", "minioadmin")
S3_SECRET_ACCESS_KEY = os.getenv("S3_SECRET_ACCESS_KEY", "minioadmin")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "procurement-documents")
S3_SECURE = os.getenv("S3_SECURE", "False").lower() in ("true", "1", "yes")

_s3_client = None

def get_s3_client():
    global _s3_client
    if _s3_client is not None:
        return _s3_client
        
    try:
        # Config to force path-style addressing for MinIO with 1s timeout
        client = boto3.client(
            "s3",
            endpoint_url=S3_ENDPOINT_URL,
            aws_access_key_id=S3_ACCESS_KEY_ID,
            aws_secret_access_key=S3_SECRET_ACCESS_KEY,
            use_ssl=S3_SECURE,
            config=Config(
                signature_version="s3v4", 
                s3={"addressing_style": "path"},
                connect_timeout=1,
                read_timeout=1,
                retries={"max_attempts": 0}
            ),
            region_name="us-east-1"
        )
        # Check connection & ensure bucket exists
        try:
            client.head_bucket(Bucket=S3_BUCKET_NAME)
        except Exception:
            try:
                client.create_bucket(Bucket=S3_BUCKET_NAME)
                logger.info(f"S3 bucket '{S3_BUCKET_NAME}' created.")
            except Exception:
                pass
            
        _s3_client = client
        return _s3_client
    except Exception as e:
        logger.warning(f"S3/MinIO connection failed: {e}. Falling back to local storage.")
        return None

def upload_document_to_s3(file_path: str, filename: str) -> str:
    """
    Uploads file to S3/MinIO using its local file path. Returns the S3 URL.
    If S3/MinIO is unavailable, falls back to local storage and returns the local path.
    """
    s3 = get_s3_client()
    if s3 is not None:
        try:
            with open(file_path, "rb") as file_obj:
                s3.upload_fileobj(
                    file_obj,
                    S3_BUCKET_NAME,
                    filename
                )
            s3_url = f"{S3_ENDPOINT_URL}/{S3_BUCKET_NAME}/{filename}"
            logger.info(f"File '{filename}' successfully uploaded to S3: {s3_url}")
            return s3_url
        except Exception as e:
            logger.error(f"S3 upload failed: {e}. Falling back to local storage.")
            
    # Fallback to local storage: since it's already saved locally at file_path, just return it!
    logger.info(f"File '{filename}' stored locally: {file_path}")
    return file_path
