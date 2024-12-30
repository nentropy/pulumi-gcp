/**
 * @packageDocumentation
 * Database configuration
 */

import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { ResourceConfig } from './types';

export class  {
    private readonly config: ResourceConfig;
    
    constructor(config: ResourceConfig) {
        this.config = config;
    }
