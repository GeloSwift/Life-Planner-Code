# 🌐 Guide complet : Configuration DNS pour MailerSend

## 🎯 Scénario : Vercel (Frontend) + Railway (API) + Pas de DNS

Ce guide t'explique comment configurer un domaine pour MailerSend quand tu n'as pas de DNS personnalisé.

---

## 📋 Comprendre la situation

- **Frontend** : Hébergé sur Vercel (URL : `life-planner-code.vercel.app`)
- **API** : Hébergée sur Railway (URL : `life-planner-code-production.up.railway.app`)
- **Pas de domaine personnalisé** : Tu utilises les URLs par défaut

### ⚠️ Problème

MailerSend nécessite un **domaine vérifié** pour envoyer des emails en production. Tu ne peux pas utiliser `@vercel.app` ou `@railway.app` comme expéditeur.

### ✅ Solution

Tu as **2 options** :

1. **Acheter un domaine** (recommandé, ~10-15€/an)
2. **Utiliser un service DNS gratuit** (Cloudflare) pour gérer les DNS

---

## 🎯 Option 1 : Acheter un domaine + Cloudflare (Recommandé)

### Étape 1 : Acheter un domaine

**Registrars recommandés** (pas cher) :
- **Namecheap** : https://www.namecheap.com/ (~10€/an)
- **Porkbun** : https://porkbun.com/ (~8€/an)
- **Cloudflare Registrar** : https://www.cloudflare.com/products/registrar/ (~8€/an, prix coûtant)

**Choisis un domaine** :
- `lifeplanner.app` (disponible ?)
- `mylifeplanner.com`
- `lifeplanner.io`
- etc.

### Étape 2 : Configurer Cloudflare (Gratuit)

1. **Crée un compte Cloudflare** : https://www.cloudflare.com/
2. **Ajoute ton site** :
   - Clique sur "Add a Site"
   - Entre ton domaine (ex: `lifeplanner.app`)
   - Choisis le plan **Free**
3. **Cloudflare va scanner tes DNS** (il n'y en aura pas encore, c'est normal)
4. **Cloudflare te donne 2 serveurs DNS** :
   ```
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```
5. **Va chez ton registrar** (Namecheap, etc.) :
   - Trouve "Nameservers" ou "DNS Servers"
   - Remplace par les serveurs Cloudflare
   - Sauvegarde

### Étape 3 : Configurer Vercel avec ton domaine

1. **Va dans Vercel Dashboard** → ton projet → Settings → Domains
2. **Clique sur "Add Domain"**
3. **Entre ton domaine** : `lifeplanner.app`
4. **Vercel va te donner des enregistrements DNS** à ajouter
5. **Va dans Cloudflare Dashboard** → DNS → Records
6. **Ajoute les enregistrements Vercel** :
   - Type `A` ou `CNAME` pour pointer vers Vercel
   - Vercel te dira exactement quoi ajouter

### Étape 4 : Configurer MailerSend

1. **Va sur MailerSend Dashboard** : https://app.mailersend.com/
2. **Domains** → **Add Domain**
3. **Entre ton domaine** : `lifeplanner.app`
4. **MailerSend te donne 3 types d'enregistrements** :

#### a) SPF (TXT Record)

```
Type: TXT
Name: @ (ou laisse vide)
Value: v=spf1 include:spf.mailersend.net ~all
TTL: Auto (ou 3600)
```

#### b) DKIM (CNAME Record)

```
Type: CNAME
Name: mta._domainkey (ou le nom exact fourni par MailerSend)
Value: [valeur fournie par MailerSend, ex: mta._domainkey.lifeplanner.app.msv1.net]
TTL: Auto (ou 3600)
```

#### c) DMARC (TXT Record)

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@lifeplanner.app
TTL: Auto (ou 3600)
```

### Étape 5 : Ajouter les enregistrements dans Cloudflare

1. **Va dans Cloudflare Dashboard** → DNS → Records
2. **Clique sur "Add record"**
3. **Ajoute chaque enregistrement** un par un :

**Pour SPF :**
- Type : `TXT`
- Name : `@` (ou laisse vide)
- Content : `v=spf1 include:spf.mailersend.net ~all`
- TTL : Auto
- Clique sur "Save"

**Pour DMARC :**
- Type : `TXT`
- Name : `_dmarc`
- Content : `v=DMARC1; p=none; rua=mailto:dmarc@lifeplanner.app`
- TTL : Auto
- Clique sur "Save"

**Pour DKIM :**
- Type : `CNAME`
- Name : `mta._domainkey` (ou le nom exact de MailerSend)
- Target : [valeur fournie par MailerSend]
- TTL : Auto
- Clique sur "Save"

### Étape 6 : Vérifier dans MailerSend

1. **Retourne sur MailerSend** → Domains → ton domaine
2. **Attends 5-15 minutes** pour la propagation DNS
3. **Clique sur "Verify Domain"** ou actualise la page
4. **Statut devrait passer à "Verified"** ✅

### Étape 7 : Configurer Railway

1. **Va dans Railway Dashboard** → Variables
2. **Mets à jour** :
   ```
   MAILERSEND_FROM_EMAIL=noreply@lifeplanner.app
   MAILERSEND_FROM_NAME=Life Planner
   ```
3. **Redéploie** si nécessaire

### Étape 8 : Configurer Vercel (Optionnel)

Si tu veux que ton site soit accessible via `lifeplanner.app` au lieu de `life-planner-code.vercel.app` :

1. **Vercel est déjà configuré** (étape 3)
2. **Vérifie que ça fonctionne** : va sur `https://lifeplanner.app`
3. **Mets à jour `FRONTEND_URL`** dans Railway :
   ```
   FRONTEND_URL=https://lifeplanner.app
   ```

