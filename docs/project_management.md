# Gestion de Projet — Movies Data Platform ELK

## Vue d'ensemble

Ce document documente l'organisation du projet, la structure Git, et le processus de contribution.

**Objectifs de la gestion de projet** :
- ✅ Assurer la traçabilité du travail (branches, commits, PRs)
- ✅ Garantir la qualité du code (reviews, testing)
- ✅ Coordonner l'équipe (planning poker, répartition des tâches)
- ✅ Maintenir une baseline stable (`main` et `dev`)

---

## Structure Git — Gitflow

### Branches principales

| Branche | Rôle | Durée | Protection |
| --- | --- | --- | --- |
| `main` | Production (version stable) | Permanente | ✅ Pas de push direct |
| `dev` | Intégration (branche de test) | Permanente | ✅ Pas de push direct |
| `feature/*` | Développement (1 feature = 1 branche) | Temporaire | ❌ Développeur |
| `hotfix/*` | Corrections urgentes | Temporaire | ❌ Lead technique |
| `release/*` | Préparation release | Temporaire | ❌ Lead technique |

### Workflow recommandé

```
main (production)
  ↑
  └─ PR (testée en dev)
     └─ dev (branche intégration)
        ↑
        └─ PR (depuis feature/*)
           └─ feature/bootstrap-stack
           └─ feature/ingestion-raw
           └─ feature/nettoyage-clean
           └─ feature/mapping-elasticsearch
           └─ feature/requetes-analytiques
           └─ feature/dashboard-kibana
           └─ feature/moteur-recherche
           └─ feature/documentation
```

---

## Cycle de développement d'une feature

### Phase 1 : Préparation

1. **Créer une branche feature**

   ```bash
   git checkout dev
   git pull
   git checkout -b feature/nom-court
   ```

   **Convention de naming** : `feature/<id>-<slug>`
   - ✅ `feature/01-bootstrap-stack`
   - ✅ `feature/02-ingestion-raw`
   - ❌ `feature/new_feature` (non numéroté)
   - ❌ `feature/F1` (trop court)

2. **Créer un ticket** (dans Jira, GitHub Projects, Trello, etc.)
   - Titre : description courte de la feature
   - Description : user story, critères d'acceptation
   - Assigné à : responsable
   - Lien branche : `feature/nom`

### Phase 2 : Développement

1. **Développer la feature**

   ```bash
   # Effectuer les changements
   git add <fichiers>
   git commit -m "feat: description du changement"
   
   # Ou pour des fixes
   git commit -m "fix: description du fix"
   
   # Ou pour de la doc
   git commit -m "docs: description"
   ```

   **Convention de messages de commit** (Conventional Commits) :

   ```
   <type>(<scope>): <description>
   
   <body (optionnel)>
   
   <footer (optionnel)>
   ```

   **Types** :
   - `feat` : Nouvelle fonctionnalité
   - `fix` : Correction d'anomalie
   - `docs` : Documentation
   - `refactor` : Restructuration (sans changement fonctionnel)
   - `test` : Tests
   - `chore` : Tâches de maintenance

   **Exemples** :

   ```bash
   git commit -m "feat(logstash): add data cleaning pipeline"
   git commit -m "fix(mapping): correct keyword field type"
   git commit -m "docs(readme): update installation instructions"
   git commit -m "test(elasticsearch): add bool query tests"
   ```

2. **Tester la feature localement**

   ```bash
   # Vérifier que la stack démarre
   docker-compose up -d
   
   # Vérifier que les données s'ingèrent
   curl http://localhost:9201/movies_clean/_count
   
   # Vérifier les requêtes
   # (Via Kibana DevTools)
   ```

3. **Mettre à jour la documentation associée**

   - Documenter les changements dans la doc technique
   - Mettre à jour le README si applicable
   - Ajouter des commentaires dans le code si nécessaire

### Phase 3 : Publication

1. **Pousser la branche**

   ```bash
   git push origin feature/nom-court
   ```

2. **Ouvrir une Pull Request sur GitHub**

   Sur le repo GitHub :
   - Cliquer sur **Compare & pull request**
   - **Base** : `dev` (toujours merger dans dev, JAMAIS dans main)
   - **Compare** : `feature/nom-court`
   - **Titre** : `[Feature] description courte` ou numéro de ticket
   - **Description** : Expliquer la feature, les changements, comment tester

   **Template de PR** :

   ```markdown
   ## Description
   
   Brève explication de la feature.
   
   ## Type de changement
   
   - [ ] Nouvelle fonctionnalité
   - [ ] Correction d'anomalie
   - [ ] Documentation
   - [ ] Refactoring
   
   ## Changements réalisés
   
   - Point 1
   - Point 2
   - Point 3
   
   ## Comment tester ?
   
   1. Démarrer la stack
   2. Faire XYZ
   3. Vérifier que ABC s'affiche
   
   ## Screenshots/Logs (si pertinent)
   
   ```
   <logs ou captures>
   ```
   
   ## Checklist
   
   - [ ] J'ai testé la feature localement
   - [ ] La doc est à jour
   - [ ] Pas de fichiers non versionnés en extra
   - [ ] Les commits sont explicites
   ```

