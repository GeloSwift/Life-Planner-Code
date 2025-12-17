"""
Security utilities: password hashing and JWT tokens.

Ce module gère:
- Le hachage sécurisé des mots de passe (bcrypt)
- La création et vérification des tokens JWT

Documentation:
https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/
"""

from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

from core.config import settings


# Context pour le hachage des mots de passe
# - bcrypt: algorithme de hachage recommandé (lent = résistant aux attaques brute force)
# - deprecated="auto": gère automatiquement les anciens schémas de hachage
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hache un mot de passe en clair.
    
    Args:
        password: Mot de passe en clair
        
    Returns:
        Hash du mot de passe (stocké en base de données)
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Vérifie qu'un mot de passe correspond à son hash.
    
    Args:
        plain_password: Mot de passe en clair (saisi par l'utilisateur)
        hashed_password: Hash stocké en base de données
        
    Returns:
        True si le mot de passe est correct, False sinon
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Crée un token JWT d'accès.
    
    Args:
        data: Données à encoder dans le token (ex: {"sub": user_id})
        expires_delta: Durée de validité du token
        
    Returns:
        Token JWT encodé
        
    Le token contient:
    - sub (subject): identifiant de l'utilisateur
    - exp (expiration): date d'expiration
    - iat (issued at): date de création
    - type: type de token (access ou refresh)
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
    })
    
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_refresh_token(data: dict) -> str:
    """
    Crée un token JWT de rafraîchissement (longue durée).
    
    Le refresh token permet d'obtenir un nouveau access token
    sans redemander le mot de passe à l'utilisateur.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh",
    })
    
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_token(token: str) -> dict | None:
    """
    Décode et vérifie un token JWT.
    
    Args:
        token: Token JWT à décoder
        
    Returns:
        Payload du token si valide, None sinon
        
    Raises:
        jwt.ExpiredSignatureError: Token expiré
        jwt.InvalidTokenError: Token invalide
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except jwt.PyJWTError:
        return None


def create_email_verification_token(user_id: int, email: str) -> str:
    """
    Crée un token JWT pour la vérification d'email.
    
    Le token expire après 24 heures.
    
    Args:
        user_id: ID de l'utilisateur
        email: Email à vérifier
        
    Returns:
        Token JWT de vérification d'email
    """
    to_encode = {
        "sub": str(user_id),
        "email": email,
        "type": "email_verification",
    }
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    })
    
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_password_reset_token(user_id: int, email: str) -> str:
    """
    Crée un token JWT pour la réinitialisation de mot de passe.
    
    Le token expire après 1 heure.
    
    Args:
        user_id: ID de l'utilisateur
        email: Email de l'utilisateur
        
    Returns:
        Token JWT de réinitialisation de mot de passe
    """
    to_encode = {
        "sub": str(user_id),
        "email": email,
        "type": "password_reset",
    }
    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    })
    
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )