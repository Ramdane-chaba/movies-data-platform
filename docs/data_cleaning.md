# Documentation du Nettoyage des Données — Movies Data Platform

## Vue d'ensemble

Ce document décrit les règles de nettoyage et de normalisation appliquées par le pipeline Logstash (`clean.conf`) pour transformer les données brutes CSV en données exploitables dans l'index Elasticsearch `movies_clean`.

**Objectifs du nettoyage** :
1. Assurer la cohérence des types (integer, float, date, boolean, keyword)
2. Normaliser les formats (minuscules, suppression des espaces, parsing des listes)
3. Détecter et corriger les valeurs manquantes ou aberrantes
4. Enrichir les données avec des champs calculés
5. Éviter les doublons via fingerprinting

---

## Architecture du pipeline de nettoyage

```
movies.csv (raw)
    ↓
[ÉTAPE 1] Parsing CSV
    ↓
[ÉTAPES 2-15] Nettoyage, typage, enrichissement
    ↓
[ÉTAPE 16] Fingerprinting anti-doublons
    ↓
movies_clean (Elasticsearch)
```

---

## Détail des étapes de nettoyage

### ÉTAPE 1 — Parsing CSV

**Code Logstash** :

```logstash
csv {
  separator => ","
  skip_header => true
  columns => [
    "id", "title", "genres", "original_language",
    "overview", "popularity", "production_companies",
    "release_date", "budget", "revenue", "runtime",
    "status", "tagline", "vote_average", "vote_count",
    "credits", "keywords", "poster_path",
    "backdrop_path", "recommendations"
  ]
}
```

**Action** :
- Lit le fichier CSV ligne par ligne
- Ignore la première ligne (entête)
- Sépare chaque ligne par virgule
- Crée un champ Logstash pour chaque colonne nommée

**Données d'entrée** :

```csv
550,"The Fight Club","Action-Drama-Thriller","en","An insomniac office worker...",72.584,"Warner Bros-Regency",1999-10-15,63000000,100853753,139,"Released","Lose yourself",8.8,26514,"Brad Pitt-Edward Norton","spy-fight","path/poster.jpg","path/backdrop.jpg","..."
```

**Sortie** :

Champs créés : `id`, `title`, `genres`, `original_language`, `overview`, `popularity`, `production_companies`, `release_date`, `budget`, `revenue`, `runtime`, `status`, `tagline`, `vote_average`, `vote_count`, `credits`, `keywords`, `poster_path`, `backdrop_path`, `recommendations`

---

### ÉTAPE 2 — Nettoyage des champs texte bruts

**Code Logstash** :

```logstash
mutate {
  strip => ["title", "overview", "tagline", "status", "original_language",
            "release_date", "budget", "revenue", "runtime",
            "vote_average", "vote_count", "popularity", "id"]
  lowercase => ["original_language", "status"]
}
```

**Actions** :

| Champ | Traitement | Exemple |
| --- | --- | --- |
| `title`, `overview`, `tagline`, `status`, `original_language`, `release_date`, `budget`, `revenue`, `runtime`, `vote_average`, `vote_count`, `popularity`, `id` | Suppression des espaces avant/après (strip) | `"  Batman  "` → `"Batman"` |
| `original_language` | Conversion en minuscules | `"EN"` → `"en"`, `"FR"` → `"fr"` |
| `status` | Conversion en minuscules | `"RELEASED"` → `"released"` |

**Raison** : Normaliser les textes pour éviter les duplicatas lors des agrégations (ex: "EN" et "en" comptés séparément sans ce traitement).

---

### ÉTAPE 3 — Suppression des films sans titre

**Code Logstash** :

```logstash
if ![title] or [title] == "" or [title] == "null" {
  drop {}
}
```

**Action** :
- Supprime le document si `title` est absent, vide ou égal à la chaîne "null"
- La fonction `drop {}` arrête le traitement du document

**Raison** : Le titre est obligatoire pour identifier et rechercher un film. Un film sans titre n'est pas exploitable.

**Impact** : Réduit le nombre de documents, améliore la qualité finale.

---

### ÉTAPE 4 — Suppression des films sans ID

**Code Logstash** :

```logstash
if ![id] or [id] == "" or [id] == "null" {
  drop {}
}
```

