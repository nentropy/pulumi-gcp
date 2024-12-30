#!/bin/bash
# gcp_config_collector.sh
# Purpose: Collects comprehensive GCP configuration information and creates 
# structured output for application use.

# Strict error handling
set -euo pipefail
IFS=$'\n\t'

# Script initialization and variable declaration
readonly SCRIPT_VERSION="1.0.0"
readonly PROJECT_ID=$(gcloud config get-value project)
readonly TIMESTAMP=$(date +%Y%m%d_%H%M%S)
readonly BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly OUTPUT_DIR="${BASE_DIR}/gcp_configuration_${TIMESTAMP}"
readonly LOG_DIR="${OUTPUT_DIR}/logs"
readonly CONFIG_DIR="${OUTPUT_DIR}/configs"
readonly REPORT_DIR="${OUTPUT_DIR}/reports"

# Color formatting for better readability
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m'

# Create directory structure
mkdir -p "${LOG_DIR}" "${CONFIG_DIR}" "${REPORT_DIR}"

# Initialize logging
exec 1> >(tee -a "${LOG_DIR}/execution.log")
exec 2> >(tee -a "${LOG_DIR}/error.log" >&2)

# Logging functions
log_info() { echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2; }
log_error() { echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2; }

# Error handler
error_handler() {
    local line_number=$1
    local error_code=${2:-1}
    log_error "Error occurred in line ${line_number} (Exit code: ${error_code})"
    cleanup
    exit "${error_code}"
}

trap 'error_handler ${LINENO}' ERR

# Cleanup function
cleanup() {
    log_info "Performing cleanup..."
    rm -f /tmp/gcp_temp_* 2>/dev/null || true
}

[Previous functions: validate_gcp_access, save_json_output, etc. remain the same]

# New function to collect project hierarchy information
collect_project_hierarchy() {
    log_info "Collecting project hierarchy information..."
    
    local hierarchy_file="${CONFIG_DIR}/project_hierarchy.json"
    
    # Get project information
    PROJECT_INFO=$(gcloud projects describe "${PROJECT_ID}" --format='json')
    
    # Get folder hierarchy if available
    FOLDER_INFO="[]"
    if [[ -n "${FOLDER_ID:-}" ]]; then
        FOLDER_INFO=$(gcloud resource-manager folders list \
            --format='json' \
            --filter="parent=folders/${FOLDER_ID}")
    fi
    
    # Combine information into a single JSON structure
    cat << EOF > "${hierarchy_file}"
{
    "project": ${PROJECT_INFO},
    "folders": ${FOLDER_INFO},
    "organization": $(gcloud organizations list --format='json' 2>/dev/null || echo "null"),
    "collected_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
}

# Function to collect resource policies
collect_resource_policies() {
    log_info "Collecting resource policies..."
    
    local policies_file="${CONFIG_DIR}/resource_policies.json"
    
    # Collect various policy types
    cat << EOF > "${policies_file}"
{
    "iam_policies": $(gcloud projects get-iam-policy "${PROJECT_ID}" --format='json'),
    "org_policies": $(gcloud org-policies list --project="${PROJECT_ID}" --format='json' 2>/dev/null || echo "[]"),
    "vpc_policies": $(gcloud compute networks list --format='json'),
    "collected_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
}

# Main execution function
main() {
    log_info "Starting GCP configuration collection..."
    
    # Validate GCP access
    validate_gcp_access
    
    # Collect configurations
    collect_project_hierarchy
    collect_resource_policies
    collect_resource_usage
    collect_security_config
    collect_network_config
    
    # Generate application credentials
    generate_app_credentials
    
    # Create master configuration file
    create_master_config
    
    log_info "Configuration collection completed successfully"
    log_info "Results available in: ${OUTPUT_DIR}"
}

# Execute main function
if main "$@"; then
    cleanup
    exit 0
else
    cleanup
    exit 1
fi