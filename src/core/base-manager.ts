/**
 * This module defines the BaseServiceManager class, which serves as an abstract base class
 * for managing service deployments in a Pulumi-based infrastructure. It provides common
 * functionality such as configuration management, logging, and resource option generation.
 * 
 * The BaseServiceManager requires a configuration manager and service manager options upon
 * instantiation. It includes abstract methods for deploying and validating resources, which
 * must be implemented by subclasses.
 */

import * as pulumi from '@pulumi/pulumi';
import { ConfigurationManager } from '../config/config-parser';

export interface ServiceManagerOptions {
  name: string;
  description: string;
  dependencies?: string[];
  protected?: boolean;
}

export abstract class BaseServiceManager {
  protected readonly config: ConfigurationManager;
  protected readonly logger: pulumi.log.Logger;
  protected readonly options: ServiceManagerOptions;
  protected readonly stack: string;

  constructor(config: ConfigurationManager, options: ServiceManagerOptions) {
    this.config = config;
    this.options = options;
    this.stack = pulumi.getStack();
    this.logger = new pulumi.log.Logger(options.name);
  }

  protected getResourceOptions(additionalDependencies?: pulumi.Resource[]): pulumi.ResourceOptions {
    return {
      protect: this.options.protected ?? this.stack === 'prod',
      dependsOn: additionalDependencies,
      tags: {
        environment: this.stack,
        component: this.options.name,
        managedBy: 'pulumi'
      }
    };
  }

  abstract deploy(): Promise<pulumi.Resource[]>;
  abstract validate(): Promise<boolean>;
}