**Action** :
- Supprime le document si `id` est absent, vide ou égal à la chaîne "null"

**Raison** : L'ID est la clé unique du film. Sans ID, impossible d'identifier ou de dédupliquer.

**Impact** : Réduit le nombre de documents, garantit une clé unique par film.

---

### ÉTAPE 5 — Valeurs par défaut numériques

**Code Logstash** :

```logstash
if ![budget] or [budget] == "" or [budget] == "null"                   { mutate { replace => { "budget"       => "0" } } }
if ![revenue] or [revenue] == "" or [revenue] == "null"                { mutate { replace => { "revenue"      => "0" } } }
if ![runtime] or [runtime] == "" or [runtime] == "null"                { mutate { replace => { "runtime"      => "0" } } }
if ![popularity] or [popularity] == "" or [popularity] == "null"       { mutate { replace => { "popularity"   => "0" } } }
if ![vote_average] or [vote_average] == "" or [vote_average] == "null" { mutate { replace => { "vote_average" => "0" } } }
if ![vote_count] or [vote_count] == "" or [vote_count] == "null"       { mutate { replace => { "vote_count"   => "0" } } }
```

**Action** :
- Remplace chaque valeur manquante, vide ou "null" par "0"

**Champs affectés** :
- `budget`, `revenue`, `runtime`, `popularity`, `vote_average`, `vote_count`

**Raison** : 
- Permet de conserver le document au lieu de le supprimer
- Marque explicitement les données manquantes (0 ≠ absent)
- Facilite les calculs et agrégations numériques

**Impact sur les analyses** :
- Films avec `budget = 0` → données manquantes (excluir avec filtre si besoin)
- Films avec `vote_average = 0` → pas noté (distinct des films mal notés)

---

### ÉTAPE 6 — Conversion de types

**Code Logstash** :

```logstash
mutate {
  convert => {
    "id"           => "integer"
    "popularity"   => "float"
    "budget"       => "float"
    "revenue"      => "float"
    "runtime"      => "float"
    "vote_average" => "float"
    "vote_count"   => "integer"
  }
}
```

**Action** :
- Convertit les champs de chaînes de caractères en types numériques

**Conversion** :

| Champ | Type source | Type cible | Exemple |
| --- | --- | --- | --- |
| `id` | string | integer | `"550"` → `550` |
| `popularity` | string | float | `"72.584"` → `72.584` |
| `budget` | string | float | `"63000000"` → `63000000.0` |
| `revenue` | string | float | `"100853753"` → `100853753.0` |
| `runtime` | string | float | `"139"` → `139.0` |
| `vote_average` | string | float | `"8.8"` → `8.8` |
| `vote_count` | string | integer | `"26514"` → `26514` |

**Raison** : Elasticsearch exige des types explicites pour les requêtes range et les calculs numériques.

---

### ÉTAPE 7 — Correction des valeurs aberrantes

**Code Logstash** :

```logstash
if [runtime] and [runtime] < 0            { mutate { replace => { "runtime"      => "0" } } }
if [budget] and [budget] < 0              { mutate { replace => { "budget"       => "0" } } }
if [revenue] and [revenue] < 0            { mutate { replace => { "revenue"      => "0" } } }
if [vote_average] and [vote_average] > 10 { mutate { replace => { "vote_average" => "0" } } }
```

**Action** :
- Détecte et corrige les valeurs impossible ou incohérentes

**Règles appliquées** :

| Champ | Condition | Correction | Raison |
| --- | --- | --- | --- |
| `runtime` | Valeur < 0 | Remplacer par 0 | La durée ne peut pas être négative |
| `budget` | Valeur < 0 | Remplacer par 0 | Un budget ne peut pas être négatif |
| `revenue` | Valeur < 0 | Remplacer par 0 | Un revenu ne peut pas être négatif |
| `vote_average` | Valeur > 10 | Remplacer par 0 | La note est sur 10, > 10 = donnée corrompue |

**Impact** : Améliore la cohérence des données, évite les agrégations biaisées.

**Exemple d'anomalie détectée** :
- Filme avec `vote_average = 15.5` → remplacé par `0` (note invalide)

---

### ÉTAPE 8 — Parsing de la date de sortie

**Code Logstash** :

