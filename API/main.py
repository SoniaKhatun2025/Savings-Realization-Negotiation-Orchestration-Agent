import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# Initialize directories
os.makedirs(os.getenv("UPLOAD_DIR", "./uploads"), exist_ok=True)
os.makedirs(os.getenv("CHROMA_PATH", "./chroma_store"), exist_ok=True)
os.makedirs("./logs", exist_ok=True)

from contextlib import asynccontextmanager
from database.connection import get_db_connection

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        conn = get_db_connection()
        conn.close()
    except Exception:
        pass
    yield

app = FastAPI(
    title="Agent19 - Savings Realization & Negotiation Orchestration",
    description="Enterprise API for AI-assisted procurement execution.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/")
def read_root():
    return {"status": "ok", "message": "NexusProcure Backend API is running."}

# Register Routers
from controllers import auth, knowledgebase, opportunities, negotiations, savings, chat

app.include_router(auth.router)
app.include_router(knowledgebase.router)
app.include_router(opportunities.router)
app.include_router(negotiations.router)
app.include_router(savings.router)
app.include_router(chat.router)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8002))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