---

## 🎯 Option 2 : Utiliser un sous-domaine email uniquement

Si tu ne veux pas modifier les DNS de ton domaine principal, tu peux créer un sous-domaine dédié aux emails :

### Étape 1 : Créer un sous-domaine

Dans Cloudflare (ou ton registrar) :
- Crée un sous-domaine : `mail.lifeplanner.app`
- Point-le vers n'importe où (peu importe, on l'utilise juste pour les emails)

### Étape 2 : Configurer MailerSend avec le sous-domaine

1. **Dans MailerSend**, ajoute `mail.lifeplanner.app` comme domaine
2. **Ajoute les mêmes enregistrements DNS** (SPF, DKIM, DMARC) mais pour `mail.lifeplanner.app`
3. **Utilise** `noreply@mail.lifeplanner.app` comme `MAILERSEND_FROM_EMAIL`

**Avantage** : Tu n'as pas besoin de configurer Vercel avec ce sous-domaine, il sert uniquement pour les emails.

---

## 🎯 Option 3 : Utiliser un domaine de test MailerSend (Temporaire)

Pour tester rapidement sans acheter de domaine :

1. **MailerSend fournit un domaine de test** dans le dashboard
2. **Utilise cet email** pour `MAILERSEND_FROM_EMAIL`
3. ⚠️ **Limitations** :
   - Les emails peuvent aller en spam
   - Pas recommandé en production
   - Limité en nombre d'envois

---

## 🔍 Vérifier que ça fonctionne

### Test 1 : Vérifier les DNS

Utilise un outil en ligne pour vérifier que tes DNS sont bien configurés :

- **MXToolbox** : https://mxtoolbox.com/spf.aspx
  - Entre ton domaine
  - Vérifie que SPF, DKIM, DMARC sont présents

- **Mail-Tester** : https://www.mail-tester.com/
  - Envoie-toi un email de test
  - Vérifie le score (devrait être 10/10)

### Test 2 : Tester l'envoi

1. **Va sur ton site** → `/profile`
2. **Clique sur "Vérifier"**
3. **Vérifie ta boîte email** (vérifie aussi les spams)
4. **L'email devrait arriver** avec l'expéditeur `noreply@lifeplanner.app`

---

## 📊 Résumé des coûts

| Service | Coût | Période |
|---------|------|---------|
| Domaine | ~10€ | /an |
| Cloudflare DNS | Gratuit | - |
| MailerSend | Gratuit (100 emails/jour) | - |
| Vercel | Gratuit (plan hobby) | - |
| Railway | Gratuit (plan hobby) | - |

**Total** : ~10€/an pour un domaine

---

## 🆘 Dépannage

### Les DNS ne se propagent pas

- **Attends 15-30 minutes** (parfois jusqu'à 48h)
- **Vérifie que les serveurs DNS sont bien configurés** chez ton registrar
- **Utilise** https://dnschecker.org/ pour voir la propagation mondiale

### MailerSend ne vérifie pas le domaine

- **Vérifie que tous les enregistrements sont corrects** (copie-colle exact)
- **Vérifie que les TTL sont bas** (Auto ou 3600)
- **Attends la propagation DNS**

### Les emails vont en spam

- **Vérifie que SPF, DKIM, DMARC sont tous configurés**
- **Utilise Mail-Tester** pour voir ce qui manque
- **Attends 24-48h** après la configuration (réputation du domaine)

---

## 📚 Ressources

- **MailerSend DNS Setup** : https://www.mailersend.com/help/verify-your-domain
- **Cloudflare DNS** : https://developers.cloudflare.com/dns/
- **Vercel Custom Domains** : https://vercel.com/docs/concepts/projects/domains
- **MXToolbox** : https://mxtoolbox.com/ (vérification DNS)

---

## ✅ Checklist finale

- [ ] Domaine acheté
- [ ] Cloudflare configuré
- [ ] Serveurs DNS changés chez le registrar
- [ ] Vercel configuré avec le domaine
- [ ] MailerSend domaine ajouté
- [ ] SPF enregistrement ajouté
- [ ] DKIM enregistrement ajouté
- [ ] DMARC enregistrement ajouté
- [ ] Domaine vérifié dans MailerSend
- [ ] Railway configuré avec `noreply@tondomaine.com`
- [ ] Test d'envoi réussi
- [ ] Email reçu (pas en spam)

