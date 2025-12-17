# 🔧 Correction OAuth Google avec nouveau domaine

## ❌ Problème

Quand tu vas sur `https://www.mylifeplanner.space`, l'authentification Google ne fonctionne pas, même si tu as ajouté le domaine dans Google Console.

## 🔍 Causes identifiées

1. **`FRONTEND_URL` mal configuré** : Tu as mis un tableau JSON dans Railway, mais le code attend une string
2. **Domaine sans `www` manquant** : Il faut aussi ajouter `mylifeplanner.space` (sans www) dans Google Console
3. **CORS** : Vérifier que `CORS_ORIGINS` contient bien les deux domaines

## ✅ Solutions

### Étape 1 : Corriger `FRONTEND_URL` dans Railway

**Dans Railway Dashboard** → Variables :

❌ **Actuellement (incorrect)** :
```
FRONTEND_URL=["https://life-planner-code.vercel.app","https://www.mylifeplanner.space"]
```

✅ **À mettre (correct)** :
```
FRONTEND_URL=https://www.mylifeplanner.space
```

**Explication** : Le code utilise `FRONTEND_URL` comme une string pour construire les URLs de redirection. Si tu veux garder les deux domaines, utilise celui qui est principal (probablement `www.mylifeplanner.space`).

### Étape 2 : Ajouter le domaine sans `www` dans Google Console

1. **Va sur Google Cloud Console** : https://console.cloud.google.com/apis/credentials
2. **Ouvre ton OAuth Client ID** (celui que tu as déjà configuré)
3. **Dans "Origines JavaScript autorisées"**, ajoute :
   - `https://mylifeplanner.space` (sans www)
   - `https://www.mylifeplanner.space` (déjà présent ✅)

4. **Dans "URI de redirection autorisés"**, ajoute :
   - `https://mylifeplanner.space/auth/callback/google` (sans www)
   - `https://www.mylifeplanner.space/auth/callback/google` (déjà présent ✅)

5. **Clique sur "Enregistrer"**

**Note** : Google peut prendre 5 minutes à quelques heures pour appliquer les changements.

### Étape 3 : Vérifier `CORS_ORIGINS` dans Railway

**Dans Railway Dashboard** → Variables :

Vérifie que `CORS_ORIGINS` contient bien les deux domaines. Si elle n'existe pas, ajoute-la :

```
CORS_ORIGINS=["http://localhost:3000","https://life-planner-code.vercel.app","https://www.mylifeplanner.space","https://mylifeplanner.space"]
```

**Note** : `CORS_ORIGINS` peut être un tableau JSON (contrairement à `FRONTEND_URL`).

### Étape 4 : Redéployer l'API

Après avoir modifié les variables dans Railway :

1. **Railway va redéployer automatiquement** l'API
2. **Attends que le déploiement soit terminé** (quelques minutes)
3. **Teste** : Va sur `https://www.mylifeplanner.space` et essaie de te connecter avec Google

## 🧪 Test

1. **Va sur** `https://www.mylifeplanner.space`
2. **Clique sur "Se connecter avec Google"**
3. **Tu devrais être redirigé** vers Google pour l'authentification
4. **Après authentification**, tu devrais être redirigé vers `/auth/callback/google`
5. **Tu devrais être connecté** ✅

## 🔍 Dépannage

### L'authentification Google ne fonctionne toujours pas

1. **Vérifie les logs Railway** :
   - Va dans Railway Dashboard → Logs
   - Cherche les erreurs liées à OAuth

2. **Vérifie la console du navigateur** :
   - Ouvre les DevTools (F12)
   - Va dans l'onglet Console
   - Cherche les erreurs

3. **Vérifie que les URLs correspondent** :
   - Le `redirect_uri` envoyé au backend doit correspondre exactement à celui dans Google Console
   - Le frontend construit automatiquement : `${window.location.origin}/auth/callback/google`
   - Donc si tu es sur `https://www.mylifeplanner.space`, le `redirect_uri` sera `https://www.mylifeplanner.space/auth/callback/google`

4. **Vérifie Google Console** :
   - Les URLs doivent correspondre **exactement** (avec ou sans trailing slash)
   - Pas de `http://` si tu utilises `https://`
   - Pas d'erreur de typo

### Erreur "redirect_uri_mismatch"

Cette erreur signifie que l'URL de redirection ne correspond pas à celle configurée dans Google Console.

**Solution** :
1. Vérifie que l'URL dans Google Console correspond **exactement** à celle utilisée
2. Vérifie que tu as bien ajouté les deux versions (avec et sans www)
3. Attends quelques minutes après avoir modifié Google Console

### Erreur CORS

Si tu vois une erreur CORS dans la console :

1. **Vérifie `CORS_ORIGINS`** dans Railway
2. **Ajoute le domaine manquant** si nécessaire
3. **Redéploie** l'API

## 📝 Résumé des variables Railway

Voici les variables à configurer dans Railway :

| Variable | Valeur | Type |
|----------|--------|------|
| `FRONTEND_URL` | `https://www.mylifeplanner.space` | **String** (pas un tableau) |
| `CORS_ORIGINS` | `["http://localhost:3000","https://life-planner-code.vercel.app","https://www.mylifeplanner.space","https://mylifeplanner.space"]` | Tableau JSON |

## ✅ Checklist

- [ ] `FRONTEND_URL` corrigé dans Railway (string, pas tableau)
- [ ] `mylifeplanner.space` (sans www) ajouté dans Google Console
- [ ] `www.mylifeplanner.space` présent dans Google Console
- [ ] `CORS_ORIGINS` contient les deux domaines
- [ ] API redéployée sur Railway
- [ ] Test d'authentification Google réussi

