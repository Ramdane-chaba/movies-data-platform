# Dictionnaire de Données — Movies Data Platform ELK 

## Vue d'ensemble

Ce dictionnaire documente tous les champs ingérés et nettoyés dans les index Elasticsearch (`movies_raw` et `movies_clean`).

**Source** : Dataset CSV en entrée via Logstash  
**Index brut** : `movies_raw` (données telles que reçues)  
**Index nettoyé** : `movies_clean` (données nettoyées et typées)

---

## Champs de l'index `movies_raw`

L'index brut stocke les données telles que reçues du fichier CSV. Les colonnes sont parsées par Logstash et indexées comme des champs `text` ou `keyword` par défaut.

| Champ | Source CSV | Type logique | Description |
| --- | --- | --- | --- |
| `id` | id | string | Identifiant unique du film (transformé en integer à la sauvegarde raw) |
| `title` | title | string | Titre du film |
| `genres` | genres | string | Genres séparés par "-" (ex: "Action-Adventure-Fantasy") |
| `original_language` | original_language | string | Code langue ISO (ex: "en", "fr", "de") |
| `overview` | overview | string | Synopsis du film |
| `popularity` | popularity | string | Indice de popularité (reçu comme string, converti en float au nettoyage) |
| `production_companies` | production_companies | string | Producteurs séparés par "-" |
| `release_date` | release_date | string | Date de sortie au format "YYYY-MM-DD" ou variantes |
| `budget` | budget | string | Budget du film en USD (reçu comme string, converti en float) |
| `revenue` | revenue | string | Revenu du film en USD (reçu comme string, converti en float) |
| `runtime` | runtime | string | Durée en minutes (reçu comme string, converti en float) |
| `status` | status | string | Statut de publication (ex: "Released", "In Production") |
| `tagline` | tagline | string | Phrase d'accroche du film |
| `vote_average` | vote_average | string | Note moyenne (reçue comme string, convertie en float) |
| `vote_count` | vote_count | string | Nombre de votes (reçu comme string, converti en integer) |
| `credits` | credits | string | Casting : nom acteurs/réalisateurs séparés par "-" |
| `keywords` | keywords | string | Mots-clés séparés par "-" |
| `poster_path` | poster_path | string | Chemin de l'affiche (supprimé au nettoyage) |
| `backdrop_path` | backdrop_path | string | Chemin de l'image de fond (supprimé au nettoyage) |
| `recommendations` | recommendations | string | Recommandations liées (supprimées au nettoyage) |

---

## Champs de l'index `movies_clean`

L'index nettoyé contient les données après transformation, normalisation et enrichissement. Les champs sont typés explicitement et optimisés pour la recherche et l'analyse.

### Champs d'identité

| Champ | Type Elasticsearch | Source | Description | Exemple |
| --- | --- | --- | --- | --- |
| `id` | integer | movies_raw.id | Identifiant unique du film | `550` |
| `title` | text (+ keyword subfield) | movies_raw.title | Titre du film, indexé pour recherche full-text et agrégations | `"The Fight Club"` |

### Champs de description

| Champ | Type | Source | Description | Exemple |
| --- | --- | --- | --- | --- |
| `overview` | text | movies_raw.overview | Synopsis du film, analysé avec movie_analyzer | `"An insomniac office worker..."` |
| `tagline` | text | movies_raw.tagline | Phrase d'accroche, analysée | `"Lose yourself"` |
| `original_language` | keyword | movies_raw.original_language | Code langue ISO (lowercase) | `"en"`, `"fr"`, `"de"` |
| `status` | keyword | movies_raw.status | Statut de publication (lowercase) | `"released"` |

### Champs de classification

| Champ | Type | Source | Description | Exemple |
| --- | --- | --- | --- | --- |
| `genres_list` | keyword (array) | movies_raw.genres | Genres normalisés (tableau), séparés par "-" en entrée | `["Action", "Drama", "Thriller"]` |
| `genres_str` | text | movies_raw.genres | Genres sous forme de texte, analysé pour recherche | `"Action, Drama, Thriller"` |
| `keywords_list` | keyword (array) | movies_raw.keywords | Mots-clés normalisés (tableau) | `["spy", "espionage", "mission"]` |
| `rating_band` | keyword | vote_average | Catégorisation de la note en 4 bandes : `excellent` (≥8.0), `good` (≥6.0), `average` (≥4.0), `poor` (<4.0) | `"excellent"` |

### Champs de création et timing

