# Planning Poker — Movies Data Platform

## Vue d'ensemble

Ce document synthétise les estimations et l'organisation du projet Movies Data Platform selon la méthode Planning Poker (estimation Fibonacci).

**Objectif** : Estimer l'effort de chaque feature pour planifier le travail et répartir les tâches équitablement.

**Échelle utilisée** : 1, 2, 3, 5, 8, 13
- 1 = Très facile (< 30 min)
- 2 = Facile (30 min - 1h)
- 3 = Moyen (1-2h)
- 5 = Complexe (2-4h)
- 8 = Très complexe (4-8h)
- 13 = Très complexe / Risqué (8h+)

---

## 1) Participants

| Rôle | Nom/Équipe | Responsabilités |
| --- | --- | --- |
| Lead Technique | ... | Intégration, merge, qualité, requêtes |
| Développeur 1 | ... | Backend ELK, nettoyage, mapping |
| Développeur 2 | ... | Dashboard Kibana, moteur de recherche, doc |

---

## 2) Échelle utilisée

**Fibonacci: 1, 2, 3, 5, 8, 13**

| Points | Durée estimée | Complexité | Exemple |
| --- | --- | --- | --- |
| **1** | < 30 min | Trivial | Ajouter un commentaire |
| **2** | 30 min - 1h | Très facile | Corriger un bug simple |
| **3** | 1h - 2h | Facile | Créer un champ calculé |
| **5** | 2h - 4h | Moyen | Pipeline Logstash |
| **8** | 4h - 8h | Complexe | Dashboard Kibana complet |
| **13** | 8h+ | Très complexe/Risqué | Optimisation performance |

---

## 3) Stories estimées

### F1 — Bootstrap stack Docker Compose

**User Story** :
> En tant qu'équipe DevOps, je veux que la stack ELK (Elasticsearch, Kibana, Logstash) démarre en une commande (`docker-compose up -d`) afin que le développement soit reproductible et accessible à tous.

**Critères d'acceptation** :
1. Docker Compose file fonctionnel avec les 3 services
2. Healthchecks configurés pour chaque service
3. Volumes montés (data, logs, config)
4. CORS activé pour communication inter-services
5. Documentation de démarrage/arrêt

**Estimation initiale** : 2, 2, 3  
**Décision finale** : **2 points** (30 min - 1h)  
**Hypothèses** : Configuration Docker standard, pas de stockage persistant complexe

**Réalisé** : ✅ Fait (docker-compose.yml complet)

---

### F2 — Ingestion brute des données (movies_raw)

**User Story** :
> En tant qu'analyste data, je veux que le CSV films soit automatiquement parsé et indexé dans `movies_raw` afin de disposer d'une base brute pour le nettoyage.

**Critères d'acceptation** :
1. Pipeline raw.conf crée et indexe dans movies_raw
2. Colonnes correctes du CSV parsées (19 champs)
3. Données sans modification (telles que reçues)
4. Index contient tous les films du CSV
5. Preuve d'ingestion : `_count` retourne le nombre de docs

**Estimation initiale** : 3, 2, 3  
**Décision finale** : **3 points** (1-2h)  
**Hypothèses** : Format CSV stable, pas de variantes de colonnes

**Réalisé** : ✅ Fait (pipeline raw.conf, 1200+ docs indexés)

---

### F3 — Nettoyage et normalisation (movies_clean)

**User Story** :
> En tant que data engineer, je veux que les données brutes soient nettoyées (typage, parsing, normalisation des listes) afin que les analyses soit fiables.

**Critères d'acceptation** :
1. Pipeline clean.conf applique les 16 étapes de nettoyage
2. Champs typés (integer, float, date, boolean, keyword)
3. Valeurs manquantes remplacées par défaut approprié
4. Valeurs aberrantes corrigées (négatif → 0, note > 10 → 0)
5. Listes normalisées (genres, keywords, credits, companies)
6. Champs calculés créés (profit, ROI, is_profitable, rating_band)
7. Index movies_clean rempli avec ~1100-1200 docs
8. Vérification avant/après documentée

