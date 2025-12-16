# 🧪 Guide de test de la vérification d'email en production

## ✅ Configuration requise

1. **MailerSend configuré** :
   - Clé API ajoutée dans Railway : `MAILERSEND_API_KEY`
   - Email d'expéditeur configuré : `MAILERSEND_FROM_EMAIL` (doit être vérifié dans MailerSend)
   - Nom d'expéditeur : `MAILERSEND_FROM_NAME`

2. **Frontend déployé** sur Vercel avec :
   - `NEXT_PUBLIC_API_URL` pointant vers l'API Railway
   - `NEXT_PUBLIC_APP_URL` pointant vers l'URL Vercel

## 🧪 Étapes de test

### 1. Test de l'envoi d'email

1. **Connecte-toi** sur https://life-planner-code.vercel.app
2. **Va sur la page de profil** : https://life-planner-code.vercel.app/profile
3. **Clique sur le bouton "Vérifier"** à côté de "Email vérifié : Non"
4. **Vérifie les logs Railway** :
   - Va dans Railway Dashboard → ton projet → Deployments → Logs
   - Tu devrais voir soit :
     - `[EMAIL] Failed to send verification email...` (si erreur)
     - Ou pas d'erreur (si succès)

5. **Vérifie ta boîte email** :
   - L'email devrait arriver dans quelques secondes
   - Vérifie aussi les spams si tu ne le vois pas

### 2. Test de la vérification

1. **Ouvre l'email** reçu
2. **Clique sur le bouton "Vérifier mon email"** ou copie le lien
3. **Tu devrais être redirigé** vers :
   - `https://life-planner-code.vercel.app/auth/verify-email?token=...`
4. **La page affiche** :
   - ✅ "Email vérifié !" si succès
   - ❌ "Erreur de vérification" si le token est invalide/expiré
5. **Retourne sur le profil** :
   - L'email devrait maintenant être marqué comme "✅ Oui"

## 🔍 Dépannage

### L'email n'arrive pas

1. **Vérifie les logs Railway** :
   ```bash
   # Dans Railway Dashboard → Logs
   # Cherche les erreurs [EMAIL]
   ```

2. **Vérifie MailerSend Dashboard** :
   - Va sur https://app.mailersend.com/
   - Vérifie l'onglet "Activity" pour voir si l'email a été envoyé
   - Vérifie les erreurs éventuelles

3. **Vérifie la configuration** :
   - `MAILERSEND_API_KEY` est bien configurée dans Railway
   - `MAILERSEND_FROM_EMAIL` est un email vérifié dans MailerSend
   - Le domaine est vérifié dans MailerSend (pour la production)

### Le lien de vérification ne fonctionne pas

1. **Vérifie que le token est valide** :
   - Le token expire après 24 heures
   - Demande un nouvel email si nécessaire

2. **Vérifie les logs Railway** :
   - Cherche les erreurs lors de la vérification
   - Vérifie que la route `/auth/verify-email` fonctionne

3. **Teste l'API directement** :
   ```bash
   # Récupère le token depuis l'email
   curl "https://life-planner-code-production.up.railway.app/auth/verify-email?token=TON_TOKEN"
   ```

## 📊 Monitoring

### Logs à surveiller

- **Succès** : Pas d'erreur dans les logs
- **Erreur MailerSend** : `[EMAIL] Failed to send verification email...`
- **Erreur de vérification** : Erreurs HTTP 400/404 dans les logs

### MailerSend Dashboard

- Va sur https://app.mailersend.com/ → Activity
- Tu peux voir tous les emails envoyés
- Vérifie le statut de délivrabilité

## 🎯 Test complet

1. ✅ Créer un compte (ou utiliser un compte existant)
2. ✅ Aller sur /profile
3. ✅ Cliquer sur "Vérifier"
4. ✅ Recevoir l'email
5. ✅ Cliquer sur le lien de vérification
6. ✅ Vérifier que l'email est marqué comme vérifié dans le profil

## 💡 Notes

- **Limite gratuite** : 100 emails/jour avec MailerSend gratuit
- **Domaine vérifié** : Obligatoire en production pour éviter le spam
- **Fallback** : Si MailerSend n'est pas configuré, l'URL est loggée (dev uniquement)

