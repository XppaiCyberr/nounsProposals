# Nouns Proposals

A repository that fetches and maintains Nouns DAO proposal data with ENS resolution. This data is updated automatically via GitHub Actions.

## Purpose

This repository serves as a data dependency for a Flow Launcher plugin (Nouns Proposals). The plugin uses the `proposals.json` file to provide quick search access to Nouns DAO proposals.

## Files

### Data Files

- `proposals.json` - Contains all Nouns DAO proposals with id, title, status, and proposer information (including ENS names)
- `ens-cache.json` - Cached ENS name resolutions to avoid redundant lookups

### Scripts

- `fetch-proposals.js` - Fetches proposals from the Nouns GraphQL API and saves to `proposals.json`. Uses cached ENS data if available.
- `update-ens-cache.js` - Resolves ENS names for all unique proposer addresses. Saves progress every 10 addresses so it can be resumed if interrupted.
- `apply-ens-cache.js` - Applies ENS cache data to `proposals.json`. Use this after updating the ENS cache.

## Usage

### Install Dependencies

```bash
pnpm install
```

### Fetch Latest Proposals

```bash
node fetch-proposals.js
```

### Update ENS Cache (Optional)

```bash
node update-ens-cache.js
```

### Apply ENS Cache to Proposals

```bash
node apply-ens-cache.js
```

## Automated Updates

This repository uses GitHub Actions to automatically update `proposals.json` every 6 hours. The workflow runs `fetch-proposals.js` followed by `apply-ens-cache.js`, then commits any changes.

## Data Source

Proposals are fetched from the Nouns GraphQL API:
```
https://api.goldsky.com/api/public/project_cldf2o9pqagp43svvbk5u3kmo/subgraphs/nouns/prod/gn
```

## Note

This repository was created as a dependency for a Flow Launcher plugin. This README will be updated when the plugin is approved on the official Flow Launcher repository: https://github.com/Flow-Launcher/Flow.Launcher
