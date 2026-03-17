#!/usr/bin/env node

import { execSync } from 'child_process';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error(chalk.red('❌ Missing required environment variables'));
    console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

async function checkDependencies() {
    console.log(chalk.blue('🔍 Checking dependencies for vulnerabilities...'));
    try {
        const output = execSync('npm audit --json', { encoding: 'utf-8', stdio: 'pipe' });
        const audit = JSON.parse(output);

        return {
            status: audit.metadata?.vulnerabilities?.total === 0 ? 'pass' : 'fail',
            vulnerabilities: audit.metadata?.vulnerabilities || {},
            details: audit.vulnerabilities || {},
        };
    } catch (e) {
        // npm audit returns non-zero exit code when vulnerabilities found
        try {
            const output = e.stdout?.toString() || e.stderr?.toString() || '';
            const audit = JSON.parse(output);

            return {
                status: audit.metadata?.vulnerabilities?.total === 0 ? 'pass' : 'fail',
                vulnerabilities: audit.metadata?.vulnerabilities || {},
                details: audit.vulnerabilities || {},
            };
        } catch {
            return {
                status: 'fail',
                error: 'Unable to parse npm audit output',
                vulnerabilities: {},
            };
        }
    }
}

async function checkSecrets() {
    console.log(chalk.blue('🔍 Checking for exposed secrets...'));

    const patterns = [
        { name: 'Supabase Service Role Key', pattern: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"][^'"]+['"]/i },
        { name: 'Stripe Secret Key', pattern: /STRIPE_SECRET_KEY\s*=\s*['"][^'"]+['"]/i },
