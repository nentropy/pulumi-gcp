#!/bin/zsh

# create_project_structure.sh
# Purpose: Generate a structured TypeScript project directory for Pulumi infrastructure

# Set strict error handling
set -e
set -u

# Define color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Base directory for the project
BASE_DIR="./"

mkdir -p "src"
cd src



# Function to create a directory and its index.ts file
create_module_dir() {
    local dir_name=$1
    local dir_path="${BASE_DIR}/${dir_name}"
    
    echo "${BLUE}Creating module directory: ${dir_name}${NC}"
    
    # Create directory
    mkdir -p "$dir_path"
    
    # Create index.ts with exports
    cat > "${dir_path}/index.ts" << 'EOF'
/**
 * @packageDocumentation
 * Module exports for ${dir_name}
 */

export * from './types';
EOF

    # Create types.ts with basic types
    cat > "${dir_path}/types.ts" << 'EOF'
/**
 * @packageDocumentation
 * Type definitions for ${dir_name} module
 */

export interface ResourceConfig {
    name: string;
    tags: Record<string, string>;
    environment: string;
}
EOF
}

# Function to create a TypeScript file with base content
create_ts_file() {
    local dir_name=$1
    local file_name=$2
    local description=$3
    local file_path="${BASE_DIR}/${dir_name}/${file_name}.ts"
    
    echo "${GREEN}Creating file: ${file_name}.ts${NC}"
    
    cat > "$file_path" << EOF
/**
 * @packageDocumentation
 * ${description}
 */

import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { ResourceConfig } from './types';

export class $(echo "${file_name^}") {
    private readonly config: ResourceConfig;
    
    constructor(config: ResourceConfig) {
        this.config = config;
    }
EOF
}

# Main execution
echo "${BLUE}Starting project structure generation...${NC}"

# Create base directory
mkdir -p "$BASE_DIR"

# Create module directories
MODULES=(
    "config"
    "core"
    "storage"
    "compute"
    "analytics"
    "reporting"
)

# Create each module directory and its files
for module in "${MODULES[@]}"; do
    create_module_dir "$module"
    
    # Create module-specific files
    case $module in
        "config")
            create_ts_file "$module" "base-config" "Base configuration management"
            create_ts_file "$module" "dev-config" "Development environment configuration"
            create_ts_file "$module" "prod-config" "Production environment configuration"
            ;;
        "core")
            create_ts_file "$module" "project" "Project setup and IAM configuration"
            create_ts_file "$module" "networking" "VPC and networking components"
            create_ts_file "$module" "security" "Security and compliance components"
            ;;
        "storage")
            create_ts_file "$module" "buckets" "Cloud Storage configuration"
            create_ts_file "$module" "databases" "Database configuration"
            ;;
        "compute")
            create_ts_file "$module" "functions" "Cloud Functions configuration"
            create_ts_file "$module" "run" "Cloud Run services"
            create_ts_file "$module" "vm" "Compute Engine resources"
            ;;
        "analytics")
            create_ts_file "$module" "bigquery" "BigQuery configuration"
            create_ts_file "$module" "monitoring" "Monitoring and alerting"
            ;;
        "reporting")
            create_ts_file "$module" "generator" "Report generation"
            create_ts_file "$module" "distributor" "Report distribution"
            ;;
    esac
done

echo "${GREEN}Project structure generation completed successfully${NC}"