```logstash
ruby {
  code => '
    rd = event.get("release_date")
    if rd.is_a?(Array)
      rd = rd.first
      event.set("release_date", rd)
    end
    if rd && rd.to_s.strip != "" && rd.to_s.strip != "null"
      clean_rd = rd.to_s.strip
      event.set("release_date", clean_rd)
      if clean_rd.length >= 4
        event.set("release_year", clean_rd[0..3].to_i)
      end
    else
      event.remove("release_date")
      event.set("release_year", nil)
    end
  '
}

if [release_date] {
  date {
    match    => ["release_date", "yyyy-MM-dd"]
    target   => "release_date_ts"
    timezone => "UTC"
    tag_on_failure => ["_date_parse_failure"]
  }
}
```

**Actions** :

1. **Gestion des tableaux** : Si `release_date` est un tableau, prendre le premier élément
2. **Extraction de l'année** : Extraire les 4 premiers caractères comme année (integer)
3. **Suppression si invalide** : Si `release_date` est absent ou "null", supprimer le champ
4. **Parsing ISO** : Convertir "YYYY-MM-DD" en timestamp (`release_date_ts`)

**Formats supportés** : "YYYY-MM-DD" uniquement

**Résultat** :

| Champ | Type | Exemple |
| --- | --- | --- |
| `release_date` | keyword | `"1999-10-15"` |
| `release_date_ts` | date | `1999-10-15T00:00:00Z` |
| `release_year` | integer | `1999` |

**Raison** :
- `release_date_ts` permet les requêtes range sur dates
- `release_year` facilite les agrégations par année
- `release_date` (texte) conserve le format original pour affichage

**Impact sur les requêtes** :

```json
// ✅ Fonctionne avec release_date_ts
"range": { "release_date_ts": { "gte": "2010-01-01" } }

// ✅ Fonctionne avec release_year
"range": { "release_year": { "gte": 2010 } }

// ✓ Fonctionne avec release_date (comparaison texte)
"range": { "release_date": { "gte": "2010-01-01" } }
```

---

### ÉTAPE 9 — Normalisation GENRES

**Code Logstash** :

```logstash
ruby {
  code => '
    raw = event.get("genres")
    if raw && raw.to_s.strip != "" && raw.to_s.strip != "null"
      names = raw.to_s.split("-").map(&:strip).reject(&:empty?)
      event.set("genres_list", names)
      event.set("genres_str", names.join(", "))
    else
      event.set("genres_list", [])
      event.set("genres_str", "")
    end
  '
}
```

**Action** :
- Divise la chaîne `"Action-Adventure-Fantasy"` par délimiteur "-"
- Crée deux champs :
  - `genres_list` : tableau `["Action", "Adventure", "Fantasy"]`
  - `genres_str` : texte `"Action, Adventure, Fantasy"`

**Traitement** :
1. Vérifier que `genres` n'est pas vide ou "null"
2. Diviser par "-"
3. Supprimer les espaces avant/après chaque genre
4. Supprimer les éléments vides
5. Créer le tableau et la chaîne

**Exemple** :

| Entrée | genres_list | genres_str |
| --- | --- | --- |
| `"Action-Adventure-Fantasy"` | `["Action", "Adventure", "Fantasy"]` | `"Action, Adventure, Fantasy"` |
| `"Action - Drama"` | `["Action", "Drama"]` | `"Action, Drama"` |
| `""` ou `"null"` | `[]` | `""` |

**Raison** :
- `genres_list` (keyword) → agrégations et filtres exacts
- `genres_str` (text) → recherche full-text ("trouver tous les films Action")

---

### ÉTAPE 10 — Normalisation KEYWORDS

**Code Logstash** :

```logstash
ruby {
  code => '
    raw = event.get("keywords")
    if raw && raw.to_s.strip != "" && raw.to_s.strip != "null"
      names = raw.to_s.split("-").map(&:strip).reject(&:empty?)
      event.set("keywords_list", names)
    else
      event.set("keywords_list", [])
    end
  '
}
```

**Action** : Identique à la normalisation genres, crée un tableau `keywords_list`.

**Exemple** :

| Entrée | keywords_list |
| --- | --- |
| `"sword-father-murder-prince"` | `["sword", "father", "murder", "prince"]` |
| `""` ou `"null"` | `[]` |

