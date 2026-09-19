from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv
from datetime import datetime
from typing import Optional, List, Dict, Any

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
from audit import (
    log_event,
    get_audit_logs,
    get_audit_log_count,
    AuditAction,
    AuditResource,
)

load_dotenv()

app = FastAPI(title="Criminal Network Analysis API", version="1.0.0")

CORS_ORIGINS = os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_client_info(request: Request) -> dict:
    """Extract client IP and user agent from request."""
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return {"ip_address": client_ip, "user_agent": user_agent}


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
def signup(request: SignupRequest, db: Session = Depends(get_db), req: Request = None):
    client_info = get_client_info(req) if req else {}
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        log_event(
            db, AuditAction.USER_SIGNUP, user_email=request.email,
            resource=AuditResource.USER, success=False,
            error_message="Email already registered", **client_info
        )
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
    log_event(
        db, AuditAction.USER_SIGNUP, user_id=user.id, user_email=user.email,
        resource=AuditResource.USER, resource_id=str(user.id),
        details={"email": user.email}, success=True, **client_info
    )
    return TokenResponse(access_token=token)


@app.post("/auth/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db), req: Request = None):
    client_info = get_client_info(req) if req else {}
    user = authenticate_user(db, request.email, request.password)
    if not user:
        log_event(
            db, AuditAction.USER_LOGIN_FAILED, user_email=request.email,
            resource=AuditResource.USER, success=False,
            error_message="Invalid credentials", **client_info
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(data={"sub": user.email})
    log_event(
        db, AuditAction.USER_LOGIN, user_id=user.id, user_email=user.email,
        resource=AuditResource.USER, resource_id=str(user.id),
        details={"email": user.email}, success=True, **client_info
    )
    return TokenResponse(access_token=token)


@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.post("/auth/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db), req: Request = None):
    client_info = get_client_info(req) if req else {}
    log_event(
        db, AuditAction.USER_LOGOUT, user_id=current_user.id, user_email=current_user.email,
        resource=AuditResource.USER, resource_id=str(current_user.id),
        success=True, **client_info
    )
    return {"message": "Logged out successfully"}


@app.get("/api/graph")
def get_graph(current_user: User = Depends(get_current_user), db: Session = Depends(get_db), req: Request = None):
    client_info = get_client_info(req) if req else {}
    data = get_cached_graph()
    log_event(
        db, AuditAction.GRAPH_VIEW, user_id=current_user.id, user_email=current_user.email,
        resource=AuditResource.GRAPH, success=True,
        details={"node_count": len(data["nodes"]), "edge_count": len(data["edges"])}, **client_info
    )
    return {
        "nodes": data["nodes"],
        "edges": data["edges"],
        "metrics": data["metrics"],
    }


@app.get("/api/path", response_model=PathResponse)
def get_path(source: int, target: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db), req: Request = None):
    client_info = get_client_info(req) if req else {}
    data = get_cached_graph()
    G = data["raw_graph"]
    path = find_shortest_path(G, source, target)
    log_event(
        db, AuditAction.GRAPH_PATH_FIND, user_id=current_user.id, user_email=current_user.email,
        resource=AuditResource.PATH, resource_id=f"{source}-{target}",
        details={"source": source, "target": target, "found": len(path) > 0, "path_length": len(path) if path else 0},
        success=True, **client_info
    )
    return PathResponse(path=path, found=len(path) > 0)


@app.post("/api/ai/extract-entities", response_model=ExtractEntitiesResponse)
def api_extract_entities(request: ExtractEntitiesRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db), req: Request = None):
    client_info = get_client_info(req) if req else {}
    try:
        result = extract_entities(request.text)
        log_event(
            db, AuditAction.AI_ENTITY_EXTRACT, user_id=current_user.id, user_email=current_user.email,
            resource=AuditResource.ENTITY_EXTRACTION, success=True,
            details={
                "text_length": len(request.text),
                "people_count": len(result.get("people", [])),
                "phones_count": len(result.get("phones", [])),
                "vehicles_count": len(result.get("vehicles", [])),
                "locations_count": len(result.get("locations", [])),
            }, **client_info
        )
        return ExtractEntitiesResponse(**result)
    except RuntimeError as e:
        log_event(
            db, AuditAction.AI_ENTITY_EXTRACT, user_id=current_user.id, user_email=current_user.email,
            resource=AuditResource.ENTITY_EXTRACTION, success=False,
            error_message=str(e), **client_info
        )
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        log_event(
            db, AuditAction.AI_ENTITY_EXTRACT, user_id=current_user.id, user_email=current_user.email,
            resource=AuditResource.ENTITY_EXTRACTION, success=False,
            error_message=str(e), **client_info
        )
        raise HTTPException(status_code=500, detail=f"Entity extraction error: {str(e)}")


@app.post("/api/ai/ask", response_model=AskAssistantResponse)
def api_ask_assistant(request: AskAssistantRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db), req: Request = None):
    client_info = get_client_info(req) if req else {}
    try:
        data = get_cached_graph()
        context = get_ai_context(data)
        answer = ask_assistant(request.question, context)
        log_event(
            db, AuditAction.AI_ASSISTANT_QUERY, user_id=current_user.id, user_email=current_user.email,
            resource=AuditResource.ASSISTANT, success=True,
            details={"question_length": len(request.question), "answer_length": len(answer)}, **client_info
        )
        return AskAssistantResponse(answer=answer)
    except RuntimeError as e:
        log_event(
            db, AuditAction.AI_ASSISTANT_QUERY, user_id=current_user.id, user_email=current_user.email,
            resource=AuditResource.ASSISTANT, success=False, error_message=str(e), **client_info
        )
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        log_event(
            db, AuditAction.AI_ASSISTANT_QUERY, user_id=current_user.id, user_email=current_user.email,
            resource=AuditResource.ASSISTANT, success=False, error_message=str(e), **client_info
        )
        raise HTTPException(status_code=500, detail=f"Assistant error: {str(e)}")


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    user_email: Optional[str]
    action: str
    resource: Optional[str]
    resource_id: Optional[str]
    details: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    success: bool
    error_message: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