### Phase 4 : Review

1. **Demander un reviewer** (minimum 1)

   Sur GitHub : assigner au moins 1 reviewer dans le champ "Reviewers"

2. **Le reviewer vérifie** :
   - ✅ Que le code fait ce qu'il prétend faire
   - ✅ Que la logique est correcte
   - ✅ Que la doc est à jour
   - ✅ Que les tests passent
   - ✅ Pas de perte de fonctionnalité

3. **Répondre aux commentaires**

   Si le reviewer demande des changements :

   ```bash
   # Faire les changements
   git add <fichiers>
   git commit -m "fix: adresse les retours du review"
   git push
   ```

   La PR se met à jour automatiquement.

4. **Approuver la PR**

   Dès que le reviewer approuve (bouton "Approve"), la PR est prête à merger.

### Phase 5 : Merge

1. **Merger dans dev**

   Sur GitHub : cliquer sur **Merge pull request**
   - Choisir **Squash and merge** ou **Create a merge commit** selon la préférence
   - Supprimer la branche feature après merge

2. **Synchroniser localement**

   ```bash
   git checkout dev
   git pull
   
   # Ou supprimer la branche locale
   git branch -D feature/nom-court
   ```

3. **Vérifier que dev est stable**

   ```bash
   docker-compose down -v
   docker-compose up -d
   
   # Vérifier que la stack démarre
   # Vérifier que les tests passent
   ```

---

## Ordre de merge des features (dépendances)

Respecter cet ordre pour éviter les conflits et les dépendances manquantes :

1. **F1 — Bootstrap stack** ✅
   - Docker Compose opérationnel
   - Logs et volumes montés
   - Santé des services vérifiée

2. **F2 — Ingestion brute** ✅
   - Pipeline raw.conf opérationnel
   - Index movies_raw rempli
   - Preuve d'ingestion

3. **F3 — Nettoyage & normalisation** ✅
   - Pipeline clean.conf opérationnel
   - Index movies_clean avec données nettoyées
   - Étapes de nettoyage documentées

4. **F4 — Mapping & qualité** ✅
   - Mapping explicite appliqué
   - Analyzer personnalisé actif
   - Vérifications de qualité

5. **F5 — Requêtes analytiques**
   - 12+ requêtes DSL commentées
   - 5+ requêtes bool
   - Exemples de cas métier

6. **F6 — Dashboard Kibana**
   - 6-8 visualisations créées
   - 1 dashboard structuré
   - Exporté en `.ndjson`

7. **F7 — Moteur de recherche**
   - API Elasticsearch connectée
   - Interface UI fonctionnelle
   - Recherche + filtre opérationnels

8. **F8 — Documentation finale**
   - Tous les fichiers `.md` complétés
   - Runbook exécutable
   - Document synthèse finalisé

---

## Protection des branches

### main

- ✅ Pas de push direct autorisé
- ✅ Demande minimum 1 review
- ✅ Les tests doivent passer
- ✅ Uniquement merger des commits depuis `dev`

**Raison** : `main` doit rester stable et deployable à tout moment.

### dev

- ✅ Pas de push direct autorisé
- ✅ Demande minimum 1 review
- ⚠️ Les features peuvent être en cours
- ✅ Doit être testable à tout moment

**Raison** : `dev` est la branche d'intégration. Elle doit rester fonctionnelle pour que l'équipe puisse tester.

### feature/*

- ❌ Pas de protection
- ❌ Développeur a accès complet
- ✅ Code will be reviewed before merge

---

## Bonnes pratiques

### ✅ À faire

| Pratique | Raison |
| --- | --- |
| Faire de petits commits fréquents | Historique lisible, rollback facile |
| Messages de commit explicites | Facilite la compréhension du code |
| 1 feature = 1 branche | Isolement du travail |
| Tester avant de pousser | Éviter les erreurs en cascade |
| Demander review avant merge | Qualité du code |
| Mettre à jour la doc | Maintenabilité à long terme |
| Nommer les branches de manière cohérente | Compréhension immédiate du contenu |
| Supprimer les branches mergées | Propreté du repo |

### ❌ À éviter

| Mauvaise pratique | Problème |
| --- | --- |
| Push direct sur `main` ou `dev` | Perte de traçabilité, risque de regression |
| Commits massifs avec 10+ fichiers | Difficile à revue, impossible à rollback partiellement |
| Messages de commit vagues ("fix bug", "update") | Impossible de comprendre l'historique |
| Attendre 1 semaine avant de faire PR | Conflits énormes, perte de contexte |
| Ignorer les retours de review | Qualité compromised |
| Oublier de documenter | Durabilité de la solution |
| Utiliser la branche `dev` directement pour développer | Perturbe l'intégration |

