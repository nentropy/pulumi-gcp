// src/config/project-parser.ts

import * as fs from 'fs';
import * as path from 'path';
import * as pulumi from "@pulumi/pulumi";

export interface GCPProjectConfig {
    projectId: string;
    projectNumber: string;
    organizationId?: string;
    billingAccount?: string;
    primaryRegion: string;
    failoverRegion: string;
    environment: string;
    dnsZone?: string;
    serviceAccounts: {
        [key: string]: string;
    };
}

export class ProjectConfigParser {
    private static instance: ProjectConfigParser;
    private config: GCPProjectConfig;
    private pulumiConfig: pulumi.Config;
    private logger: pulumi.log.Logger;

    private constructor() {
        this.pulumiConfig = new pulumi.Config();
        this.logger = new pulumi.log.Logger("ProjectConfigParser");
        
        // Initialize with required configuration
        this.config = {
            projectId: this.pulumiConfig.require("projectId"),
            projectNumber: this.pulumiConfig.require("projectNumber"),
            organizationId: this.pulumiConfig.get("organizationId"),
            billingAccount: this.pulumiConfig.get("billingAccount"),
            primaryRegion: this.pulumiConfig.get("primaryRegion") || "australia-southeast2",
            failoverRegion: this.pulumiConfig.get("failoverRegion") || "asia-southeast1",
            environment: pulumi.getStack(),
            serviceAccounts: {}
        };

        this.logger.info("Project configuration initialized", this.config);
    }

    public static getInstance(): ProjectConfigParser {
        if (!ProjectConfigParser.instance) {
            ProjectConfigParser.instance = new ProjectConfigParser();
        }
        return ProjectConfigParser.instance;
    }

    public getConfig(): GCPProjectConfig {
        return this.config;
    }

    public getResourceName(service: string, name: string): string {
        return `${this.config.environment}-${service}-${name}`;
    }

    public getTags(): Record<string, string> {
        return {
            environment: this.config.environment,
            project: this.config.projectId,
            managedBy: "pulumi",
            deployedAt: new Date().toISOString()
        };
    }
}