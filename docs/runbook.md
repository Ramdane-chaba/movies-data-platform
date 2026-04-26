# Runbook — Movies Data Platform

## Vue d'ensemble

Ce runbook fournit les instructions pour démarrer, vérifier et exploiter la plateforme Movies Data Platform de A à Z.

**Architecture** :
- Elasticsearch 8.10.2
- Kibana 8.10.2
- Logstash 8.10.2
- React 18+ (mini moteur de recherche)

**Durée estimée** :
- Démarrage initial : 5-10 minutes
- Ingestion données (selon dataset) : 2-5 minutes
- Vérification complète : 10 minutes

---

## Prérequis

### Système d'exploitation

✅ Windows 10+ / macOS / Linux (testé sur Windows)

### Logiciels requis

| Logiciel | Version | Rôle |
| --- | --- | --- |
| Docker Desktop | 4.0+ | Orchestration des conteneurs ELK |
| Docker Compose | 1.29+ | Lancement de la stack |
| pnpm ou npm | 8+ | Gestion des dépendances React |
| curl (optionnel) | Toute | Tests des APIs Elasticsearch |
| Git | 2.0+ | Versionning du code |

### Configuration matérielle recommandée

- **RAM** : Minimum 8 GB (4 GB pour ES, 2 GB pour Kibana, 2 GB pour autres services)
- **Disque** : 20 GB libres minimum (5 GB pour ES data volume)
- **CPU** : 2+ cores

### Fichiers requis

```
C:\Users\User\Desktop\movies-data-platform-dev\
├── docker-compose.yml           # Configuration des services
├── logstash/
│   ├── config/
│   │   └── pipelines.yml         # Configuration des pipelines
│   └── pipeline/
│       ├── raw.conf              # Pipeline brut
│       └── clean.conf            # Pipeline nettoyage
├── DATA/
│   └── movies.csv               # Dataset source (À PLACER)
├── application_react/           # Frontend React
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
└── docs/                        # Documentation
```

**⚠️ Important** : Le fichier `DATA/movies.csv` doit être ajouté manuellement.

---

## Étape 1 : Préparation de l'environnement

### 1.1 Vérifier Docker

```bash
docker --version
docker-compose --version
```

**Résultat attendu** :

```
Docker version 20.10.0+
Docker Compose version 1.29.0+
```

### 1.2 Obtenir le dataset

**Option A** : Télécharger depuis Kaggle