**Estimation initiale** : 8, 5, 8  
**Décision finale** : **8 points** (4-8h)  
**Hypothèses** : Logique de nettoyage bien définie, pas de régles métier complexes à découvrir, format CSV cohérent

**Réalisé** : ✅ Fait (16 étapes, tous les champs normalisés)

---

### F4 — Mapping Elasticsearch et analyzer personnalisé

**User Story** :
> En tant que data engineer, je veux définir un mapping explicite pour movies_clean et créer un analyzer personnalisé afin d'optimiser les recherches et les agrégations.

**Critères d'acceptation** :
1. Mapping explicite pour movies_clean avec 25+ champs
2. Champs typés correctement (text, keyword, integer, float, date, boolean)
3. Subfields pour les champs text + keyword (ex: title.keyword)
4. Analyzer personnalisé "movie_analyzer" créé
5. Analyzer appliqué sur title, overview, tagline, genres_str
6. Stop words personnalisés (English stopwords)
7. Asciifolding pour accents (Amélie → Amelie)
8. Vérification : `_analyze` endpoint fonctionne

**Estimation initiale** : 3, 3, 2  
**Décision finale** : **3 points** (1-2h)  
**Hypothèses** : Mapping standard, pas d'analyzer complexe requis

**Réalisé** : ✅ Fait (mapping complet, analyzer movie_analyzer)

---

### F5 — Requêtes analytiques Elasticsearch

**User Story** :
> En tant qu'analyste, je veux 12+ requêtes DSL commentées (dont 5 bool queries) afin de pouvoir explorer les données par divers angles métier.

**Critères d'acceptation** :
1. 12 requêtes DSL commentées dans `docs/requetes_elasticsearch.md`
2. Minimum 5 requêtes bool (must, should, must_not, filter)
3. Requêtes term, range, match, aggregations
4. Chaque requête a un cas métier explicite
5. Requêtes testables dans Kibana DevTools
6. Exemples de résultats fournis

**Estimation initiale** : 5, 3, 5  
**Décision finale** : **5 points** (2-4h)  
**Hypothèses** : Cas métier définis, pas de tuning performance requis

**Réalisé** : ✅ Fait (12 requêtes avec cas métier)

---

### F6 — Dashboard Kibana avec visualisations

**User Story** :
> En tant qu'analyste métier, je veux un dashboard Kibana avec 6-8 visualisations afin de visualiser les insights films (distribution genres, notes, rentabilité, etc.).

**Critères d'acceptation** :
1. 6-8 visualisations créées (charts, tables, cartes)
2. 1 dashboard structuré (titre, description, layout)
3. Visualisations liées aux questions métier clés
4. Dashboard exporté en `.ndjson` pour reproductibilité
5. Documentation des visualisations (quoi, pourquoi, insight)

**Exemple de visualisations** :
- Films par rating_band (pie chart)
- Génération de revenu par année (line chart)
- Top 10 genres (bar chart)
- Distribution des notes (histogram)
- Films rentables vs non-rentables (gauge)
- Top 20 acteurs (horizontal bar)

**Estimation initiale** : 8, 5, 8  
**Décision finale** : **8 points** (4-8h)  
**Hypothèses** : Données préparées, pas de ETL complexe, accès Kibana disponible

**Réalisé** : 🟡 Partiellement (export `.ndjson` présent, visualisations à finaliser)

---

### F7 — Mini moteur de recherche (React)

**User Story** :
> En tant qu'utilisateur, je veux un moteur de recherche simple (API ou UI) pour chercher les films par titre, genre, langue afin de naviguer facilement dans le catalogue.