class AuditLogsResponse(BaseModel):
    logs: List[AuditLogResponse]
    total: int
    skip: int
    limit: int


@app.get("/api/audit/logs", response_model=AuditLogsResponse)
def get_audit_logs_endpoint(
    skip: int = 0,
    limit: int = 50,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    resource: Optional[str] = None,
    success: Optional[bool] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    req: Request = None,
):
    client_info = get_client_info(req) if req else {}
    logs = get_audit_logs(
        db, skip=skip, limit=limit, user_id=user_id, action=action,
        resource=resource, success=success, start_date=start_date, end_date=end_date
    )
    total = get_audit_log_count(
        db, user_id=user_id, action=action, resource=resource,
        success=success, start_date=start_date, end_date=end_date
    )
    log_event(
        db, AuditAction.AUDIT_LOG_VIEW, user_id=current_user.id, user_email=current_user.email,
        resource=AuditResource.AUDIT_LOG, success=True,
        details={"filters": {"skip": skip, "limit": limit, "user_id": user_id, "action": action, "resource": resource}}, **client_info
    )
    return AuditLogsResponse(logs=logs, total=total, skip=skip, limit=limit)


@app.get("/api/audit/stats")
def get_audit_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    req: Request = None,
):
    client_info = get_client_info(req) if req else {}
    total_logs = get_audit_log_count(db)
    failed_logs = get_audit_log_count(db, success=False)
    successful_logs = get_audit_log_count(db, success=True)
    login_count = get_audit_log_count(db, action=AuditAction.USER_LOGIN)
    failed_login_count = get_audit_log_count(db, action=AuditAction.USER_LOGIN_FAILED)
    graph_views = get_audit_log_count(db, action=AuditAction.GRAPH_VIEW)
    path_finds = get_audit_log_count(db, action=AuditAction.GRAPH_PATH_FIND)
    ai_extractions = get_audit_log_count(db, action=AuditAction.AI_ENTITY_EXTRACT)
    ai_queries = get_audit_log_count(db, action=AuditAction.AI_ASSISTANT_QUERY)

    log_event(
        db, AuditAction.AUDIT_LOG_VIEW, user_id=current_user.id, user_email=current_user.email,
        resource=AuditResource.AUDIT_LOG, success=True, **client_info
    )

    return {
        "total_logs": total_logs,
        "successful_logs": successful_logs,
        "failed_logs": failed_logs,
        "success_rate": round(successful_logs / total_logs * 100, 2) if total_logs > 0 else 0,
        "by_action": {
            "logins": login_count,
            "failed_logins": failed_login_count,
            "graph_views": graph_views,
            "path_finds": path_finds,
            "ai_extractions": ai_extractions,
            "ai_queries": ai_queries,
        }
    }


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host=host, port=port)