---

### ÉTAPE 11 — Normalisation CREDITS

**Code Logstash** :

```logstash
ruby {
  code => '
    raw = event.get("credits")
    if raw && raw.to_s.strip != "" && raw.to_s.strip != "null"
      all_people = raw.to_s.split("-").map(&:strip).reject(&:empty?)
      event.set("cast_list", all_people.first(5))
      event.set("directors_list", [])
      event.set("director", "unknown")
    else
      event.set("cast_list", [])
      event.set("directors_list", [])
      event.set("director", "unknown")
    end
  '
}
```

**Action** :
- Divise `credits` par "-" (format : "Actor1-Actor2-Director-...")
- Extrait les 5 premiers noms comme `cast_list`
- Initialise `directors_list` vide et `director` à "unknown"

**Limitation actuelle** : La séparation réalisateurs/acteurs n'est pas implémentée (nécessiterait analyse métier du format source).

**Exemple** :

| Entrée | cast_list | director |
| --- | --- | --- |
| `"Brad Pitt-Edward Norton-Helena Bonham Carter-..."` | `["Brad Pitt", "Edward Norton", "Helena Bonham Carter", ...]` (5 max) | `"unknown"` |
| `""` ou `"null"` | `[]` | `"unknown"` |

---

### ÉTAPE 12 — Normalisation PRODUCTION_COMPANIES

**Code Logstash** :

```logstash
ruby {
  code => '
    raw = event.get("production_companies")
    if raw && raw.to_s.strip != "" && raw.to_s.strip != "null"
      names = raw.to_s.split("-").map(&:strip).reject(&:empty?)
      event.set("companies_list", names)
    else
      event.set("companies_list", [])
    end
  '
}
```

**Action** : Identique à normalisation genres, crée un tableau `companies_list`.

**Exemple** :

| Entrée | companies_list |
| --- | --- |
| `"Warner Bros-Regency Enterprises-New Regency"` | `["Warner Bros", "Regency Enterprises", "New Regency"]` |
| `""` ou `"null"` | `[]` |

---

### ÉTAPE 13 — Champs calculés enrichis (profit et ROI)

**Code Logstash** :

```logstash
ruby {
  code => '
    budget  = event.get("budget").to_f
    revenue = event.get("revenue").to_f
    if budget > 0 && revenue > 0
      event.set("profit", revenue - budget)
      event.set("roi", ((revenue - budget) / budget * 100).round(2))
      event.set("is_profitable", revenue > budget)
    else
      event.set("profit", nil)
      event.set("roi", nil)
      event.set("is_profitable", nil)
    end
  '
}
```

**Actions** :

| Champ | Formule | Condition | Exemple |
| --- | --- | --- | --- |
| `profit` | `revenue - budget` | budget > 0 AND revenue > 0 | `100M - 63M = 37M` |
| `roi` | `(profit / budget) × 100` | budget > 0 AND revenue > 0 | `(37/63) × 100 = 58.73%` |
| `is_profitable` | `revenue > budget` | budget > 0 AND revenue > 0 | `true` si revenue > budget |
| **Tous les trois** | `null` | budget ≤ 0 OU revenue ≤ 0 | Données manquantes → null |

**Raison** :
- `profit` et `roi` permettent les analyses de rentabilité
- Calculer dans Logstash est plus efficace qu'en requête
- `null` pour les films sans budget/revenue valide (évite les faux calculs)

**Exemple complet** :

```
Budget: 63,000,000 USD
Revenue: 100,853,753 USD
↓
Profit: 37,853,753 USD
ROI: 60.09 %
is_profitable: true
```

---

### ÉTAPE 14 — Rating band (classification par note)

**Code Logstash** :

```logstash
if [vote_average] >= 8.0 {
  mutate { add_field => { "rating_band" => "excellent" } }
} else if [vote_average] >= 6.0 {
  mutate { add_field => { "rating_band" => "good" } }
} else if [vote_average] >= 4.0 {
  mutate { add_field => { "rating_band" => "average" } }
} else {
  mutate { add_field => { "rating_band" => "poor" } }
}
```

**Catégorisation** :

