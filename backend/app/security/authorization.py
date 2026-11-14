from typing import List
from fastapi import Depends, HTTPException, status
from backend.app.models.user import User
from backend.app.security.authentication import get_current_user


def require_roles(allowed_roles: List[str]):
    """
    Factory dependency to ensure the user has one of the specified roles.
    Roles: 'admin', 'investigator', 'user', 'guest'.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = (current_user.role or "user").lower()
        normalized_allowed = [r.lower() for r in allowed_roles]
        if user_role not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of the roles {allowed_roles}, but user has role '{current_user.role}'"
            )
        return current_user
    return role_checker
