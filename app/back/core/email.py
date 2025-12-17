"""
Email service using MailerSend.

Ce module gère l'envoi d'emails via MailerSend.
Documentation: https://developers.mailersend.com/api/v1/email.html
"""

from typing import Optional

# Import du package mailersend (version 2.0.0)
try:
    from mailersend import MailerSendClient, EmailBuilder
    mailersend_available = True
except ImportError as e:
    # Fallback pour éviter les erreurs si le package n'est pas installé
    print(f"[EMAIL] Import error: {e}")
    MailerSendClient = None  # type: ignore
    EmailBuilder = None  # type: ignore
    mailersend_available = False
except Exception as e:
    # Si tout échoue, on met None
    print(f"[EMAIL] Failed to import mailersend: {e}")
    MailerSendClient = None  # type: ignore
    EmailBuilder = None  # type: ignore
    mailersend_available = False

from core.config import settings


class EmailService:
    """Service pour l'envoi d'emails via MailerSend."""
    
    def __init__(self):
        """Initialise le service email avec la clé API MailerSend."""
        if not settings.MAILERSEND_API_KEY:
            raise ValueError("MAILERSEND_API_KEY is not configured")
        
        if not mailersend_available or MailerSendClient is None or EmailBuilder is None:
            raise ImportError(
                "mailersend package is not installed or cannot be imported. "
                "Install it with: pip install mailersend==2.0.0"
            )
        
        # Initialise MailerSend avec la clé API (nouvelle API v2.0.0)
        # Essayons différentes façons d'initialiser le client
        try:
            # Méthode 1: avec api_token
            self.client = MailerSendClient(api_token=settings.MAILERSEND_API_KEY)
        except TypeError:
            try:
                # Méthode 2: avec api_key
                self.client = MailerSendClient(api_key=settings.MAILERSEND_API_KEY)
            except TypeError:
                try:
                    # Méthode 3: avec token directement
                    self.client = MailerSendClient(settings.MAILERSEND_API_KEY)
                except Exception as e:
                    print(f"[EMAIL] Failed to initialize MailerSendClient: {e}")
                    print(f"[EMAIL] Trying to inspect MailerSendClient.__init__ signature...")
                    import inspect
                    try:
                        sig = inspect.signature(MailerSendClient.__init__)
                        print(f"[EMAIL] MailerSendClient.__init__ signature: {sig}")
                    except:
                        pass
                    raise
        
        self.from_email = settings.MAILERSEND_FROM_EMAIL
        self.from_name = settings.MAILERSEND_FROM_NAME
    
    def send_verification_email(
        self,
        to_email: str,
        to_name: Optional[str],
        verification_url: str,
    ) -> dict:
        """
        Envoie un email de vérification d'adresse email.
        
        Args:
            to_email: Email du destinataire
            to_name: Nom du destinataire (optionnel)
            verification_url: URL de vérification avec le token
            
        Returns:
            Réponse de MailerSend
            
        Raises:
            Exception: Si l'envoi échoue
        """
        # Template HTML de l'email de vérification
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Vérifiez votre email - Life Planner</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Life Planner</h1>
            </div>
            
            <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Vérifiez votre adresse email</h2>
                
                <p style="color: #666; font-size: 16px;">
                    Bonjour{(' ' + to_name) if to_name else ''},
                </p>
                
                <p style="color: #666; font-size: 16px;">
                    Merci de vous être inscrit sur Life Planner ! Pour finaliser votre inscription, 
                    veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_url}" 
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                              color: white; padding: 15px 30px; text-decoration: none; 
                              border-radius: 5px; font-weight: bold; font-size: 16px;">
                        Vérifier mon email
                    </a>
                </div>
                
                <p style="color: #999; font-size: 14px; margin-top: 30px;">
                    Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
                </p>
                <p style="color: #667eea; font-size: 12px; word-break: break-all;">
                    {verification_url}
                </p>
                
                <p style="color: #999; font-size: 14px; margin-top: 30px;">
                    Ce lien est valide pendant 24 heures.
                </p>
                
                <p style="color: #999; font-size: 14px; margin-top: 30px;">
                    Si vous n'avez pas créé de compte sur Life Planner, vous pouvez ignorer cet email.
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                <p>© {settings.MAILERSEND_FROM_NAME} - Tous droits réservés</p>
            </div>
        </body>
        </html>
        """
        
        # Version texte de l'email (fallback)
        text_content = f"""
        Bonjour{(' ' + to_name) if to_name else ''},

        Merci de vous être inscrit sur Life Planner ! Pour finaliser votre inscription, 
        veuillez vérifier votre adresse email en cliquant sur le lien ci-dessous :

        {verification_url}

        Ce lien est valide pendant 24 heures.

        Si vous n'avez pas créé de compte sur Life Planner, vous pouvez ignorer cet email.

        © {settings.MAILERSEND_FROM_NAME}
        """
        
        # Configure l'email selon l'API MailerSend v2.0.0
        try:
            email_builder = EmailBuilder()
            
            # Configure l'expéditeur
            email_builder.set_from(
                email=self.from_email,
                name=self.from_name
            )
            
            # Configure le destinataire
            email_builder.add_recipient(
                email=to_email,
                name=to_name or to_email
            )
            
            # Configure le sujet et le contenu
            email_builder.set_subject("Vérifiez votre email - Life Planner")
            email_builder.set_html(html_content)
            email_builder.set_text(text_content)
            
            # Construit l'objet Email
            email = email_builder.build()
            
            # Envoie l'email via le client
            # Essayons différentes méthodes
            try:
                response = self.client.email.send(email)
            except AttributeError:
                # Peut-être que c'est directement sur le client
                try:
                    response = self.client.send(email)
                except AttributeError:
                    # Ou peut-être une autre méthode
                    response = self.client.emails.send(email)
            
            return response
        except Exception as e:
            print(f"[EMAIL] Error building/sending email: {e}")
            print(f"[EMAIL] EmailBuilder methods: {dir(EmailBuilder())}")
            print(f"[EMAIL] Client methods: {dir(self.client)}")
            raise


# Instance globale du service email
_email_service: Optional[EmailService] = None


def get_email_service() -> Optional[EmailService]:
    """
    Retourne l'instance du service email.
    
    Retourne None si MailerSend n'est pas configuré (mode dev).
    """
    global _email_service
    
    if _email_service is None:
        if not settings.MAILERSEND_API_KEY:
            # En développement, on peut ne pas avoir MailerSend configuré
            return None
        
        try:
            _email_service = EmailService()
        except Exception as e:
            print(f"[EMAIL] Failed to initialize EmailService: {e}")
            return None
    
    return _email_service