---

## Responsibilities par rôle

### Lead Technique

- ✅ Créer et protéger les branches `main` et `dev`
- ✅ Approuver les PRs de feature majeures
- ✅ Merger les PRs en `dev`
- ✅ Créer les releases (merge `dev` → `main`)
- ✅ Escalader les conflits de merge
- ✅ Valider que l'ordre des features est respecté

### Développeurs

- ✅ Créer des branches feature depuis `dev`
- ✅ Faire des commits explicites
- ✅ Tester localement avant PR
- ✅ Ouvrir la PR avec description complète
- ✅ Répondre aux commentaires de review
- ✅ Documenter la feature
- ✅ Mettre à jour le README si applicable

### Reviewer

- ✅ Examiner le code et la logique
- ✅ Vérifier que la doc est à jour
- ✅ Demander des clarifications si nécessaire
- ✅ Approuver ou demander des changements
- ✅ Tester la feature si pertinent
- ✅ Valider les critères d'acceptation

---

## Checklists avant merge

### Avant d'ouvrir une PR

- [ ] Branche créée depuis `dev` : `git checkout dev && git pull`
- [ ] Feature testée localement : `docker-compose up -d` + tests
- [ ] Commits explicites : `git log --oneline`
- [ ] Pas de fichiers en extra : `git status`
- [ ] Documentation mise à jour : README, `.md`, comments
- [ ] Pas de secrets ou données sensibles dans les commits

### Avant d'approuver une PR

- [ ] Code compréhensible et logique
- [ ] Documentation à jour
- [ ] Feature testée en local
- [ ] Pas de régressions
- [ ] Critères d'acceptation validés
- [ ] La feature est prête pour `dev`

### Avant de merger dans dev

- [ ] 1+ reviewer a approuvé
- [ ] Pas de conflits de merge
- [ ] Tests locaux passent
- [ ] Documentation est complète
- [ ] Branche feature peut être supprimée

---

## Gestion des conflits

### Cas 1 : Conflit lors du merge de branche

**Symptôme** :

```
Conflict in logstash/pipeline/clean.conf
```

**Résolution** :

1. Abord : synchroniser `dev` localement

   ```bash
   git fetch origin
   git rebase origin/dev
   ```

2. Résoudre les conflits dans l'éditeur

   ```
   <<<<<<< HEAD
   Votre version
   =======
   Leur version
   >>>>>>> main
   ```

3. Garder la bonne version, tester

   ```bash
   git add <fichiers>
   git rebase --continue
   git push -f origin feature/nom
   ```

### Cas 2 : Deux features modifient le même fichier

**Prévention** :

- Communiquer avant de travailler sur les mêmes fichiers
- Découper le travail en sous-features si possible
- Merger fréquemment pour éviter les dérives

**Résolution** :

- Feature 1 merge dans `dev` en premier
- Feature 2 rebaser sur `dev` : `git rebase origin/dev`
- Résoudre les conflits
- Repousser : `git push -f origin feature/nom`

---

## Outils recommandés

### Git CLI

```bash
# Cloner le repo
git clone <url>

# Créer et basculer vers une branche
git checkout -b feature/nom

# Voir l'historique
git log --oneline --graph --all

# Voir les changements
git diff

# Stash temporaire
git stash
git stash pop
```

### GitHub (Web)

- Ouvrir/approuver/merger PRs
- Voir l'historique des commits
- Lister les branches
- Voir le status des CI/CD

### Éditeur (VSCode)

- Extension Git Graph (visualiser l'historique)
- Extension GitHub Pull Requests (gérer les PRs depuis l'éditeur)

---

## Suivi du projet : Tableau de suivi

**État du projet** (à tenir à jour) :

| Feature | Responsable | Status | PR | Notes |
| --- | --- | --- | --- | --- |
| F1 — Bootstrap | ... | ✅ Done | #1 | Stack opérationnel |
| F2 — Ingestion raw | ... | ✅ Done | #2 | 1200+ docs |
| F3 — Nettoyage | ... | ✅ Done | #3 | 16 étapes |
| F4 — Mapping | ... | ✅ Done | #4 | Analyzer custom |
| F5 — Requêtes | ... | 🟡 In Progress | #5 | 10/12 requêtes |
| F6 — Dashboard | ... | 🔴 To Do | — | — |
| F7 — Moteur recherche | ... | 🔴 To Do | — | — |
| F8 — Documentation | ... | 🔴 To Do | — | — |

---

## Ressources

- **Gitflow** : https://nvie.com/posts/a-successful-git-branching-model/
- **Conventional Commits** : https://www.conventionalcommits.org/
- **GitHub Flow** : https://guides.github.com/introduction/flow/
- **Code Review Best Practices** : https://google.github.io/eng-practices/review/