| Champ | Type | Source | Description | Exemple |
| --- | --- | --- | --- | --- |
| `release_date` | keyword | movies_raw.release_date | Date de sortie au format texte "YYYY-MM-DD" | `"2019-08-14"` |
| `release_date_ts` | date | movies_raw.release_date | Date de sortie parsée en timestamp ISO pour requêtes range | `2019-08-14T00:00:00Z` |
| `release_year` | integer | movies_raw.release_date | Année extraite de release_date | `2019` |
| `runtime` | float | movies_raw.runtime | Durée du film en minutes (après nettoyage : valeurs < 0 → 0) | `139.0` |

### Champs financiers

| Champ | Type | Source | Description | Exemple |
| --- | --- | --- | --- | --- |
| `budget` | float | movies_raw.budget | Budget en USD (après nettoyage : valeurs invalides → 0) | `61000000.0` |
| `revenue` | float | movies_raw.revenue | Revenu en USD (après nettoyage : valeurs invalides → 0) | `100853753.0` |
| `profit` | float | Calculé | Profit = revenue - budget (null si budget ≤ 0 ou revenue ≤ 0) | `39853753.0` |
| `roi` | float | Calculé | Retour sur investissement en % = ((revenue - budget) / budget × 100), arrondi à 2 décimales | `65.29` |
| `is_profitable` | boolean | Calculé | Indicateur : true si revenue > budget, false sinon | `true` |

### Champs de qualité et audience

| Champ | Type | Source | Description | Exemple |
| --- | --- | --- | --- | --- |
| `vote_average` | float | movies_raw.vote_average | Note moyenne du film sur 10 (après nettoyage : valeurs > 10 → 0) | `8.8` |
| `vote_count` | integer | movies_raw.vote_count | Nombre de votes reçus | `26514` |
| `popularity` | float | movies_raw.popularity | Indice de popularité (normalisé à 0 si invalide) | `72.584` |

### Champs de production et création

| Champ | Type | Source | Description | Exemple |
| --- | --- | --- | --- | --- |
| `cast_list` | keyword (array) | movies_raw.credits | Premier 5 acteurs extraits du champ credits (séparation par "-") | `["Brad Pitt", "Edward Norton", "Helena Bonham Carter"]` |
| `director` | keyword | movies_raw.credits | Réalisateur principal (actuellement défini à "unknown") | `"unknown"` |
| `directors_list` | keyword (array) | movies_raw.credits | Liste complète des réalisateurs (actuellement vide) | `[]` |
| `companies_list` | keyword (array) | movies_raw.production_companies | Sociétés de production normalisées (séparation par "-") | `["Warner Bros", "Regency Enterprises"]` |

### Champs techniques

| Champ | Type | Source | Description |
| --- | --- | --- | --- |
| `@timestamp` | date | Logstash | Timestamp d'indexation automatiquement ajouté par Elasticsearch |

---

## Champs supprimés lors du nettoyage

Les champs suivants sont supprimés lors de l'étape 15 du pipeline clean.conf car redondants ou non exploitables :

- `poster_path` — chemins non accessibles depuis Kibana
- `backdrop_path` — chemins non accessibles depuis Kibana
- `recommendations` — structure JSON complexe non normalisée
- `genres` — remplacé par `genres_list` et `genres_str`
- `keywords` — remplacé par `keywords_list`
- `credits` — remplacé par `cast_list`, `director`, `directors_list`
- `production_companies` — remplacé par `companies_list`
- Champs Logstash internes (`@version`, `message`, `host`, `path`, `log`, `event`)

---

## Gestion des valeurs manquantes

### Stratégie appliquée

| Cas | Traitement | Raison |
| --- | --- | --- |
| **Titre absent** | Document supprimé (drop) | Le titre est obligatoire pour identifier un film |
| **ID absent** | Document supprimé (drop) | L'ID est la clé unique, ne peut pas être estimé |
| **Budget/Revenue absent** | Remplacé par `0` | Permet distinction film sans budget vs film non rentabilisé |
| **Runtime absent** | Remplacé par `0` | Indique données manquantes, agrégations seront plus justes |
| **Vote_average absent** | Remplacé par `0` | Permet inclusion dans analyses, distinct des films bien notés |
| **Dates absentes** | Champ supprimé | Impossibilité de parser → valeur non exploitable |
| **Listes vides** (genres, keywords, etc.) | Tableau vide `[]` | Permet agrégations correctes |

### Valeurs aberrantes

Le pipeline détecte et corrige les valeurs invalides :

| Champ | Aberrance | Correction |
| --- | --- | --- |
| `vote_average` | Valeur > 10 | Remplacée par 0 (note invalide) |
| `budget`, `revenue`, `runtime` | Valeur négative | Remplacée par 0 (indication de données manquantes) |

