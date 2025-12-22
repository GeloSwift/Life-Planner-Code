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

from auth.models import User, AuthProvider
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


def get_user_by_provider(
    db: Session,
    provider: AuthProvider,
    provider_user_id: str,
) -> User | None:
    """
    Récupère un utilisateur par son provider OAuth et son ID provider.
    
    Args:
        db: Session de base de données
        provider: Provider OAuth (google, apple)
        provider_user_id: ID unique chez le provider
        
    Returns:
        User si trouvé, None sinon
    """
    stmt = select(User).where(
        User.auth_provider == provider,
        User.provider_user_id == provider_user_id,
    )
    return db.execute(stmt).scalar_one_or_none()


def create_user(db: Session, user_data: UserCreate) -> User:
    """
    Crée un nouvel utilisateur avec email/password.
    
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
        auth_provider=AuthProvider.LOCAL,
    )
    db.add(user)
    db.commit()
    db.refresh(user)  # Recharge l'objet pour obtenir l'ID généré
    return user


def create_oauth_user(
    db: Session,
    email: str,
    full_name: str | None,
    provider: AuthProvider,
    provider_user_id: str,
    avatar_url: str | None = None,
) -> User:
    """
    Crée un nouvel utilisateur via OAuth.
    
    Args:
        db: Session de base de données
        email: Email de l'utilisateur
        full_name: Nom complet
        provider: Provider OAuth (google, apple)
        provider_user_id: ID unique chez le provider
        avatar_url: URL de l'avatar
        
    Returns:
        Utilisateur créé
        
    Les utilisateurs OAuth n'ont pas de mot de passe local.
    Leur email est considéré comme vérifié par le provider.
    """
    user = User(
        email=email,
        full_name=full_name,
        hashed_password=None,  # Pas de mot de passe pour OAuth
        auth_provider=provider,
        provider_user_id=provider_user_id,
        avatar_url=avatar_url,
        is_email_verified=True,  # OAuth = email vérifié
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_or_create_oauth_user(
    db: Session,
    email: str,
    full_name: str | None,
    provider: AuthProvider,
    provider_user_id: str,
    avatar_url: str | None = None,
) -> User:
    """
    Récupère ou crée un utilisateur OAuth.
    
    Si l'utilisateur existe déjà (via provider_user_id), le retourne.
    Si l'email existe avec un autre provider, lève une exception.
    Sinon, crée un nouvel utilisateur.
    
    Args:
        db: Session de base de données
        email: Email de l'utilisateur
        full_name: Nom complet
        provider: Provider OAuth (google, apple)
        provider_user_id: ID unique chez le provider
        avatar_url: URL de l'avatar
        
    Returns:
        Utilisateur existant ou créé
        
    Raises:
        ValueError: Si l'email existe avec un autre provider
    """
    # Cherche par provider_user_id
    user = get_user_by_provider(db, provider, provider_user_id)
    if user:
        # Mise à jour des infos si nécessaire
        # Ne pas écraser un avatar personnalisé (data URL) avec l'avatar Google
        # Les data URLs commencent par "data:image/" et indiquent une image uploadée par l'utilisateur
        if avatar_url and user.avatar_url != avatar_url:
            # Si l'avatar actuel est une data URL (image personnalisée), on ne l'écrase pas
            if not (user.avatar_url and user.avatar_url.startswith("data:image/")):
                user.avatar_url = avatar_url
                db.commit()
                db.refresh(user)
        return user
    
    # Cherche par email
    user = get_user_by_email(db, email)
    if user:
        # L'email existe avec un autre provider
        if user.auth_provider != provider:
            raise ValueError(
                f"Cet email est déjà associé à un compte {user.auth_provider.value}. "
                f"Connectez-vous avec {user.auth_provider.value} ou utilisez un autre email."
            )
        # Même provider mais provider_user_id différent? Peu probable, mais on gère
        return user
    
    # Crée un nouvel utilisateur OAuth
    return create_oauth_user(
        db=db,
        email=email,
        full_name=full_name,
        provider=provider,
        provider_user_id=provider_user_id,
        avatar_url=avatar_url,
    )


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
    
    # Les utilisateurs OAuth n'ont pas de mot de passe
    if user.auth_provider != AuthProvider.LOCAL:
        return None
    
    if not user.hashed_password:
        return None
    
    if not verify_password(password, user.hashed_password):
        return None
    
    if not user.is_active:
        return None
    
    return user

