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

3. **Vérifie ton domaine dans MailerSend** (voir section détaillée ci-dessous)

---

## 🌐 Configuration d'un domaine dans MailerSend

### 📋 Prérequis

Pour envoyer des emails en production, MailerSend nécessite la vérification d'un domaine. Cela permet d'améliorer la délivrabilité et d'éviter le spam.

### 🎯 Option 1 : Utiliser un domaine personnalisé (Recommandé)

Si tu as un domaine (ex: `lifeplanner.app`, `monapp.com`), voici comment le configurer :

#### Étape 1 : Créer le domaine dans MailerSend

1. **Va sur MailerSend Dashboard** : https://app.mailersend.com/
2. **Clique sur "Domains"** dans le menu de gauche
3. **Clique sur "Add Domain"**
4. **Entre ton domaine** (ex: `lifeplanner.app`) - **sans** `www` ou `https://`
5. **Clique sur "Add Domain"**

#### Étape 2 : Configurer les enregistrements DNS

MailerSend va te donner **3 types d'enregistrements DNS** à ajouter :

1. **SPF** (Sender Policy Framework)
2. **DKIM** (DomainKeys Identified Mail)
3. **DMARC** (Domain-based Message Authentication)

#### Étape 3 : Ajouter les enregistrements selon ton hébergeur

##### 🟢 Si tu utilises Vercel avec un domaine personnalisé

**Vercel peut gérer les DNS pour ton domaine !**

1. **Va dans Vercel Dashboard** → ton projet → Settings → Domains
2. **Ajoute ton domaine** si ce n'est pas déjà fait
3. **Vercel va te donner des serveurs DNS** (ex: `ns1.vercel-dns.com`)
4. **Configure ces serveurs DNS** chez ton registrar (ex: Namecheap, GoDaddy, etc.)

5. **Une fois le domaine configuré sur Vercel**, tu peux ajouter les enregistrements MailerSend :
   - Va dans Vercel Dashboard → ton projet → Settings → Domains → ton domaine
   - Clique sur "DNS Records" ou "DNS"
   - Ajoute les enregistrements TXT et CNAME fournis par MailerSend

**Exemple d'enregistrements à ajouter dans Vercel :**

```
Type: TXT
Name: @ (ou laisse vide selon Vercel)
Value: v=spf1 include:spf.mailersend.net ~all

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@lifeplanner.app

Type: CNAME
Name: mta._domainkey (ou le nom fourni par MailerSend)
Value: [valeur fournie par MailerSend]
```

##### 🟡 Si tu utilises un registrar (Namecheap, GoDaddy, etc.) directement

1. **Va sur le site de ton registrar** (ex: namecheap.com)
2. **Trouve la section "DNS" ou "Domain Management"**
3. **Ajoute les enregistrements** fournis par MailerSend :

**Exemple pour Namecheap :**
- Va dans Domain List → Manage → Advanced DNS
- Ajoute les enregistrements TXT et CNAME

**Exemple pour GoDaddy :**
- Va dans My Products → DNS
- Ajoute les enregistrements

##### 🔵 Si tu utilises Cloudflare (Gratuit et recommandé !)

Cloudflare offre un service DNS gratuit, même si tu n'utilises pas leur CDN :

1. **Crée un compte Cloudflare** : https://www.cloudflare.com/
2. **Ajoute ton site** → entre ton domaine
3. **Cloudflare va scanner tes DNS actuels**
4. **Change les serveurs DNS** chez ton registrar vers ceux de Cloudflare
5. **Une fois configuré**, va dans Cloudflare Dashboard → DNS → Records
6. **Ajoute les enregistrements** MailerSend (TXT et CNAME)

**Avantages Cloudflare :**
- ✅ Gratuit
- ✅ Interface simple
- ✅ Propagation DNS rapide
- ✅ Protection DDoS incluse

#### Étape 4 : Vérifier le domaine dans MailerSend

1. **Retourne sur MailerSend Dashboard** → Domains
2. **Clique sur ton domaine**
3. **MailerSend va vérifier automatiquement** les enregistrements DNS
4. **Attends 5-15 minutes** pour la propagation DNS
5. **Clique sur "Verify Domain"** ou actualise la page

**Statuts possibles :**
- ✅ **Verified** : Tout est bon, tu peux envoyer des emails !
- ⚠️ **Pending** : Les DNS sont en cours de propagation, attends un peu
- ❌ **Failed** : Vérifie que les enregistrements sont corrects

#### Étape 5 : Configurer l'email d'expéditeur

Une fois le domaine vérifié :

1. **Dans Railway**, mets à jour `MAILERSEND_FROM_EMAIL` :
   ```
   MAILERSEND_FROM_EMAIL=noreply@lifeplanner.app
   ```
   *(Remplace `lifeplanner.app` par ton domaine)*

2. **Redéploie l'API** sur Railway si nécessaire

### 🎯 Option 2 : Utiliser un sous-domaine (Alternative)

Si tu ne veux pas modifier les DNS de ton domaine principal, tu peux créer un sous-domaine :

1. **Crée un sous-domaine** dans ton registrar (ex: `mail.lifeplanner.app`)
2. **Configure les DNS** pour ce sous-domaine
3. **Ajoute ce sous-domaine** dans MailerSend
4. **Utilise** `noreply@mail.lifeplanner.app` comme `MAILERSEND_FROM_EMAIL`

### 🎯 Option 3 : Utiliser un domaine de test (Développement uniquement)

Pour tester rapidement sans configurer de DNS :

1. **MailerSend fournit un domaine de test** dans le dashboard
2. **Utilise cet email** pour `MAILERSEND_FROM_EMAIL` en développement
3. ⚠️ **Limite** : Les emails peuvent aller en spam, pas recommandé en production

### 📝 Exemple complet : Configuration avec Vercel + Cloudflare

1. **Achète un domaine** (ex: `lifeplanner.app` sur Namecheap)
2. **Configure Cloudflare** :
   - Ajoute le domaine dans Cloudflare
   - Change les serveurs DNS chez Namecheap vers Cloudflare
3. **Configure Vercel** :
   - Ajoute le domaine dans Vercel
   - Vercel va détecter Cloudflare automatiquement
4. **Configure MailerSend** :
   - Ajoute le domaine dans MailerSend
   - Copie les enregistrements DNS
   - Ajoute-les dans Cloudflare Dashboard → DNS → Records
5. **Vérifie dans MailerSend** → Domaine vérifié ✅
6. **Configure Railway** avec `noreply@lifeplanner.app`

### ⚠️ Notes importantes

- **Propagation DNS** : Peut prendre 5 minutes à 48 heures (généralement 15-30 min)
- **Vérification** : MailerSend vérifie automatiquement toutes les 5 minutes
- **SPF, DKIM, DMARC** : Tous les 3 sont nécessaires pour une bonne délivrabilité
- **Limite gratuite** : 100 emails/jour avec MailerSend gratuit
- **Domaine vérifié** : Obligatoire pour éviter que les emails aillent en spam

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

