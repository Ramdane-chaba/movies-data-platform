# 🎬 Movies Data Platform

Plateforme d'analyse de films avec **ELK Stack** (Elasticsearch, Kibana, Logstash)

**Équipe** : Ramdane CHABA • Ouissem Aouimeur • Ghiles Mekdam

---

## 📌 Vue d'ensemble

Projet d'ingestion et d'analyse de ~1200 films avec :
- Nettoyage automatique (16 étapes Logstash)
- Indexation Elasticsearch (2 index)
- Visualisations Kibana
- Moteur de recherche React

---

## 🚀 Démarrage

```bash
git clone <repo>
cd movies-data-platform

# Placer les données
mkdir -p DATA && cp movies.csv DATA/

# Démarrer
docker-compose up -d
```

**Accès** : Kibana (http://localhost:5602) | ES (http://localhost:9201) | React (http://localhost:5173)

---

## 📂 Dossiers

- `logstash/pipeline/` — Pipelines ETL (raw.conf, clean.conf)
- `application_react/` — Frontend React
- `docs/` — Documentation complète
- `docker-compose.yml` — Configuration

---

## ✅ Livrables

- ✅ 2 index Elasticsearch (`movies_raw`, `movies_clean`)
- ✅ Mapping explicite + analyzer personnalisé
- ✅ 12+ requêtes DSL commentées
- ✅ Dashboard Kibana (6-8 visualisations)
- ✅ Moteur de recherche (React)
- ✅ Documentation complète

---

## 📚 Docs

| Document | Contenu |
|----------|---------|
| [runbook.md](docs/runbook.md) | Guide complet démarrage & ops |
| [data_cleaning.md](docs/data_cleaning.md) | Détail nettoyage (16 étapes) |
| [requetes_elasticsearch.md](docs/requetes_elasticsearch.md) | Requêtes DSL |
| [planning_poker.md](docs/planning_poker.md) | Estimation équipe |
| [SYNTHESE_PROJET.md](docs/SYNTHESE_PROJET.md) | Synthèse finale |

---

## 🛠️ Tech

Docker • Elasticsearch 8.10.2 • Kibana 8.10.2 • Logstash 8.10.2 • React 18 • Vite

---

## 🔧 Troubleshooting

**ES ne démarre ?** → `docker-compose logs elasticsearch`  
**CSV pas traité ?** → Vérifier `DATA/movies.csv`  
**CORS bloqué ?** → Vérifier `http.cors.enabled=true`

---

## 📊 Stats

| | |
|---|---|
| Champs | 19 → 25+ |
| Étapes nettoyage | 16 |
| Requêtes DSL | 12+ |
| Films indexés | ~1200 |

