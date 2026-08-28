from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

from database import init_db, get_db
from auth import (
    create_access_token,
    authenticate_user,
    get_current_user,
    get_password_hash,
)
from models import User
from graph_data import (
    get_graph_data,
    find_shortest_path,
    get_ai_context,
)
from ai import extract_entities, ask_assistant

load_dotenv()

app = FastAPI(title="Criminal Network Analysis API", version="1.0.0")

CORS_ORIGINS = os.getenv("CORS_ALLOW_ORIGINS", "https://eng25cs0577-ctrl.github.io/criminal-network-analysis/").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SignupRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True


class PathRequest(BaseModel):
    source: int
    target: int


class PathResponse(BaseModel):
    path: list[int]
    found: bool


class ExtractEntitiesRequest(BaseModel):
    text: str


class ExtractEntitiesResponse(BaseModel):
    people: list[str]
    phones: list[str]
    vehicles: list[str]
    locations: list[str]


class AskAssistantRequest(BaseModel):
    question: str


class AskAssistantResponse(BaseModel):
    answer: str


_graph_cache = None


def get_cached_graph():
    global _graph_cache
    if _graph_cache is None:
        _graph_cache = get_graph_data()
    return _graph_cache


@app.on_event("startup")
def startup_event():
    init_db()
    get_cached_graph()


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "criminal-network-analysis"}


@app.post("/auth/signup", response_model=TokenResponse)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    hashed = get_password_hash(request.password)
    user = User(email=request.email, hashed_password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(data={"sub": user.email})
    return TokenResponse(access_token=token)


@app.post("/auth/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(data={"sub": user.email})
    return TokenResponse(access_token=token)


@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.get("/api/graph")
def get_graph(current_user: User = Depends(get_current_user)):
    data = get_cached_graph()
    return {
        "nodes": data["nodes"],
        "edges": data["edges"],
        "metrics": data["metrics"],
    }


@app.get("/api/path", response_model=PathResponse)
def get_path(source: int, target: int, current_user: User = Depends(get_current_user)):
    data = get_cached_graph()
    G = data["raw_graph"]
    path = find_shortest_path(G, source, target)
    return PathResponse(path=path, found=len(path) > 0)


@app.post("/api/ai/extract-entities", response_model=ExtractEntitiesResponse)
def api_extract_entities(request: ExtractEntitiesRequest, current_user: User = Depends(get_current_user)):
    try:
        result = extract_entities(request.text)
        return ExtractEntitiesResponse(**result)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Entity extraction error: {str(e)}")


@app.post("/api/ai/ask", response_model=AskAssistantResponse)
def api_ask_assistant(request: AskAssistantRequest, current_user: User = Depends(get_current_user)):
    try:
        data = get_cached_graph()
        context = get_ai_context(data)
        answer = ask_assistant(request.question, context)
        return AskAssistantResponse(answer=answer)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assistant error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host=host, port=port)