---

## Analyzer personnalisé : `movie_analyzer`

**Utilisé sur les champs** : `title`, `overview`, `tagline`, `genres_str`

**Configuration** :

```json
{
  "analyzer": {
    "movie_analyzer": {
      "type": "custom",
      "tokenizer": "standard",
      "filter": ["lowercase", "asciifolding", "movie_stop"]
    }
  },
  "filter": {
    "movie_stop": {
      "type": "stop",
      "stopwords": "_english_"
    }
  }
}
```

**Traitement** :

1. **Tokenizer `standard`** — Segmente le texte en mots (délimiteurs : espace, ponctuation)
2. **Filtre `lowercase`** — Convertit en minuscules (ex: "Batman" → "batman")
3. **Filtre `asciifolding`** — Supprime les accents (ex: "Amélie" → "Amelie")
4. **Filtre `movie_stop`** — Supprime les stopwords anglais (ex: "the", "a", "is")

**Exemple** :

- Requête : `"The Fight Club"`
- Après analyzer : `["fight", "club"]` (suppression de "the")
- Match : Retrouve `"Fight Club"`, `"club fights"`, etc.

---

## Index Elasticsearch

### Index `movies_raw`

- **Nom** : `movies_raw`
- **Nombre de shards** : 1 (par défaut)
- **Nombre de replicas** : 0 (dev uniquement)
- **Doctype** : Aucun (Elasticsearch 8+)
- **Rôle** : Stockage brut des données CSV telles que parsées

### Index `movies_clean`

- **Nom** : `movies_clean`
- **Nombre de shards** : 1 (par défaut)
- **Nombre de replicas** : 0 (dev uniquement)
- **Mapping** : Défini explicitement (voir `requetes_mapping_analyser.md`)
- **Analyzer** : `movie_analyzer` personnalisé
- **Document ID** : Empreinte SHA256 du champ `id` (évite les doublons)
- **Rôle** : Données nettoyées, typées et optimisées pour recherche et analyse

---

## Contrôle de qualité : Avant/Après

### Exemple de transformation — Film "The Fight Club"

**Avant (movies_raw)** :

```json
{
  "id": "550",
  "title": "  The Fight Club  ",
  "genres": "Action-Drama-Thriller",
  "original_language": "EN",
  "overview": "An insomniac office worker...",
  "popularity": "72.584",
  "budget": "63000000",
  "revenue": "100853753",
  "runtime": "139",
  "vote_average": "8.8",
  "vote_count": "26514",
  "release_date": "1999-10-15",
  "status": "RELEASED"
}
```

**Après (movies_clean)** :

```json
{
  "id": 550,
  "title": "The Fight Club",
  "genres_list": ["Action", "Drama", "Thriller"],
  "genres_str": "Action, Drama, Thriller",
  "original_language": "en",
  "overview": "An insomniac office worker...",
  "popularity": 72.584,
  "budget": 63000000.0,
  "revenue": 100853753.0,
  "profit": 37853753.0,
  "roi": 60.09,
  "is_profitable": true,
  "runtime": 139.0,
  "status": "released",
  "vote_average": 8.8,
  "vote_count": 26514,
  "rating_band": "excellent",
  "release_date": "1999-10-15",
  "release_date_ts": "1999-10-15T00:00:00Z",
  "release_year": 1999,
  "cast_list": ["..."],
  "companies_list": ["Warner Bros", "Regency Enterprises"],
  "@timestamp": "2024-04-26T..."
}
```

**Transformations appliquées** :

- ✅ Suppression des espaces (`title`)
- ✅ Conversion en minuscules (`original_language`, `status`)
- ✅ Typage : `budget`, `revenue`, `runtime`, `vote_average`, `vote_count` → nombre
- ✅ Parsing des listes : `genres` → `genres_list` + `genres_str`
- ✅ Calculs enrichis : `profit`, `roi`, `is_profitable`
- ✅ Classification : `rating_band` = "excellent" (vote_average ≥ 8.0)
- ✅ Parsing date : `release_date` → `release_date_ts` (date) + `release_year` (integer)

---

## Taille et volumétrie attendue

- **Nombre estimé de documents** : Dépend du dataset CSV source
- **Taille moyenne par document (movies_clean)** : ~1-2 KB
- **Stockage index (sans replica)** : À évaluer après ingestion complète

---

## Contacts et support

Pour toute question sur le dictionnaire :
- Vérifier le mapping dans `requetes_mapping_analyser.md`
- Consulter les étapes de nettoyage dans `docs/data_cleaning.md`
- Examiner les logs Logstash : `./logs/logstash-plain.log`