1. Se connecter sur [Kaggle](https://www.kaggle.com)
2. Accéder à : https://www.kaggle.com/datasets/akshaypawar7/millions-of-movies/versions/67
3. Télécharger `movies.csv`
4. Placer le fichier dans le dossier `DATA/` du projet

**Option B** : Utiliser un autre dataset films/cinéma

- S'assurer que le CSV dispose des colonnes attendues (voir `docs/data_dictionary.md`)
- Adapter les pipelines Logstash si nécessaire

### 1.3 Valider la structure du projet

```bash
cd C:\Users\User\Desktop\movies-data-platform-dev
ls -la

# Vérifier la présence des fichiers
ls DATA/movies.csv
ls logstash/pipeline/raw.conf
ls logstash/pipeline/clean.conf
```

---

## Étape 2 : Démarrage de la stack ELK

### 2.1 Lancer Docker Compose

```bash
cd C:\Users\User\Desktop\movies-data-platform-dev
docker-compose up -d
```

**Résultat** :

```
Creating elasticsearch ... done
Creating kibana_movies ... done
Creating logstash_movies ... done
```

### 2.2 Vérifier l'état des services

```bash
docker-compose ps
```

**Résultat attendu** :

```
NAME              COMMAND                STATUS
elasticsearch     /usr/local/bin/...    Up 2 minutes (healthy)
kibana_movies     /bin/bash -c '/b...   Up 1 minute (healthy)
logstash_movies   /usr/local/bin/...    Up 1 minute
```

**Tous les services doivent avoir le statut `Up`**.

### 2.3 Vérifier la santé d'Elasticsearch

**Via curl** :

```bash
curl -s http://localhost:9201/_cluster/health | jq .
```

**Résultat attendu** :

```json
{
  "cluster_name": "docker-cluster",
  "status": "green",
  "timed_out": false,
  "number_of_nodes": 1,
  "number_of_data_nodes": 1,
  "active_primary_shards": 0,
  "active_shards": 0
}
```

**Status doit être "green"**. Si "red" ou "yellow", attendre 30 secondes et réessayer.

### 2.4 Vérifier Kibana

Accéder à : http://localhost:5602

**Résultat** : Écran d'accueil Kibana doit charger (sans erreur)

---

## Étape 3 : Ingestion des données

### 3.1 Lancer les pipelines Logstash

Les pipelines se lancent automatiquement lors du démarrage du conteneur Logstash.

**Vérifier l'exécution** :

```bash
docker-compose logs logstash | tail -20
```

**Logs attendus** :

```
...
[2024-04-26T...] INFO logstash.agent - Processing pipeline {:id=>"raw", ...}
[2024-04-26T...] INFO logstash.agent - Processing pipeline {:id=>"clean", ...}
[2024-04-26T...] INFO logstash.inputs.file - Starting file input {:path=>"/data/movies.csv", ...}
```

### 3.2 Vérifier l'ingestion brute (movies_raw)

Attendre 30-60 secondes pour que le parsing CSV soit complet.

```bash
curl -s "http://localhost:9201/movies_raw/_count" | jq .
```

**Résultat attendu** :

```json
{
  "count": 1234,
  "_shards": {...}
}
```

**Le nombre de documents doit être > 0**. Si 0, vérifier les logs Logstash.

### 3.3 Vérifier l'ingestion nettoyée (movies_clean)

Après le traitement du pipeline clean (quelques secondes après raw).

```bash
curl -s "http://localhost:9201/movies_clean/_count" | jq .
```

**Résultat attendu** :

```json
{
  "count": 1100,
  "_shards": {...}
}
```

**Le nombre de documents doit être légèrement inférieur à movies_raw** (certains films supprimés car sans titre/ID).

### 3.4 Examiner un film dans movies_clean

```bash
curl -s "http://localhost:9201/movies_clean/_search?size=1" | jq '.hits.hits[0]'
```

**Résultat attendu** :

```json
{
  "_index": "movies_clean",
  "_id": "a3f8e2c7...",
  "_score": 1.0,
  "_source": {
    "id": 550,
    "title": "The Fight Club",
    "genres_list": ["Action", "Drama", "Thriller"],
    "vote_average": 8.8,
    "rating_band": "excellent",
    "profit": 37853753.0,
    "roi": 60.09,
    "is_profitable": true,
    ...
  }
}
```

**Vérifier la présence de** : `id`, `title`, `genres_list`, `vote_average`, `rating_band`, `profit`, `roi`, `is_profitable`

---

## Étape 4 : Configuration de Kibana

### 4.1 Accéder à Kibana

Ouvrir http://localhost:5602 dans le navigateur.

### 4.2 Créer une Data View (anciennement Index Pattern)

1. Aller à **Management** → **Dev Tools** → **Kibana**
2. Ou aller à **Stack Management** → **Index Patterns**
3. Cliquer sur **Create index pattern**
4. Nom : `movies_clean`
5. Pattern : `movies_clean`
6. Timestamp field : `@timestamp`
7. Cliquer sur **Create index pattern**

**Résultat** : Kibana affiche la liste des 25+ champs disponibles.

### 4.3 Importer le dashboard (optionnel)

Si un fichier `kibana_dashboard.ndjson` existe :

1. Aller à **Stack Management** → **Saved Objects**
2. Cliquer sur **Import**
3. Sélectionner le fichier `.ndjson`
4. Importer

---

## Étape 5 : Tester les requêtes Elasticsearch

### 5.1 Accéder à DevTools de Kibana

1. Ouvrir Kibana (http://localhost:5602)
2. Aller à **Dev Tools** (icône en bas à gauche)
3. Cliquer sur **Console**

### 5.2 Lancer une requête simple

```json
GET movies_clean/_search
{
  "size": 5,
  "query": {
    "term": {
      "original_language": "en"
    }
  },
  "_source": ["title", "vote_average"]
}
```

**Résultat attendu** : Liste de 5 films en anglais avec titre et note.

### 5.3 Tester une requête bool

```json
GET movies_clean/_search
{
  "size": 5,
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "genres_str": "Action"
          }
        }
      ],
      "filter": [
        {
          "range": {
            "vote_average": {
              "gt": 7
            }
          }
        }
      ]
    }
  },
  "_source": ["title", "genres_list", "vote_average"]
}
```

**Résultat attendu** : Films d'action avec note > 7.

### 5.4 Vérifier l'analyzer personnalisé

```json
GET movies_clean/_analyze
{
  "analyzer": "movie_analyzer",
  "text": "The Fight Club"
}
```

**Résultat attendu** :

```json
{
  "tokens": [
    {
      "token": "fight",
      "start_offset": 4,
      "end_offset": 9,
      "type": "<ALPHANUM>",
      "position": 0
    },
    {
      "token": "club",
      "start_offset": 10,
      "end_offset": 14,
      "type": "<ALPHANUM>",
      "position": 1
    }
  ]
}
```

**"the" doit être supprimé par le stopwords filter**.

---

## Étape 6 : Vérifier la qualité des données

### 6.1 Films sans titre

```json
GET movies_clean/_search
{
  "query": {
    "bool": {
      "must_not": [
        {
          "exists": {
            "field": "title"
          }
        }
      ]
    }
  },
  "size": 100
}
```

**Résultat attendu** : 0 résultats (tous les films ont un titre).

### 6.2 Films sans budget valide

```json
GET movies_clean/_search
{
  "query": {
    "term": {
      "budget": 0
    }
  },
  "size": 10,
  "_source": ["title", "budget", "revenue"]
}
```

**Résultat** : Films avec budget = 0 (données manquantes).

### 6.3 Films profitables

```json
GET movies_clean/_search
{
  "query": {
    "term": {
      "is_profitable": true
    }
  },
  "size": 5,
  "_source": ["title", "budget", "revenue", "profit", "roi"]
}
```

**Résultat** : Films avec revenue > budget.

### 6.4 Distribution des rating_band

```json
GET movies_clean/_search
{
  "size": 0,
  "aggs": {
    "par_rating": {
      "terms": {
        "field": "rating_band",
        "size": 10
      }
    }
  }
}
```

**Résultat attendu** : Distribution en 4 catégories (excellent, good, average, poor).

---

## Étape 7 : Lancer le mini moteur de recherche (React)

### 7.1 Installer les dépendances

```bash
cd C:\Users\User\Desktop\movies-data-platform-dev\application_react
pnpm install
# ou
npm install
```

### 7.2 Lancer le serveur de développement

```bash
pnpm dev
# ou
npm run dev
```

**Résultat attendu** :

```
  VITE v4.x.x  ready in 200 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### 7.3 Accéder à l'application

Ouvrir http://localhost:5173 dans le navigateur.

**Vérifier** :
- L'application charge sans erreur
- La page affiche un formulaire de recherche
- Les requêtes Elasticsearch retournent des résultats

---

## Étape 8 : Arrêter et nettoyer

### 8.1 Arrêter la stack

```bash
docker-compose down
```

**Résultat** :

```
Stopping logstash_movies ... done
Stopping kibana_movies ... done
Stopping elasticsearch ... done
Removing logstash_movies ... done
Removing kibana_movies ... done
Removing elasticsearch ... done
```

### 8.2 Supprimer les données persitées

```bash
# Supprimer les volumes
docker volume rm movies-data-platform-dev_es_data

# Ou via docker-compose
docker-compose down -v
```

⚠️ **Attention** : Cette action supprime tous les documents indexés.

### 8.3 Redémarrer à zéro

```bash
docker-compose down -v  # Supprimer les données
docker-compose up -d    # Relancer la stack
```

---

## Troubleshooting

### Problème 1 : Elasticsearch ne démarre pas

**Symptôme** :

```
elasticsearch_1  | ERROR: [1] bootstrap checks failed
elasticsearch_1  | [1]: max virtual memory areas vm.max_map_count [65530] is too low,
```

**Solution** (Linux/macOS) :

```bash
# Augmenter la limite de mmap
sudo sysctl -w vm.max_map_count=262144

# Rendre permanent (Linux)
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

**Solution** (Windows) :

Relancer Docker Desktop ou augmenter la RAM allouée dans les paramètres Docker.

### Problème 2 : Logstash n'ingère pas les données

**Diagnostic** :

```bash
docker-compose logs logstash | grep -i error
```

**Causes courantes** :

| Cause | Solution |
| --- | --- |
| Fichier CSV non trouvé | Vérifier que `DATA/movies.csv` existe |
| Permissions d'accès | Vérifier les droits de lecture du fichier |
| Format CSV invalide | Comparer le séparateur (virgule vs point-virgule) |
| Logstash ne redémarre pas | `docker-compose restart logstash` |

### Problème 3 : Kibana n'ouvre pas

**Diagnostic** :

```bash
curl http://localhost:5602/api/status
```

**Causes courantes** :

| Cause | Solution |
| --- | --- |
| Elasticsearch pas prêt | Attendre 30 secondes |
| Port 5602 occupé | Changer le port dans `docker-compose.yml` |
| Problème de connexion CORS | Vérifier les paramètres ES dans `docker-compose.yml` |

### Problème 4 : Requête Elasticsearch échoue

**Symptôme** :

```json
{
  "error": {
    "type": "index_not_found_exception",
    "reason": "no such index [movies_clean]"
  }
}
```

**Solution** :

1. Vérifier que l'ingestion est complète : `GET movies_clean/_count`
2. Relancer Logstash : `docker-compose restart logstash`
3. Attendre 30-60 secondes
4. Réessayer

### Problème 5 : React n'arrive pas à se connecter à Elasticsearch

**Symptôme** : Erreur CORS dans la console navigateur

```
Access to XMLHttpRequest at 'http://localhost:9201/...' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solution** :

Vérifier que CORS est activé dans `docker-compose.yml` :

```yaml
environment:
  - http.cors.enabled=true
  - http.cors.allow-origin=http://localhost:5173
```

Redémarrer Elasticsearch :

```bash
docker-compose restart elasticsearch
```

---

## Vérification complète (checklist)

✅ Docker Desktop en cours d'exécution  
✅ `docker-compose ps` affiche tous les services "Up"  
✅ `curl http://localhost:9201/_cluster/health` retourne "green"  
✅ `GET movies_raw/_count` > 0  
✅ `GET movies_clean/_count` > 0  
✅ Kibana accessible à http://localhost:5602  
✅ Data view `movies_clean` créée dans Kibana  
✅ Requête simple retourne des résultats  
✅ Analyzer `movie_analyzer` supprime stopwords  
✅ Requête bool fonctionne  
✅ React démarre sans erreur à http://localhost:5173  
✅ React communique avec Elasticsearch  

---

## Commandes utiles

### Monitoring

```bash
# État de la stack
docker-compose ps

# Logs
docker-compose logs elasticsearch
docker-compose logs kibana
docker-compose logs logstash

# Logs en direct
docker-compose logs -f logstash

# Statistiques des conteneurs
docker stats
```

### Elasticsearch (via curl)

```bash
# Santé du cluster
curl http://localhost:9201/_cluster/health

# Lister les indices
curl http://localhost:9201/_cat/indices

# Compter les documents
curl http://localhost:9201/movies_clean/_count

# Supprimer un index
curl -X DELETE http://localhost:9201/movies_clean

# Vérifier le mapping
curl http://localhost:9201/movies_clean/_mapping
```

### Docker

```bash
# Relancer un service
docker-compose restart logstash

# Redémarrer la stack
docker-compose down
docker-compose up -d

# Supprimer tout et repartir de zéro
docker-compose down -v
docker-compose up -d
```

---

## Support et escalade

| Problème | Premier diagnostic | Contact |
| --- | --- | --- |
| Elasticsearch ne démarre | Logs : `docker logs elasticsearch` | Vérifier `vm.max_map_count` |
| Ingestion incomplète | Logs : `docker logs logstash_movies` | Vérifier le format CSV |
| Requête Elasticsearch échoue | Accès Kibana DevTools | Vérifier l'index existe |
| React ne marche pas | Console navigateur (F12) | Vérifier CORS Elasticsearch |
| Performance lente | `docker stats` | Augmenter la RAM allouée |

---

## Ressources additionnelles

- [Documentation Elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Documentation Kibana](https://www.elastic.co/guide/en/kibana/current/index.html)
- [Documentation Logstash](https://www.elastic.co/guide/en/logstash/current/index.html)
- [Requêtes Elasticsearch](docs/requetes_elasticsearch.md)
- [Dictionnaire de données](docs/data_dictionary.md)
- [Nettoyage des données](docs/data_cleaning.md)