**Critères d'acceptation** :
1. Interface React (à `http://localhost:5173`)
2. Champ de recherche full-text sur titre/overview
3. Au minimum 1 filtre exact (genre, langue, année)
4. Requête Elasticsearch connectée (pas d'API proxy requis)
5. Affichage des résultats (titre, note, genres, année)
6. Pagination simple (size limit, offset)
7. Démonstration documentée dans `docs/demo_script.md`

**Stack** :
- Frontend : React + Vite + Shadcn UI (Radix + Material-UI)
- Backend : Requête directe ES (CORS activé)

**Estimation initiale** : 5, 5, 8  
**Décision finale** : **5 points** (2-4h)  
**Hypothèses** : UI standard, requête ES simple, pas de autosuggest complexe

**Réalisé** : 🟡 Infrastructure React prête (package.json complet, Vite configuré)

---

### F8 — Documentation finale (~5 pages)

**User Story** :
> En tant que documentaliste, je veux produire une documentation synthèse (~5 pages) couvrant architecture, données, nettoyage, requêtes, dashboard et gestion de projet afin que le projet soit reproductible et maintenable.

**Critères d'acceptation** :
1. docs/data_dictionary.md — dictionnaire complet des champs
2. docs/data_cleaning.md — détail des 16 étapes de nettoyage
3. docs/runbook.md — instructions opérationnelles complètes
4. docs/project_management.md — Gitflow, CI/CD, responsabilités
5. docs/planning_poker.md — ce fichier
6. Document synthèse (~5 pages) couvrant :
   - Contexte, objectifs, périmètre
   - Architecture et environnement
   - Données et nettoyage (obligatoire)
   - Modélisation Elasticsearch
   - Requêtes et analyses
   - Dashboard Kibana
   - Gestion de projet
   - Bilan, limites, améliorations
7. Tous les fichiers correctement formatés (Markdown, grammaire, structure)

**Estimation initiale** : 8, 5, 8  
**Décision finale** : **8 points** (4-8h)  
**Hypothèses** : Travail déjà réalisé (pipelines, requêtes, dashboard), documentation à synthétiser

**Réalisé** : 🟡 En cours (fichiers individuels créés, synthèse finale à faire)

---

## 4) Décisions de découpage

### F3 découpage proposé

**Feature** : Nettoyage et normalisation (8 points)

**Découpage possible** :

| Sous-tâche | Points | Responsable |
| --- | --- | --- |
| Étapes 1-7 (CSV parsing, typage, drop) | 3 | Dev 1 |
| Étapes 8-12 (Dates, genres, keywords, credits, companies) | 3 | Dev 1 |
| Étapes 13-16 (Champs calculés, rating, cleanup, fingerprint) | 2 | Lead |

**Avantage** : Découpage clair par blocs logiques
**Risque** : Complexité accrue au merge (conflits potentiels dans clean.conf)
**Action** : Planifier des syncs quotidiennes, branche dev à jour

### F5 découpage proposé

**Feature** : Requêtes analytiques (5 points)

**Découpage** :

| Sous-tâche | Points | Description |
| --- | --- | --- |
| Requêtes simples (1-4) | 1 | term, range, match, count |
| Requêtes bool (5-9) | 2 | must, should, must_not, filter |
| Agrégations (10-12) | 2 | terms, nested aggs, histogram |

**Avantage** : Clarté des cas métier, tests faciles
**Risque** : Interdépendances entre requêtes (besoin de mapping stable d'abord)

---

## 5) Répartition finale des features

### Sprint 1 (Semaine 1)

| Feature | Responsable | Points | Durée |
| --- | --- | --- | --- |
| F1 — Bootstrap | Lead | 2 | 1h |
| F2 — Ingestion raw | Lead | 3 | 2h |
| F3 — Nettoyage | Dev 1 | 8 | 6h |
| **Sous-total** | — | **13** | **9h** |

### Sprint 2 (Semaine 2)

| Feature | Responsable | Points | Durée |
| --- | --- | --- | --- |
| F4 — Mapping | Dev 1 | 3 | 2h |
| F5 — Requêtes | Lead | 5 | 4h |
| F6 — Dashboard | Dev 2 | 8 | 6h |
| **Sous-total** | — | **16** | **12h** |

### Sprint 3 (Semaine 3)

| Feature | Responsable | Points | Durée |
| --- | --- | --- | --- |
| F7 — Moteur recherche | Dev 2 | 5 | 4h |
| F8 — Documentation | Lead + Dev 1 + Dev 2 | 8 | 6h |
| Intégration + tests | Lead | — | 4h |
| **Sous-total** | — | **13** | **14h** |

### Synthèse

**Total estimé** : 42 points, ~35h de travail
**Durée réelle** : 3 semaines (selon équipe et blocages)

### Charge par membre

| Membre | Features | Points totaux |
| --- | --- | --- |
| Lead | F1, F2, F5, F8 (partiel) | ~13 |
| Dev 1 | F3, F4, F8 (partiel) | ~14 |
| Dev 2 | F6, F7, F8 (partiel) | ~15 |

---

## 6) Hypothèses et risques

### Hypothèses

✅ Format CSV stable et connu  
✅ Mapping Elasticsearch standard  
✅ Pas de optimisations performance complexes requises  
✅ Équipe familière avec ELK et React  
✅ Données sans anomalies métier majeures  

### Risques identifiés

| Risque | Probabilité | Impact | Mitigation |
| --- | --- | --- | --- |
| Dataset CSV très volumineux | Moyen | Moyen | Tests avec subset avant production |
| Conflits de merge dans clean.conf | Moyen | Moyen | Syncs quotidiennes, code review |
| Performance Elasticsearch | Faible | Moyen | Indexation progressively, monitoring |
| CORS bloqué entre React et ES | Faible | Moyen | Tests précoces de connectivity |
| Requirements changent mid-project | Moyen | Élevé | Scope gelé, changements = new feature |
| Charge mal répartie (équipe réduite) | Moyen | Moyen | Réajustement hebdomadaire des tâches |

### Actions de mitigation

1. **Setup précoce** : F1 + F2 sans dépendance, test ASAP
2. **Syncs quotidiennes** : 15 min pour aligner sur blocages
3. **Code review stricte** : 1+ reviewer par PR
4. **Tests locaux** : Chaque dev valide localement avant PR
5. **Documentation inline** : Commenter le code complexe

---

## 7) Velocité et productivité

### Baselines

| Métrique | Estimation |
| --- | --- |
| Vélocité moyenne | 13-16 points / semaine |
| Taille moyenne des PRs | 1-2 features par PR |
| Temps review moyen | 30-60 min par PR |
| Taux de succès de merge | 90%+ (faible taux de revert) |

### Suivi hebdomadaire

**À mettre à jour chaque vendredi** :

- Nombre de points complétés
- Nombre de PRs mergées
- Problèmes rencontrés
- Ajustements de planning
- Capacité pour la semaine prochaine

---

## 8) Post-mortem et retours

### À remplir à la fin du projet

| Question | Réponse |
| --- | --- |
| **Estimation vs réalité** | Points estimés vs points réels |
| **Blocages majeurs** | Lister les problèmes rencontrés |
| **Leçons apprises** | Quoi refaire différemment ? |
| **Amélioration** | Vitesse réelle pour futurs projets |

**Exemple** :

```
# Retro F3 — Nettoyage

Estimé : 8 points → Réel : 10 points

Raison : Logique de parsing des dates plus complexe que prévu

Leçon : Parser date en Logstash Ruby = 2h au lieu de 0.5h estimée

Mitigation : Tester les parsers de date dès le sprint 1
```

---

## Ressources utiles

- Fibonacci Estimation : https://www.agilealliance.org/glossary/estimation/
- Planning Poker : https://www.mountaingoatsoftware.com/agile/planning-poker
- Story Points : https://www.atlassian.com/agile/project-management/estimation