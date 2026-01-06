"""
Synchronisation avec Apple Calendar via CalDAV.

Ce module permet de :
- Connecter un compte iCloud via mot de passe d'application
- Créer/mettre à jour/supprimer des événements dans Apple Calendar
- Synchroniser automatiquement les séances planifiées

Configuration requise :
    L'utilisateur doit créer un mot de passe d'application sur appleid.apple.com
    et le fournir lors de la connexion.

Basé sur le protocole CalDAV : https://www.aurinko.io/blog/caldav-apple-calendar-integration/
"""

from typing import Optional
from datetime import datetime, timedelta
import httpx
import uuid
from base64 import b64encode

from core.config import settings


# =============================================================================
# CalDAV Authentication & Discovery
# =============================================================================

def get_auth_header(apple_id: str, app_password: str) -> str:
    """
    Génère l'en-tête d'authentification Basic pour CalDAV.
    """
    credentials = f"{apple_id}:{app_password}"
    encoded = b64encode(credentials.encode()).decode()
    return f"Basic {encoded}"


async def discover_caldav_server(apple_id: str, app_password: str) -> dict:
    """
    Découvre le serveur CalDAV de l'utilisateur et récupère les informations principales.
    
    Returns:
        Dict avec:
            - principal_url: URL du principal de l'utilisateur
            - calendar_home: URL du calendrier home
            - calendars: Liste des calendriers disponibles
    """
    auth_header = get_auth_header(apple_id, app_password)
    
    # Étape 1: Trouver le principal de l'utilisateur
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Requête PROPFIND pour trouver le principal
        response = await client.request(
            method="PROPFIND",
            url="https://caldav.icloud.com/",
            headers={
                "Authorization": auth_header,
                "Content-Type": "application/xml; charset=utf-8",
                "Depth": "0",
            },
            content="""<?xml version="1.0" encoding="utf-8" ?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:current-user-principal/>
  </d:prop>
</d:propfind>""",
        )
        
        if response.status_code != 207:
            raise ValueError(f"Échec de la découverte CalDAV: {response.status_code} - {response.text}")
        
        # Parser la réponse XML pour extraire le principal
        import xml.etree.ElementTree as ET
        root = ET.fromstring(response.text)
        
        # Namespace DAV:
        ns = {"d": "DAV:"}
        
        principal_href = None
        for href_elem in root.findall(".//d:current-user-principal/d:href", ns):
            principal_href = href_elem.text
            break
        
        if not principal_href:
            raise ValueError("Principal non trouvé dans la réponse")
        
        # Étape 2: Découvrir le calendar-home-set
        principal_url = f"https://caldav.icloud.com{principal_href}"
        
        response = await client.request(
            method="PROPFIND",
            url=principal_url,
            headers={
                "Authorization": auth_header,
                "Content-Type": "application/xml; charset=utf-8",
                "Depth": "0",
            },
            content="""<?xml version="1.0" encoding="utf-8" ?>
<d:propfind xmlns:d="DAV:" xmlns:cal="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <cal:calendar-home-set/>
  </d:prop>
</d:propfind>""",
        )
        
        if response.status_code != 207:
            raise ValueError(f"Échec de la récupération du calendar-home: {response.status_code}")
        
        root = ET.fromstring(response.text)
        ns["cal"] = "urn:ietf:params:xml:ns:caldav"
        
        calendar_home = None
        for href_elem in root.findall(".//cal:calendar-home-set/d:href", ns):
            calendar_home = href_elem.text
            break
        
        if not calendar_home:
            raise ValueError("Calendar home non trouvé")
        
        # Étape 3: Lister les calendriers disponibles
        response = await client.request(
            method="PROPFIND",
            url=calendar_home,
            headers={
                "Authorization": auth_header,
                "Content-Type": "application/xml; charset=utf-8",
                "Depth": "1",
            },
            content="""<?xml version="1.0" encoding="utf-8" ?>
<d:propfind xmlns:d="DAV:" xmlns:cal="urn:ietf:params:xml:ns:caldav" xmlns:apple="http://apple.com/ns/ical/">
  <d:prop>
    <d:resourcetype/>
    <d:displayname/>
    <apple:calendar-color/>
    <cal:supported-calendar-component-set/>
  </d:prop>
</d:propfind>""",
        )
        
        if response.status_code != 207:
            raise ValueError(f"Échec de la liste des calendriers: {response.status_code}")
        
        root = ET.fromstring(response.text)
        ns["apple"] = "http://apple.com/ns/ical/"
        
        # Extraire le serveur de base depuis calendar_home pour construire les URLs complètes
        from urllib.parse import urlparse
        parsed_home = urlparse(calendar_home)
        base_url = f"{parsed_home.scheme}://{parsed_home.netloc}"
        
        calendars = []
        for response_elem in root.findall(".//d:response", ns):
            href = response_elem.find("d:href", ns)
            displayname = response_elem.find(".//d:displayname", ns)
            resourcetype = response_elem.find(".//d:resourcetype", ns)
            
            # Vérifier que c'est un calendrier (pas juste une collection)
            is_calendar = resourcetype is not None and resourcetype.find("cal:calendar", ns) is not None
            
            if is_calendar and href is not None:
                # Construire l'URL complète si c'est un chemin relatif
                calendar_href = href.text
                if calendar_href and not calendar_href.startswith("http"):
                    calendar_href = f"{base_url}{calendar_href}"
                
                calendars.append({
                    "href": calendar_href,
                    "name": displayname.text if displayname is not None else "Calendrier",
                })
        
        return {
            "principal_url": principal_url,
            "calendar_home": calendar_home,
            "calendars": calendars,
        }


