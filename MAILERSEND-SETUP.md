# 📧 Configuration MailerSend pour la vérification d'email

## ✅ Ce qui a été fait

1. **SDK MailerSend installé** : `mailersend==2.1.0` ajouté à `requirements.txt`
2. **Module email créé** : `app/back/core/email.py` avec le service d'envoi d'emails
3. **Configuration ajoutée** : Variables MailerSend dans `core/config.py`
4. **Route mise à jour** : `/auth/verify-email/send` utilise maintenant MailerSend
5. **Template HTML créé** : Email de vérification avec design moderne

## 🔧 Configuration en local

1. **Crée un compte MailerSend** : https://www.mailersend.com/
2. **Génère une clé API** :
   - Va dans Settings → API Tokens
   - Crée un nouveau token
   - Copie la clé API

3. **Configure ton `.env`** dans `app/back/.env` :
```bash
MAILERSEND_API_KEY=mlsn.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILERSEND_FROM_EMAIL=noreply@lifeplanner.app
MAILERSEND_FROM_NAME=Life Planner
```

4. **Vérifie un domaine ou utilise l'email de test** :
   - MailerSend fournit un email de test pour le développement
   - Pour la production, tu dois vérifier un domaine
   - Va dans Domains → Add Domain et suis les instructions DNS

## 🚀 Configuration en production (Railway)

1. **Va dans Railway Dashboard** → ton projet → Variables
2. **Ajoute ces variables** :

| Variable | Valeur |
|----------|--------|
| `MAILERSEND_API_KEY` | *(ta clé API MailerSend)* |
| `MAILERSEND_FROM_EMAIL` | `noreply@lifeplanner.app` *(ou ton email vérifié)* |
| `MAILERSEND_FROM_NAME` | `Life Planner` |

3. **Vérifie ton domaine dans MailerSend** :
   - Va dans MailerSend Dashboard → Domains
   - Ajoute ton domaine (ex: `lifeplanner.app`)
   - Configure les enregistrements DNS (SPF, DKIM, DMARC)
   - Une fois vérifié, utilise un email de ce domaine pour `MAILERSEND_FROM_EMAIL`

## 📝 Utilisation

Une fois configuré, quand un utilisateur clique sur "Vérifier" dans son profil :
1. Un token de vérification est généré
2. Un email est envoyé via MailerSend avec le lien de vérification
3. L'utilisateur clique sur le lien dans l'email
4. Son email est marqué comme vérifié

## 🧪 Test en local

Si `MAILERSEND_API_KEY` n'est pas configuré, le système fonctionne en mode dev :
- L'URL de vérification est loggée dans la console
- Tu peux copier/coller l'URL pour tester la vérification

## 📚 Documentation

- MailerSend API : https://developers.mailersend.com/api/v1/email.html
- SDK Python : https://github.com/mailersend/mailersend-python

## ⚠️ Notes importantes

- **Limite gratuite** : 100 emails/jour avec le plan gratuit
- **Vérification de domaine** : Obligatoire en production pour éviter le spam
- **Fallback** : Si MailerSend échoue, l'URL est loggée (mode dev uniquement)

