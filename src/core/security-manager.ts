// src/core/security-manager.ts

import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import { BaseServiceManager } from './base-manager';

export class SecurityManager extends BaseServiceManager {
  private serviceAccounts: Map<string, gcp.serviceaccount.Account> = new Map();

  constructor(config: ConfigurationManager) {
    super(config, {
      name: 'security-manager',
      description: 'Manages security configurations, service accounts, and IAM',
      protected: true
    });
  }

  async validate(): Promise<boolean> {
    this.logger.info('Validating security configuration...');
    const securityConfig = this.config.getServiceConfig().security;
    
    if (!securityConfig.service_accounts) {
      this.logger.error('No service accounts configured');
      return false;
    }
    return true;
  }

  async deploy(): Promise<pulumi.Resource[]> {
    const resources: pulumi.Resource[] = [];
    const projectConfig = this.config.getCurrentEnvironment();
    const securityConfig = this.config.getServiceConfig().security;

    // Create service accounts
    for (const sa of securityConfig.service_accounts) {
      const serviceAccount = new gcp.serviceaccount.Account(
        `${sa.name}-sa`,
        {
          accountId: `${sa.name}-sa`,
          displayName: sa.name,
          description: sa.description,
          project: projectConfig.project_id
        },
        this.getResourceOptions()
      );
      this.serviceAccounts.set(sa.name, serviceAccount);
      resources.push(serviceAccount);
    }

    // Create KMS configuration
    const keyRing = new gcp.kms.KeyRing(
      'main-keyring',
      {
        name: 'main-keyring',
        location: this.config.getProjectConfig().regions.primary,
        project: projectConfig.project_id
      },
      this.getResourceOptions()
    );
    resources.push(keyRing);

    // Create encryption key
    const encryptionKey = new gcp.kms.CryptoKey(
      'encryption-key',
      {
        name: 'encryption-key',
        keyRing: keyRing.id,
        rotationPeriod: '7776000s', // 90 days
        purpose: 'ENCRYPT_DECRYPT'
      },
      this.getResourceOptions([keyRing])
    );
    resources.push(encryptionKey);

    return resources;
  }
}