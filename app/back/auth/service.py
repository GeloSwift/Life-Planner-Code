"""
Business logic for authentication.

Le service contient la logique métier, séparée des routes HTTP.
Cela permet de:
- Réutiliser la logique dans différentes routes
- Tester la logique indépendamment des routes
- Garder les routes simples et lisibles

Documentation:
https://fastapi.tiangolo.com/tutorial/bigger-applications/
"""

from sqlalchemy.orm import Session
from sqlalchemy import select

from auth.models import User
from auth.schemas import UserCreate, UserUpdate
from core.security import hash_password, verify_password


def get_user_by_email(db: Session, email: str) -> User | None:
    """
    Récupère un utilisateur par son email.
    
    Args:
        db: Session de base de données
        email: Email à rechercher
        
    Returns:
        User si trouvé, None sinon
    """
    stmt = select(User).where(User.email == email)
    return db.execute(stmt).scalar_one_or_none()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """
    Récupère un utilisateur par son ID.
    
    Args:
        db: Session de base de données
        user_id: ID à rechercher
        
    Returns:
        User si trouvé, None sinon
    """
    return db.get(User, user_id)


def create_user(db: Session, user_data: UserCreate) -> User:
    """
    Crée un nouvel utilisateur.
    
    Args:
        db: Session de base de données
        user_data: Données de l'utilisateur (email, password, full_name)
        
    Returns:
        Utilisateur créé
        
    Le mot de passe est haché avant d'être stocké.
    """
    user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)  # Recharge l'objet pour obtenir l'ID généré
    return user


def update_user(db: Session, user: User, user_data: UserUpdate) -> User:
    """
    Met à jour un utilisateur existant.
    
    Args:
        db: Session de base de données
        user: Utilisateur à modifier
        user_data: Nouvelles données
        
    Returns:
        Utilisateur mis à jour
    """
    update_data = user_data.model_dump(exclude_unset=True)
    
    # Si le mot de passe est modifié, on le hache
    if "password" in update_data:
        update_data["hashed_password"] = hash_password(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """
    Authentifie un utilisateur avec email et mot de passe.
    
    Args:
        db: Session de base de données
        email: Email de l'utilisateur
        password: Mot de passe en clair
        
    Returns:
        User si authentification réussie, None sinon
        
    Étapes:
    1. Recherche l'utilisateur par email
    2. Vérifie le mot de passe
    3. Vérifie que le compte est actif
    """
    user = get_user_by_email(db, email)
    
    if not user:
        return None
    
    if not verify_password(password, user.hashed_password):
        return None
    
    if not user.is_active:
        return None
    
    return user

