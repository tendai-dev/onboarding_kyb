#!/bin/bash
set -e

# This script creates multiple databases and users based on environment variables
# POSTGRES_MULTIPLE_DATABASES: space-separated list of database names
# POSTGRES_MULTIPLE_USERS: space-separated list of user:password pairs

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
    for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
        db=$(echo "$db" | xargs) # trim whitespace
        if [ -z "$db" ]; then
            continue
        fi
        
        echo "Creating database: $db"
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
            DO \$\$
            BEGIN
                IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db') THEN
                    CREATE DATABASE $db;
                END IF;
            END
            \$\$;
EOSQL
    done
fi

if [ -n "$POSTGRES_MULTIPLE_USERS" ]; then
    for userpass in $(echo $POSTGRES_MULTIPLE_USERS | tr ',' ' '); do
        userpass=$(echo "$userpass" | xargs) # trim whitespace
        if [ -z "$userpass" ]; then
            continue
        fi
        
        IFS=':' read -r username password <<< "$userpass"
        if [ -z "$username" ] || [ -z "$password" ]; then
            echo "Warning: Invalid user:password format: $userpass"
            continue
        fi
        
        echo "Creating user: $username"
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
            DO \$\$
            BEGIN
                IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$username') THEN
                    CREATE USER $username WITH PASSWORD '$password';
                END IF;
            END
            \$\$;
EOSQL
        
        # Grant privileges on all databases
        if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
            for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
                db=$(echo "$db" | xargs)
                if [ -n "$db" ]; then
                    echo "Granting privileges on $db to $username"
                    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$db" <<-EOSQL
                        GRANT ALL PRIVILEGES ON DATABASE $db TO $username;
                        ALTER DATABASE $db OWNER TO $username;
EOSQL
                fi
            done
        fi
    done
fi

echo "Multiple databases and users initialization completed"