async def verify_caldav_credentials(apple_id: str, app_password: str) -> bool:
    """
    Vérifie que les identifiants CalDAV sont valides.
    """
    try:
        await discover_caldav_server(apple_id, app_password)
        return True
    except Exception:
        return False


# =============================================================================
# Calendar Events (iCalendar format)
# =============================================================================

def build_icalendar_event(
    uid: str,
    title: str,
    description: str,
    start_time: datetime,
    end_time: datetime,
) -> str:
    """
    Construit un événement au format iCalendar (ICS).
    """
    # Formater les dates au format iCalendar
    def format_datetime(dt: datetime) -> str:
        return dt.strftime("%Y%m%dT%H%M%S")
    
    now = datetime.utcnow()
    
    # Échapper les sauts de ligne pour iCalendar (doit être fait avant le f-string)
    newline_escape = "\\n"
    escaped_description = description.replace("\n", newline_escape)
    
    return f"""BEGIN:VCALENDAR
CALSCALE:GREGORIAN
PRODID:-//Life Planner//Workout Sessions//FR
VERSION:2.0
BEGIN:VEVENT
UID:{uid}
CREATED:{format_datetime(now)}Z
DTSTAMP:{format_datetime(now)}Z
DTSTART;TZID=Europe/Paris:{format_datetime(start_time)}
DTEND;TZID=Europe/Paris:{format_datetime(end_time)}
LAST-MODIFIED:{format_datetime(now)}Z
SEQUENCE:0
SUMMARY:{title}
DESCRIPTION:{escaped_description}
CATEGORIES:Sport,Entraînement
X-APPLE-CALENDAR-COLOR:#FF3B30
X-APPLE-LOCAL-DEFAULT-ALARM:PT30M
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Reminder
TRIGGER:-PT30M
END:VALARM
END:VEVENT
END:VCALENDAR
"""


async def create_caldav_event(
    apple_id: str,
    app_password: str,
    calendar_url: str,
    title: str,
    description: str,
    start_time: datetime,
    end_time: Optional[datetime] = None,
) -> str:
    """
    Crée un événement dans Apple Calendar via CalDAV.
    
    Returns:
        L'UID de l'événement créé
    """
    if end_time is None:
        end_time = start_time + timedelta(hours=1)
    
    auth_header = get_auth_header(apple_id, app_password)
    event_uid = str(uuid.uuid4())
    event_url = f"{calendar_url}{event_uid}.ics"
    
    ics_content = build_icalendar_event(
        uid=event_uid,
        title=title,
        description=description,
        start_time=start_time,
        end_time=end_time,
    )
    
    async with httpx.AsyncClient() as client:
        response = await client.put(
            event_url,
            headers={
                "Authorization": auth_header,
                "Content-Type": "text/calendar; charset=utf-8",
            },
            content=ics_content,
        )
        
        if response.status_code not in (200, 201, 204):
            raise ValueError(f"Échec de la création de l'événement: {response.status_code} - {response.text}")
        
        return event_uid


