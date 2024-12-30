// src/core/networking-manager.ts

import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import { BaseServiceManager } from './base-manager';

export class NetworkingManager extends BaseServiceManager {
  private vpc?: gcp.compute.Network;
  private subnets: Map<string, gcp.compute.Subnetwork> = new Map();
  private firewalls: gcp.compute.Firewall[] = [];

  constructor(config: ConfigurationManager) {
    super(config, {
      name: 'networking-manager',
      description: 'Manages VPC, subnets, and networking components',
      protected: true
    });
  }

  async validate(): Promise<boolean> {
    this.logger.info('Validating networking configuration...');
    return true;
  }

  async deploy(): Promise<pulumi.Resource[]> {
    const resources: pulumi.Resource[] = [];
    const projectConfig = this.config.getCurrentEnvironment();

    // Create VPC
    this.vpc = new gcp.compute.Network(
      'main-vpc',
      {
        project: projectConfig.project_id,
        autoCreateSubnetworks: false,
        description: 'Main VPC for ROAI platform',
        routingMode: 'REGIONAL',
        deleteDefaultRoutesOnCreate: false
      },
      this.getResourceOptions()
    );
    resources.push(this.vpc);

    // Create subnets
    const subnetConfig = {
      app: '10.0.1.0/24',
      data: '10.0.2.0/24',
      api: '10.0.3.0/24'
    };

    for (const [name, cidr] of Object.entries(subnetConfig)) {
      const subnet = new gcp.compute.Subnetwork(
        `${name}-subnet`,
        {
          project: projectConfig.project_id,
          network: this.vpc.id,
          ipCidrRange: cidr,
          region: this.config.getProjectConfig().regions.primary,
          privateIpGoogleAccess: true
        },
        this.getResourceOptions([this.vpc])
      );
      this.subnets.set(name, subnet);
      resources.push(subnet);
    }

    // Create basic firewall rules
    const firewallRules = [
      {
        name: 'allow-internal',
        ranges: ['10.0.0.0/8'],
        tcp: ['0-65535'],
        udp: ['0-65535'],
        icmp: true
      },
      {
        name: 'allow-https',
        ranges: ['0.0.0.0/0'],
        tcp: ['443']
      }
    ];

    for (const rule of firewallRules) {
      const firewall = new gcp.compute.Firewall(
        `${rule.name}-firewall`,
        {
          project: projectConfig.project_id,
          network: this.vpc.name,
          allows: [
            {
              protocol: 'tcp',
              ports: rule.tcp
            },
            ...(rule.udp ? [{
              protocol: 'udp',
              ports: rule.udp
            }] : []),
            ...(rule.icmp ? [{
              protocol: 'icmp'
            }] : [])
          ],
          sourceRanges: rule.ranges
        },
        this.getResourceOptions([this.vpc])
      );
      this.firewalls.push(firewall);
      resources.push(firewall);
    }

    return resources;
  }
}