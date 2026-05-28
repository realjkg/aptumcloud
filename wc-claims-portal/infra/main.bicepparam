using './main.bicep'

// ── Dev Landing Zone parameters ───────────────────────────────────────────────
// Adjust location to match your dev subscription's approved regions.
// Run: az account list-locations -o table

param environment       = 'dev'
param location          = 'eastus2'
param prefix            = 'adaptcloud'
param openAiModelName   = 'gpt-4o'
param openAiModelVersion = '2024-05-13'
param openAiCapacityK   = 30