| Plage vote_average | rating_band | Cas |
| --- | --- | --- |
| ≥ 8.0 | `excellent` | Films très bien notés |
| ≥ 6.0 et < 8.0 | `good` | Films bien notés |
| ≥ 4.0 et < 6.0 | `average` | Films moyennement notés |
| < 4.0 | `poor` | Films mal notés |

**Raison** :
- Facilite les agrégations et filtres par catégorie
- Évite les requêtes range répétitives
- Utile pour les dashboards Kibana

**Exemple** :

| vote_average | rating_band |
| --- | --- |
| 8.8 | excellent |
| 7.2 | good |
| 5.5 | average |
| 3.1 | poor |
| 0 (invalide) | poor |

---

### ÉTAPE 15 — Suppression des champs inutiles

**Code Logstash** :

```logstash
mutate {
  remove_field => [
    "poster_path", "backdrop_path", "recommendations",
    "genres", "keywords", "credits", "production_companies",
    "@version", "message", "host", "path", "log", "event"
  ]
}
```

**Champs supprimés** :

| Champ | Raison |
| --- | --- |
| `poster_path`, `backdrop_path` | Chemins locaux non accessibles depuis Kibana ; remplacés par `genres_list`, `genres_str`, etc. |
| `recommendations` | Structure JSON complexe, non normalisée ; trop volumineux |
| `genres` | Remplacé par `genres_list` (array) et `genres_str` (text) |
| `keywords` | Remplacé par `keywords_list` |
| `credits` | Remplacé par `cast_list`, `directors_list`, `director` |
| `production_companies` | Remplacé par `companies_list` |
| `@version`, `message`, `host`, `path`, `log`, `event` | Champs internes Logstash, non pertinents pour l'analyse |

**Impact** : Réduit la taille de chaque document (~20-30% de réduction).

---

### ÉTAPE 16 — Fingerprinting anti-doublons

**Code Logstash** :

```logstash
fingerprint {
  source => ["id"]
  target => "[@metadata][fingerprint]"
  method => "SHA256"
}
```

**Action** :
- Calcule une empreinte SHA256 du champ `id`
- Stocke l'empreinte en metadata (champ interne, non indexé)
- Utilisée comme `document_id` lors de l'indexation Elasticsearch

**Exemple** :

```
Champ id : "550"
↓
Empreinte SHA256 : "a3f8e2c7d1b9f4a6..."
↓
Document ID dans Elasticsearch : "a3f8e2c7d1b9f4a6..."
```

**Raison** :
- **Idempotence** : Si le document est rejoué, il remplace le précédent au lieu de créer un doublon
- **Stabilité** : L'ID génère toujours la même empreinte

**Impact en Elasticsearch** :

```json
// 1ère ingestion
PUT movies_clean/_doc/a3f8e2c7...
{ "id": 550, "title": "Fight Club", ... }

// 2e ingestion du même film (même ID)
PUT movies_clean/_doc/a3f8e2c7...
{ "id": 550, "title": "Fight Club", ... }

// Résultat : 1 document (le 2e remplace le 1er)
```

---

## Étape de sortie (Output)

**Code Logstash** :

```logstash
output {
  elasticsearch {
    hosts       => ["http://elasticsearch:9200"]
    index       => "movies_clean"
    document_id => "%{[@metadata][fingerprint]}"
  }
}
```

**Action** :
- Envoie chaque document vers Elasticsearch
- Index cible : `movies_clean`
- Document ID : empreinte SHA256 du champ `id`

---

## Résumé du nettoyage : Avant/Après

### Données brutes (movies_raw)

```json
{
  "id": "550",
  "title": "  The Fight Club  ",
  "genres": "Action-Drama-Thriller",
  "original_language": "EN",
  "overview": "An insomniac office worker and a devil-may-care soap maker form an underground fight club.",
  "popularity": "72.584",
  "production_companies": "Warner Bros-Regency Enterprises",
  "release_date": "1999-10-15",
  "budget": "63000000",
  "revenue": "100853753",
  "runtime": "139",
  "status": "RELEASED",
  "tagline": "Lose yourself",
  "vote_average": "8.8",
  "vote_count": "26514",
  "credits": "Brad Pitt-Edward Norton-Helena Bonham Carter-Jared Leto",
  "keywords": "sword-father-murder-prince",
  "poster_path": "/pB8BM7pdSp6B6Ih7QSoOAu5KK3V.jpg",
  "backdrop_path": "/527byVWI0KUcD88SlLkjNHTjGM4.jpg",
  "recommendations": "..."
}
```

