# Deployment Guide

This guide deploys `aileun-agents` as a Phase 1 CLI/SQLite ledger tool on a VPS.

## 1. Clone

```bash
sudo mkdir -p /opt/aileun
sudo chown "$USER":"$USER" /opt/aileun
git clone git@github-isbe:isbe-bot/aileun-agents.git /opt/aileun/aileun-agents
cd /opt/aileun/aileun-agents
```

## 2. Verify

```bash
npm run format
npm test
npm run build
npm run smoke
```

## 3. Prepare runtime directory

```bash
sudo mkdir -p /srv/aileun/runtime/agents
sudo chown -R "$USER":"$USER" /srv/aileun/runtime/agents
export AILEUN_AGENTS_RUNTIME=/srv/aileun/runtime/agents
node bin/agentctl.js init --json
```

## 4. Install CLI symlink

```bash
sudo ln -sf /opt/aileun/aileun-agents/bin/agentctl.js /usr/local/bin/agentctl
agentctl --help
```

## 5. Persist environment

For operators, add this to shell profile or a future `/etc/aileun/aileun-agents.env` file:

```bash
export AILEUN_AGENTS_RUNTIME=/srv/aileun/runtime/agents
```

## Current deployment boundary

Phase 1 is safe to deploy as a CLI/ledger utility. It does not install a daemon, systemd unit, cron entry, OpenClaw plugin, or network listener. Those are roadmap items.

## Backup

Back up the runtime directory, especially the SQLite DB:

```bash
tar -C /srv/aileun/runtime/agents -czf aileun-agents-runtime-backup.tgz .
```

## Upgrade

```bash
cd /opt/aileun/aileun-agents
git pull --ff-only
npm test
export AILEUN_AGENTS_RUNTIME=/srv/aileun/runtime/agents
node bin/agentctl.js init --json
```

`init` is idempotent and applies pending migrations.
