# CaisseFacile — Logiciel de Caisse Épicerie

Application Desktop développée avec Electron et Node.js destinée à numériser la gestion d'une épicerie de quartier en remplaçant la caisse enregistreuse mécanique et le cahier de comptes.

---

## 1. Fonctionnalités principales

* Écran de caisse : Saisie par douchette (EAN) ou code court (SKU), gestion du ticket en cours, modification des quantités et encaissement rapide.
* Gestion du catalogue : Création de produits manuelle ou enrichissement automatique via l'API publique OpenFoodFacts.
* Comptabilité : Consultation de l'historique des tickets et export journalier au format .CSV compatible Excel.
* Mode Hors-ligne : Continuité de service garantie. Si la connexion internet coupe, la caisse continue d'encaisser sur la base locale.

---

## 2. Architecture & Choix techniques justifiés

1. Persistance locale (better-sqlite3) : Base de données SQLite embarquée en mode WAL (Write-Ahead Logging). En cas de coupure de courant au moment de l'encaissement, la base ne se corrompt pas.
2. Sécurité stricte (ContextBridge) : Respect des standards Electron. Le moteur de rendu (HTML/JS) est totalement isolé du système : il n'a aucun accès direct au système de fichiers ou à Node.js et passe obligatoirement par une passerelle sécurisée (preload.js).
3. Exactitude monétaire : Pour éviter les erreurs de virgule flottante propres à JavaScript (0.1 + 0.2 ≠ 0.3), l'intégralité des prix est stockée et calculée en base sous forme d'entiers de centimes (ex: 1.25 € se stocke 125).
4. Transactions SQL : L'encaissement d'un ticket (table sales + table sale_items) est encapsulé dans une transaction unique. Si l'écriture d'un article échoue, l'intégralité de la transaction est annulée.
5. Résilience réseau : L'appel à l'API OpenFoodFacts est bridé par un AbortController de 1500 ms. Si le réseau de la boutique ralentit, l'interface ne fige pas et bascule instantanément en saisie manuelle.

---

## 3. Installation & Démarrage

### Prérequis
* Node.js (v20 ou supérieur)
* Windows Build Tools (uniquement pour la compilation initiale du module natif SQLite)

### Installation des dépendances
```bash
npm install