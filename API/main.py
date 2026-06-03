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
        cursor = conn.cursor()
        try:
            cursor.execute("ALTER TABLE uploaded_documents ADD COLUMN storage_url VARCHAR(500) AFTER filename;")
        except Exception:
            pass
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
from controllers import auth, knowledgebase, opportunities, negotiations, savings, chat, cpo, category_manager, finance, notifications

# Register Routers (with /api prefix for new spec)
app.include_router(auth.router, prefix="/api")
app.include_router(auth.router_audit, prefix="/api")
app.include_router(knowledgebase.router, prefix="/api")
app.include_router(opportunities.router, prefix="/api")
app.include_router(opportunities.router_tasks, prefix="/api")
app.include_router(opportunities.router_suppliers, prefix="/api")
app.include_router(negotiations.router, prefix="/api")
app.include_router(negotiations.router_singular, prefix="/api")
app.include_router(savings.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(cpo.router, prefix="/api")
app.include_router(cpo.router_dashboard, prefix="/api")
app.include_router(category_manager.router, prefix="/api")
app.include_router(finance.router, prefix="/api")
app.include_router(finance.router_savings, prefix="/api")
app.include_router(notifications.router, prefix="/api")

# Register Routers (without prefix for backward compatibility with existing UI)
app.include_router(auth.router)
app.include_router(auth.router_audit)
app.include_router(knowledgebase.router)
app.include_router(opportunities.router)
app.include_router(opportunities.router_tasks)
app.include_router(opportunities.router_suppliers)
app.include_router(negotiations.router)
app.include_router(negotiations.router_singular)
app.include_router(savings.router)
app.include_router(chat.router)
app.include_router(cpo.router)
app.include_router(cpo.router_dashboard)
app.include_router(category_manager.router)
app.include_router(finance.router)
app.include_router(finance.router_savings)
app.include_router(notifications.router)

if __name__ == "__main__":
    # Force reload
    port = int(os.getenv("PORT", 8002))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