async def update_caldav_event(
    apple_id: str,
    app_password: str,
    calendar_url: str,
    event_uid: str,
    title: str,
    description: str,
    start_time: datetime,
    end_time: Optional[datetime] = None,
) -> str:
    """
    Met à jour un événement existant dans Apple Calendar.
    """
    if end_time is None:
        end_time = start_time + timedelta(hours=1)
    
    auth_header = get_auth_header(apple_id, app_password)
    event_url = f"{calendar_url}{event_uid}.ics"
    
    ics_content = build_icalendar_event(
        uid=event_uid,
        title=title,
        description=description,
        start_time=start_time,
        end_time=end_time,
    )
    
    async with httpx.AsyncClient() as client:
        response = await client.put(
            event_url,
            headers={
                "Authorization": auth_header,
                "Content-Type": "text/calendar; charset=utf-8",
            },
            content=ics_content,
        )
        
        if response.status_code not in (200, 201, 204):
            raise ValueError(f"Échec de la mise à jour de l'événement: {response.status_code}")
        
        return event_uid


async def delete_caldav_event(
    apple_id: str,
    app_password: str,
    calendar_url: str,
    event_uid: str,
) -> bool:
    """
    Supprime un événement d'Apple Calendar.
    """
    auth_header = get_auth_header(apple_id, app_password)
    event_url = f"{calendar_url}{event_uid}.ics"
    
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            event_url,
            headers={
                "Authorization": auth_header,
            },
        )
        
        return response.status_code in (200, 204, 404)


# =============================================================================
# Helper pour synchronisation avec les sessions
# =============================================================================

def build_session_description_caldav(
    session_id: int,
    activity_types: list[str],
    exercises: list[dict],
    frontend_url: str,
) -> str:
    """
    Construit une description claire et organisée pour l'événement CalDAV.
    Hiérarchie visuelle optimisée pour une lecture rapide.
    """
    lines = []
    
    # === INFORMATIONS ESSENTIELLES ===
    if activity_types:
        lines.append("════════════════════════════════")
        lines.append(f"ACTIVITÉS: {', '.join(activity_types)}")
        lines.append("════════════════════════════════")
        lines.append("")
    
    # === EXERCICES (Informations détaillées) ===
    if exercises:
        lines.append("EXERCICES PLANIFIÉS:")
        lines.append("─" * 30)
        for idx, ex in enumerate(exercises[:10], 1):  # Max 10 exercices
            name = ex.get("name", "Exercice")
            sets = ex.get("sets", "")
            reps = ex.get("reps", "")
            weight = ex.get("weight", "")
            
            details = []
            if sets:
                details.append(f"{sets} séries")
            if reps:
                details.append(f"{reps} reps")
            if weight:
                details.append(f"{weight}kg")
            
            detail_str = f" → {', '.join(details)}" if details else ""
            lines.append(f"{idx}. {name}{detail_str}")
        
        if len(exercises) > 10:
            lines.append(f"... et {len(exercises) - 10} exercice(s) supplémentaire(s)")
        
        lines.append("")
    
    # === ACTION RAPIDE ===
    lines.append("════════════════════════════════")
    session_url = f"{frontend_url}/workout/sessions/{session_id}"
    lines.append(f"🚀 LANCER LA SÉANCE")
    lines.append(session_url)
    lines.append("════════════════════════════════")
    
    return "\\n".join(lines)


async def sync_session_to_apple_calendar(
    apple_id: str,
    app_password: str,
    calendar_url: str,
    session_id: int,
    session_name: str,
    activity_types: list[str],
    scheduled_at: datetime,
    exercises: Optional[list[dict]] = None,
    existing_event_uid: Optional[str] = None,
) -> Optional[str]:
    """
    Synchronise une session avec Apple Calendar via CalDAV.
    
    Returns:
        L'UID de l'événement Apple Calendar (à stocker en DB)
    """
    try:
        frontend_url = settings.FRONTEND_URL or "https://mylifeplanner.space"
        description = build_session_description_caldav(
            session_id,
            activity_types,
            exercises or [],
            frontend_url,
        )
        
        if existing_event_uid:
            return await update_caldav_event(
                apple_id,
                app_password,
                calendar_url,
                existing_event_uid,
                session_name,
                description,
                scheduled_at,
            )
        else:
            return await create_caldav_event(
                apple_id,
                app_password,
                calendar_url,
                session_name,
                description,
                scheduled_at,
            )
        
    except Exception as e:
        print(f"Apple Calendar sync error: {e}")
        return existing_event_uid


async def delete_session_from_apple_calendar(
    apple_id: str,
    app_password: str,
    calendar_url: str,
    event_uid: str,
) -> bool:
    """
    Supprime une session d'Apple Calendar.
    """
    try:
        return await delete_caldav_event(apple_id, app_password, calendar_url, event_uid)
    except Exception as e:
        print(f"Apple Calendar delete error: {e}")
        return False
