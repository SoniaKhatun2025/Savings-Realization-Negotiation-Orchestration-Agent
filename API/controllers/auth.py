from fastapi import APIRouter, HTTPException, Depends
from database.connection import get_db_connection
from database.queries import GET_USER_BY_EMAIL
from database.models import UserLogin, Token
from utils.security import get_password_hash, verify_password, create_access_token
from utils.helpers import format_api_response

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(user: UserLogin):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(GET_USER_BY_EMAIL, (user.email,))
    db_user = cursor.fetchone()
    conn.close()
    
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    access_token = create_access_token(
        data={"sub": str(db_user["id"]), "role": db_user["role"], "name": db_user["name"]}
    )
    
    return {"access_token": access_token, "token_type": "bearer", "role": db_user["role"], "name": db_user["name"]}
