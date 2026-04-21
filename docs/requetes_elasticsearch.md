GET movies_raw/_count
GET movies_clean/_count


DELETE movies_raw
DELETE movies_clean 


GET movies_clean/_mapping

GET movies_clean/_analyze
{
  "analyzer": "movie_analyzer",
  "text": "The Dark Knight Rises"
}


PUT movies_clean
{
  "settings": {
    "analysis": {
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
  },
  "mappings": {
    "properties": {
      "id":                { "type": "integer" },
      "title":             { "type": "text", "analyzer": "movie_analyzer", "fields": { "keyword": { "type": "keyword" } } },
      "genres":            { "type": "text", "analyzer": "movie_analyzer", "fields": { "keyword": { "type": "keyword" } } },
      "original_language": { "type": "keyword" },
      "overview":          { "type": "text", "analyzer": "movie_analyzer" },
      "popularity":        { "type": "float" },
      "release_date":      { "type": "keyword" },
      "release_date_ts":   { "type": "date" },
      "budget":            { "type": "float" },
      "revenue":           { "type": "float" },
      "runtime":           { "type": "float" },
      "status":            { "type": "keyword" },
      "tagline":           { "type": "text", "analyzer": "movie_analyzer" },
      "vote_average":      { "type": "float" },
      "vote_count":        { "type": "float" },
      "rating_band":       { "type": "keyword" }
    }
  }
}
GET movies_raw/_search
{
  "size": 1,
  "_source": ["id", "title", "vote_average", "status", "original_language"]
}

GET movies_clean/_search
{
  "size": 1,
  "_source": ["id", "title", "vote_average", "status", "original_language", "rating_band"]
}



GET movies_clean/_count
GET movies_clean/_mapping


# Les Requetes 
#  Tous les films en anglais 

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


# Films avec note > 8
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

# le nombre total de films en anglais 
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

#films sortis apres 2010
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

# requete bool  Films d'action avec note > 7
GET movies_clean/_search
{
  "track_total_hits": true,
  "size": 5,
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "genres": "action"
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
  "_source": ["title", "genres", "vote_average"]
}

# requete agregation  Moyenne des notes par langue
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