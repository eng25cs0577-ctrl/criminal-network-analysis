from sqlalchemy.orm import Session
from models import AuditLog
from datetime import datetime
from typing import Optional, Dict, Any
import json


def log_event(
    db: Session,
    action: str,
    user_id: Optional[int] = None,
    user_email: Optional[str] = None,
    resource: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    success: bool = True,
    error_message: Optional[str] = None,
) -> AuditLog:
    """Log an audit event to the database."""
    audit_log = AuditLog(
        user_id=user_id,
        user_email=user_email,
        action=action,
        resource=resource,
        resource_id=resource_id,
        details=json.dumps(details) if details else None,
        ip_address=ip_address,
        user_agent=user_agent,
        success=1 if success else 0,
        error_message=error_message,
    )
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log


def get_audit_logs(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    resource: Optional[str] = None,
    success: Optional[bool] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
):
    """Retrieve audit logs with optional filters."""
    query = db.query(AuditLog)

    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if resource:
        query = query.filter(AuditLog.resource == resource)
    if success is not None:
        query = query.filter(AuditLog.success == (1 if success else 0))
    if start_date:
        query = query.filter(AuditLog.timestamp >= start_date)
    if end_date:
        query = query.filter(AuditLog.timestamp <= end_date)

    return query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()


def get_audit_log_count(
    db: Session,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    resource: Optional[str] = None,
    success: Optional[bool] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> int:
    """Get total count of audit logs with filters."""
    query = db.query(AuditLog)

    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if resource:
        query = query.filter(AuditLog.resource == resource)
    if success is not None:
        query = query.filter(AuditLog.success == (1 if success else 0))
    if start_date:
        query = query.filter(AuditLog.timestamp >= start_date)
    if end_date:
        query = query.filter(AuditLog.timestamp <= end_date)

    return query.count()


# Action constants for consistency
class AuditAction:
    # Auth events
    USER_SIGNUP = "user.signup"
    USER_LOGIN = "user.login"
    USER_LOGOUT = "user.logout"
    USER_LOGIN_FAILED = "user.login_failed"
    TOKEN_REFRESH = "token.refresh"
    TOKEN_INVALID = "token.invalid"

    # Graph events
    GRAPH_VIEW = "graph.view"
    GRAPH_PATH_FIND = "graph.path_find"
    GRAPH_NODE_INSPECT = "graph.node_inspect"

    # AI events
    AI_ENTITY_EXTRACT = "ai.entity_extract"
    AI_ASSISTANT_QUERY = "ai.assistant_query"

    # Admin events
    AUDIT_LOG_VIEW = "audit.log_view"
    USER_LIST = "admin.user_list"
    USER_DELETE = "admin.user_delete"


class AuditResource:
    USER = "user"
    GRAPH = "graph"
    NODE = "node"
    PATH = "path"
    ENTITY_EXTRACTION = "entity_extraction"
    ASSISTANT = "assistant"
    AUDIT_LOG = "audit_log"