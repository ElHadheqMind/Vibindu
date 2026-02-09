/**
 * ScenarioRunner Service
 * 
 * Executes simulation scenarios with variable manipulation.
 * Uses actual SimulationService.executeStep() logic to ensure consistent behavior.
 */

import { SimulationService } from './simulationService.js';
import type { GrafcetDiagram } from '../types/index.js';

export interface Scenario {
    name: string;
    variables: Record<string, any>;  // Match by name, e.g. { "SensorA": true }
    transitions?: Record<string, boolean>;  // Optional direct transition triggers
}

export interface ScenarioResult {
    name: string;
    stepNumber: number;
    activeSteps: string[];
    activeActions: string[];
    variablesApplied: Record<string, any>;
    success: boolean;
}

export interface ScenarioRunResult {
    results: ScenarioResult[];
    loadedFilePath: string;
    totalScenarios: number;
}

export class ScenarioRunner {

    /**
     * Runs a sequence of scenarios against a loaded diagram.
     * Each scenario specifies variable values to apply before executing a step.
     * 
     * @param diagram The loaded SFC diagram
     * @param scenarios List of scenarios to execute sequentially
     * @returns Results for each scenario
     */
    static runScenarios(diagram: GrafcetDiagram, scenarios: Scenario[]): ScenarioResult[] {
        // Initialize simulation state from initial steps
        let state = SimulationService.init(diagram);
        const results: ScenarioResult[] = [];

        console.log(`[ScenarioRunner] Starting with ${scenarios.length} scenarios`);
        console.log(`[ScenarioRunner] Initial active steps:`, state.activeSteps);

        for (let i = 0; i < scenarios.length; i++) {
            const scenario = scenarios[i];

            console.log(`[ScenarioRunner] Scenario ${i + 1}: "${scenario.name}"`);
            console.log(`[ScenarioRunner] Variables to apply:`, scenario.variables);

            // Build inputs from scenario
            const inputs = {
                transitions: scenario.transitions || {},
                variables: scenario.variables || {}
            };

            // Execute step using actual SimulationService logic
            const result = SimulationService.executeStep(diagram, state, inputs);
            state = result.state;

            // Extract action names
            const actionNames = result.actions.map(a => a.variable);

            console.log(`[ScenarioRunner] Result - Active steps:`, state.activeSteps);
            console.log(`[ScenarioRunner] Result - Actions:`, actionNames);

            results.push({
                name: scenario.name || `Scenario ${i + 1}`,
                stepNumber: i + 1,
                activeSteps: state.activeSteps,
                activeActions: actionNames,
                variablesApplied: scenario.variables || {},
                success: true
            });
        }

        return results;
    }

    /**
     * Loads a diagram from file and runs scenarios.
     * 
     * @param filePath Absolute path to the SFC JSON file
     * @param scenarios List of scenarios to execute
     */
    static async runFromFile(filePath: string, scenarios: Scenario[]): Promise<ScenarioRunResult> {
        const fs = await import('fs/promises');

        console.log(`[ScenarioRunner] Loading diagram from: ${filePath}`);

        let diagram: GrafcetDiagram;
        try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            diagram = JSON.parse(fileContent);

            // Handle elements vs steps mismatch (legacy support)
            if (!diagram.elements && (diagram as any).steps) {
                diagram.elements = [
                    ...(diagram as any).steps,
                    ...((diagram as any).transitions || [])
                ];
            }
        } catch (error: any) {
            throw new Error(`Failed to load diagram: ${error.message}`);
        }

        const results = ScenarioRunner.runScenarios(diagram, scenarios);

        return {
            results,
            loadedFilePath: filePath,
            totalScenarios: scenarios.length
        };
    }
}