### Données nettoyées (movies_clean)

```json
{
  "id": 550,
  "title": "The Fight Club",
  "genres_list": ["Action", "Drama", "Thriller"],
  "genres_str": "Action, Drama, Thriller",
  "original_language": "en",
  "overview": "An insomniac office worker and a devil-may-care soap maker form an underground fight club.",
  "popularity": 72.584,
  "companies_list": ["Warner Bros", "Regency Enterprises"],
  "release_date": "1999-10-15",
  "release_date_ts": "1999-10-15T00:00:00Z",
  "release_year": 1999,
  "budget": 63000000.0,
  "revenue": 100853753.0,
  "profit": 37853753.0,
  "roi": 60.09,
  "is_profitable": true,
  "runtime": 139.0,
  "status": "released",
  "tagline": "Lose yourself",
  "vote_average": 8.8,
  "vote_count": 26514,
  "rating_band": "excellent",
  "cast_list": ["Brad Pitt", "Edward Norton", "Helena Bonham Carter", "Jared Leto"],
  "keywords_list": ["sword", "father", "murder", "prince"],
  "director": "unknown"
}
```

**Transformations appliquées** :

✅ Typage : strings → integer, float, date  
✅ Normalisation : suppression espaces, minuscules  
✅ Listes normalisées : genres, keywords, credits, companies  
✅ Champs calculés : profit, roi, is_profitable  
✅ Classification : rating_band  
✅ Parsing date : release_date → release_date_ts + release_year  
✅ Champs inutiles supprimés  
✅ Fingerprint pour éviter les doublons  

---

## Impact du nettoyage : Métriques

### Avant/Après (estimé)

| Métrique | movies_raw | movies_clean | Changement |
| --- | --- | --- | --- |
| **Nombre de documents** | 100% | ~95-98% | -2 à -5% (suppression films sans titre/ID) |
| **Nombre de champs par document** | 19 | 25+ | +6 nouveaux champs calculés |
| **Taille moyenne par document** | ~1.5 KB | ~1.2 KB | -20% (suppression champs volumineux) |
| **Stockage total (1 replica)** | 100% | ~70-80% | -20 à -30% |
| **Requêtes range sur date** | ❌ Impossible | ✅ Possible | Via `release_date_ts` |
| **Agrégations par genre** | ❌ Compliquées | ✅ Faciles | Via `genres_list` |
| **Analyses de rentabilité** | ❌ Impossible | ✅ Possible | Via `profit`, `roi` |

---

## Validation du nettoyage

### Requêtes de contrôle

**Vérifier le nombre de documents** :

```json
GET movies_clean/_count
{
  "query": {
    "exists": { "field": "title" }
  }
}
```

**Vérifier les films sans budget** :

```json
GET movies_clean/_search
{
  "size": 5,
  "query": {
    "term": {
      "budget": 0
    }
  },
  "_source": ["title", "budget", "revenue"]
}
```

**Vérifier les champs calculés** :

```json
GET movies_clean/_search
{
  "size": 5,
  "query": {
    "exists": { "field": "roi" }
  },
  "_source": ["title", "budget", "revenue", "profit", "roi"]
}
```

---

## Gestion des erreurs et logs

### Fichier de logs

```
./logs/logstash-plain.log
```

### Champs de diagnostic

En cas d'erreur, Logstash ajoute des tags :

| Tag | Signification | Action |
| --- | --- | --- |
| `_date_parse_failure` | Format date invalide | Consulter logs, vérifier format source |
| `drop` | Document supprimé | Normal (titre ou ID absent) |

---

## Améliorations futures

1. **Séparation réalisateurs/acteurs** : Parser le champ `credits` pour extraire réalisateurs séparément
2. **Gestion des langues** : Mapping ISO 639-1 → noms complets ("en" → "English")
3. **Enrichissement géographique** : Ajouter pays depuis langue
4. **Validation des montants** : Détecter les anomalies budgétaires (budget > revenue raisonnable)
5. **Analyse de texte avancée** : Extraction d'entités du synopsis via NLP
