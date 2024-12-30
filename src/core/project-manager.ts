/**
 * This module defines the ProjectManager class, which extends the BaseServiceManager
 * to manage project-level resources and enable necessary Google Cloud APIs for a given
 * project environment. The ProjectManager is responsible for validating the project
 * configuration and deploying the required APIs to ensure the infrastructure is set up
 * correctly.
 * 
 * The ProjectManager requires a ConfigurationManager instance upon instantiation to
 * access project configurations and environment-specific settings. It provides methods
 * to validate the project setup and deploy the necessary APIs as defined in the
 * configuration.
 */

import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import { BaseServiceManager, ServiceManagerOptions } from './base-manager';

export class ProjectManager extends BaseServiceManager {
  private enabledApis: string[] = [
    'apigateway.googleapis.com',
    'cloudresourcemanager.googleapis.com',
    'compute.googleapis.com',
    'dns.googleapis.com',
    'monitoring.googleapis.com',
    'secretmanager.googleapis.com',
    'servicenetworking.googleapis.com',
    'sql-component.googleapis.com'
  ];

  constructor(config: ConfigurationManager) {
    super(config, {
      name: 'project-manager',
      description: 'Manages project-level resources and API enablement'
    });
  }

  async validate(): Promise<boolean> {
    this.logger.info('Validating project configuration...');
    const projectConfig = this.config.getProjectConfig();
    
    if (!projectConfig.name || !projectConfig.environments) {
      this.logger.error('Invalid project configuration');
      return false;
    }
    return true;
  }

  async deploy(): Promise<pulumi.Resource[]> {
    const resources: pulumi.Resource[] = [];
    const projectConfig = this.config.getCurrentEnvironment();

    // Enable required APIs
    for (const api of this.enabledApis) {
      const enabledApi = new gcp.projects.Service(
        `${api}-enabled`,
        {
          project: projectConfig.project_id,
          service: api,
          disableOnDestroy: false
        },
        this.getResourceOptions()
      );
      resources.push(enabledApi);
    }

    return resources;
  }
}