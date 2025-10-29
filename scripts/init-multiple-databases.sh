#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE keycloak;
    CREATE DATABASE onboarding;
    CREATE DATABASE documents;
    CREATE DATABASE risk;
    CREATE DATABASE notifications;
    CREATE DATABASE checklist;
    CREATE DATABASE messaging;
    CREATE DATABASE auditlog;
    CREATE DATABASE webhooks;
    CREATE DATABASE projections;
    CREATE DATABASE workqueue;
    CREATE DATABASE events;
EOSQL
