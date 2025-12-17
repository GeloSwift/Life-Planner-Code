# ✅ Configuration finale MailerSend - Domaine vérifié

## 🎉 Félicitations !

Ton domaine `mylifeplanner.space` est maintenant vérifié sur MailerSend et tu as généré le token API. Il ne reste plus qu'à configurer les variables d'environnement dans Railway.

## 📋 Étapes finales

### Étape 1 : Récupérer le token API

1. **Dans MailerSend Dashboard** → Domains → `mylifeplanner.space`
2. **Section "API token"** → Tu devrais voir ton token (ex: `mlsn.f670cc******`)
3. **Clique sur "Manage"** → **"View"** ou **"Copy"** pour copier le token complet
4. **⚠️ Important** : Copie le token complet (il commence par `mlsn.`)

### Étape 2 : Déterminer l'email d'expéditeur

Avec ton domaine vérifié `mylifeplanner.space`, tu peux utiliser n'importe quel email de ce domaine comme expéditeur.

**Recommandations** :
- `noreply@mylifeplanner.space` ✅ (recommandé - standard pour les emails automatiques)
- `no-reply@mylifeplanner.space` ✅
- `contact@mylifeplanner.space` ✅
- `support@mylifeplanner.space` ✅

**Choisis celui que tu préfères** (je recommande `noreply@mylifeplanner.space`).

### Étape 3 : Configurer les variables dans Railway

1. **Va dans Railway Dashboard** → ton projet backend → Variables
2. **Ajoute ou modifie ces variables** :

| Variable | Valeur | Exemple |
|----------|--------|---------|
| `MAILERSEND_API_KEY` | Ton token API complet | `mlsn.f670ccxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `MAILERSEND_FROM_EMAIL` | Email d'expéditeur | `noreply@mylifeplanner.space` |
| `MAILERSEND_FROM_NAME` | Nom de l'expéditeur | `Life Planner` |

**Exemple de configuration complète** :
```
MAILERSEND_API_KEY=mlsn.f670ccxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILERSEND_FROM_EMAIL=noreply@mylifeplanner.space
MAILERSEND_FROM_NAME=Life Planner
```

3. **Sauvegarde** les variables
4. **Railway va redéployer automatiquement** l'API (attends 2-3 minutes)

### Étape 4 : Vérifier la configuration

Une fois le déploiement terminé :

1. **Va sur** `https://www.mylifeplanner.space`
2. **Connecte-toi** ou **crée un compte**
3. **Va dans ton profil** (clique sur ton avatar en haut à droite)
4. **Clique sur "Vérifier mon email"**
5. **Vérifie ta boîte email** - tu devrais recevoir un email de vérification

### Étape 5 : Tester l'email reçu

L'email devrait :
- ✅ **Expéditeur** : `Life Planner <noreply@mylifeplanner.space>`
- ✅ **Sujet** : "Vérifiez votre email - Life Planner"
- ✅ **Contenu** : Un beau template HTML avec un bouton "Vérifier mon email"
- ✅ **Lien de vérification** : Clique sur le bouton ou le lien

## 🔍 Dépannage

### L'email n'arrive pas

1. **Vérifie les logs Railway** :
   - Va dans Railway Dashboard → Logs
   - Cherche les erreurs liées à MailerSend
   - Cherche `[EMAIL]` dans les logs

2. **Vérifie le spam** :
   - Regarde dans ton dossier spam/courrier indésirable
   - Les emails peuvent prendre quelques minutes à arriver

3. **Vérifie les variables Railway** :
   - Assure-toi que `MAILERSEND_API_KEY` est correct (commence par `mlsn.`)
   - Assure-toi que `MAILERSEND_FROM_EMAIL` utilise ton domaine vérifié (`@mylifeplanner.space`)

4. **Vérifie MailerSend Dashboard** :
   - Va dans Domains → `mylifeplanner.space`
   - Vérifie que le statut est toujours "Verified" ✅
   - Regarde la section "Sent" pour voir si l'email a été envoyé

### Erreur "MAILERSEND_API_KEY is not configured"

- Vérifie que la variable est bien ajoutée dans Railway
- Vérifie qu'il n'y a pas d'espaces avant/après la valeur
- Redéploie l'API si nécessaire

### Erreur "Failed to send verification email"

- Vérifie les logs Railway pour plus de détails
- Vérifie que le token API est valide dans MailerSend
- Vérifie que le domaine est toujours vérifié dans MailerSend

### L'email arrive mais le lien ne fonctionne pas

- Vérifie que `FRONTEND_URL` est bien configuré dans Railway (doit être `https://www.mylifeplanner.space`)
- Vérifie que le frontend est bien déployé sur Vercel
- Vérifie que la route `/auth/verify-email` existe dans le frontend

## 📊 Monitoring dans MailerSend

Tu peux suivre l'envoi des emails dans MailerSend :

1. **Va dans MailerSend Dashboard** → Domains → `mylifeplanner.space`
2. **Section "Email Statistics"** :
   - **Sent** : Nombre d'emails envoyés
   - **Delivered** : Emails livrés
   - **Rejected** : Emails rejetés
   - **Received** : Emails reçus (si tu as configuré l'inbound routing)

3. **Section "API token"** :
   - **Last used on** : Dernière utilisation du token
   - **Status** : Doit être "Active" ✅

## ✅ Checklist finale

- [ ] Token API copié depuis MailerSend
- [ ] `MAILERSEND_API_KEY` configuré dans Railway
- [ ] `MAILERSEND_FROM_EMAIL` configuré avec `@mylifeplanner.space`
- [ ] `MAILERSEND_FROM_NAME` configuré
- [ ] API redéployée sur Railway
- [ ] Test d'envoi d'email de vérification réussi
- [ ] Email reçu dans la boîte de réception
- [ ] Lien de vérification fonctionne

## 🎯 Résumé des variables Railway

Voici toutes les variables MailerSend à configurer dans Railway :

```bash
# MailerSend Configuration
MAILERSEND_API_KEY=mlsn.f670ccxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILERSEND_FROM_EMAIL=noreply@mylifeplanner.space
MAILERSEND_FROM_NAME=Life Planner
```

## 📝 Notes importantes

- **Limite gratuite** : 100 emails/jour avec le plan gratuit MailerSend
- **Domaine vérifié** : Obligatoire pour éviter que les emails aillent en spam
- **Token API** : Garde-le secret, ne le partage jamais publiquement
- **Email d'expéditeur** : Doit utiliser le domaine vérifié (`@mylifeplanner.space`)
- **Propagation** : Les changements peuvent prendre quelques minutes à être effectifs

## 🚀 C'est prêt !

Une fois toutes ces étapes terminées, ton système de vérification d'email est opérationnel ! Les utilisateurs pourront :
1. S'inscrire avec leur email
2. Recevoir un email de vérification
3. Cliquer sur le lien pour vérifier leur email
4. Leur compte sera marqué comme vérifié ✅

