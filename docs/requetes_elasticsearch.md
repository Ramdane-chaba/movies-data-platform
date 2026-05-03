# Requêtes Elasticsearch — Movies Data Platform ELK
> Index cible : `movies_clean`
> 12 requêtes commentées dont 5 requêtes bool

---

## Requête 1 — Tous les films en anglais (term exact)
> **Cas métier** : lister les films en version originale anglaise.
> `term` sur un champ `keyword` pour correspondance exacte.

```json
GET movies_clean/_search
{
  "query": {
    "term": {
      "original_language": "en"
    }
  },
  "size": 5,
  "_source": ["title", "original_language", "vote_average"]
}
```

---

## Requête 2 — Films avec note supérieure à 8 (range)
> **Cas métier** : identifier les films très bien notés.
> `range` sur un champ numérique `float`.

```json
GET movies_clean/_search
{
  "query": {
    "range": {
      "vote_average": {
        "gt": 8
      }
    }
  },
  "size": 5,
  "_source": ["title", "vote_average", "rating_band"]
}
```

---

## Requête 3 — Nombre total de films en anglais (count)
> **Cas métier** : mesure de volumétrie par langue.
> `size: 0` + `track_total_hits` pour compter sans retourner de documents.

```json
GET movies_clean/_search
{
  "track_total_hits": true,
  "query": {
    "term": {
      "original_language": "en"
    }
  },
  "size": 0
}
```

---

## Requête 4 — Films sortis après 2010 (range sur date)
> **Cas métier** : analyser la production cinématographique récente.
> `range` sur le champ `release_date` de type keyword.

```json
GET movies_clean/_search
{
  "track_total_hits": true,
  "size": 5,
  "query": {
    "range": {
      "release_date": {
        "gte": "2010-01-01"
      }
    }
  },
  "_source": ["title", "release_date", "vote_average"]
}
```

---

## Requête 5 — BOOL : Films d'action avec note > 7 (must + filter)
> **Cas métier** : trouver les meilleurs films d'action.
> CORRECTION : `genres_str` au lieu de `genres` (champ supprimé après nettoyage).

```json
GET movies_clean/_search
{
  "track_total_hits": true,
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

---

## Requête 6 — BOOL : Films rentables en anglais après 2000 (must + filter multiples)
> **Cas métier** : identifier les films anglophones rentables de l'ère moderne.
> Combinaison de `term`, `range` dans les `filter`.

```json
GET movies_clean/_search
{
  "track_total_hits": true,
  "size": 5,
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "is_profitable": true
          }
        }
      ],
      "filter": [
        {
          "term": {
            "original_language": "en"
          }
        },
        {
          "range": {
            "release_date": {
              "gte": "2000-01-01"
            }
          }
        }
      ]
    }
  },
  "_source": ["title", "budget", "revenue", "profit", "roi", "release_year"]
}
```

---

## Requête 7 — BOOL : Films excellents NON en anglais (must + must_not)
> **Cas métier** : découvrir les chefs-d'œuvre du cinéma international.
> `must_not` pour exclure une valeur exacte de langue.

```json
GET movies_clean/_search
{
  "track_total_hits": true,
  "size": 5,
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "rating_band": "excellent"
          }
        }
      ],
      "must_not": [
        {
          "term": {
            "original_language": "en"
          }
        }
      ]
    }
  },
  "_source": ["title", "original_language", "vote_average", "rating_band"]
}
```

---

## Requête 8 — BOOL : Blockbusters sci-fi avec gros budget (should + filter)
> **Cas métier** : identifier les blockbusters de science-fiction.
> `should` pour matcher plusieurs genres, `filter` pour budget minimum.

```json
GET movies_clean/_search
{
  "track_total_hits": true,
  "size": 5,
  "query": {
    "bool": {
      "should": [
        { "match": { "genres_str": "Science Fiction" } },
        { "match": { "genres_str": "Sci-Fi" } }
      ],
      "filter": [
        {
          "range": {
            "budget": {
              "gte": 50000000
            }
          }
        }
      ],
      "minimum_should_match": 1
    }
  },
  "_source": ["title", "genres_list", "budget", "revenue", "vote_average"]
}
```

---

## Requête 9 — BOOL : Films avec keyword "spy" bien notés (must + filter)
> **Cas métier** : retrouver les films d'espionnage de qualité.
> `match` sur `keywords_list` combiné à un filtre sur la note.

```json
GET movies_clean/_search
{
  "track_total_hits": true,
  "size": 5,
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "genres_str": "Drama"
          }
        }
      ],
      "filter": [
        {
          "range": {
            "vote_average": {
              "gte": 7.5
            }
          }
        },
        {
          "range": {
            "release_year": {
              "gte": 1990
            }
          }
        }
      ]
    }
  },
  "_source": ["title", "genres_list", "vote_average", "release_year"]
}
```

---

## Requête 10 — Agrégation : Moyenne des notes par langue
> **Cas métier** : comparer la qualité perçue des films selon leur langue.
> `terms` aggregation + `avg` sub-aggregation.

```json
GET movies_clean/_search
{
  "size": 0,
  "aggs": {
    "par_langue": {
      "terms": {
        "field": "original_language",
        "size": 10
      },
      "aggs": {
        "note_moyenne": {
          "avg": {
            "field": "vote_average"
          }
        }
      }
    }
  }
}
```

---

## Requête 11 — Agrégation : Top 10 genres les plus représentés
> **Cas métier** : identifier quels genres dominent le catalogue.
> `terms` aggregation sur le champ `keyword` array `genres_list`.

```json
GET movies_clean/_search
{
  "size": 0,
  "aggs": {
    "top_genres": {
      "terms": {
        "field": "genres_list",
        "size": 10
      },
      "aggs": {
        "note_moyenne": {
          "avg": {
            "field": "vote_average"
          }
        }
      }
    }
  }
}
```

---

## Requête 12 — Agrégation : Répartition des films par année et rating_band
> **Cas métier** : évolution de la qualité des films au fil des années.
> `terms` aggregation imbriquée sur `release_year` et `rating_band`.

```json
GET movies_clean/_search
{
  "size": 0,
  "query": {
    "range": {
      "release_year": {
        "gte": 2000,
        "lte": 2023
      }
    }
  },
  "aggs": {
    "par_annee": {
      "terms": {
        "field": "release_year",
        "size": 24,
        "order": { "_key": "asc" }
      },
      "aggs": {
        "par_rating": {
          "terms": {
            "field": "rating_band",
            "size": 4
          }
        }
      }
    }
  }
}
```

