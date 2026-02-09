
import { SimulationService } from '../src/services/simulationService';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch'; // May need to verify if node-fetch is available or use native fetch in Node 18+

// Native fetch in Node 18+ global context
const fetchApi = global.fetch || fetch;

const AGENT_API_URL = 'http://127.0.0.1:8000/api/broadcast';
const PROJECT_PATH = 'c:/Users/pc/Desktop/G7V0101/GAI/grafcet-backend'; // Demo path
const FILE_NAME = 'test.sfc';
// Normalize path for frontend (forward slashes)
const FILE_PATH = path.join(PROJECT_PATH, FILE_NAME).replace(/\\/g, '/');

async function broadcast(type: string, data: any = {}) {
    try {
        const payload = { type, ...data };
        console.log(`📡 Broadcasting: ${type}`);
        const response = await fetchApi(AGENT_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payload })
        });

        if (!response.ok) {
            console.error(`❌ Broadcast failed: ${response.statusText}`);
        }
    } catch (e) {
        console.error(`❌ Broadcast Error:`, e);
    }
}

async function run() {
    console.log("🚀 Starting Simulation Script...");

    // 1. Load Diagram
    console.log(`📂 Loading file: ${FILE_PATH}`);
    let diagram;
    try {
        const content = await fs.readFile(FILE_PATH, 'utf-8');
        diagram = JSON.parse(content);
        // Fix for "elements" vs "steps" mismatch if any
        if (!diagram.elements && diagram.steps) {
            diagram.elements = [...diagram.steps, ...(diagram.transitions || [])];
        }
    } catch (e) {
        console.error("❌ Failed to load file:", e);
        process.exit(1);
    }

    // 2. Open Panel & File in Frontend
    console.log("📂 Requesting Open File...");
    await broadcast('open_file', { filePath: FILE_PATH });

    await new Promise(r => setTimeout(r, 500)); // Wait for file load

    console.log("📋 Requesting Open Panel...");
    await broadcast('sim_panel_open');

    // Allow UI to settle
    await new Promise(r => setTimeout(r, 1000));

    // 3. Initialize Simulation
    console.log("⚙️ Initializing Simulation...");
    let state = SimulationService.init(diagram);

    // Start Visualization
    console.log("▶️  Requesting Sim Start...");
    await broadcast('sim_start');

    // Initial State Update
    await broadcast('sim_step', {
        stepNumber: 0,
        activeSteps: state.activeSteps,
        name: "Initial State"
    });

    // 4. Run Loop
    const steps = 50;
    const delayMs = 2000; // Slower for visibility

    console.log("🎬 Starting Loop...");
    for (let i = 1; i <= steps; i++) {
        console.log(`▶️ Step ${i}`);

        // Define Inputs (Injected Values)
        const inputs = {
            transitions: {},
            variables: {}
        };

        // Example Injection: Trigger t1 at step 2
        if (i === 2) {
            console.log("⚡ Injecting: t1 = true");
            inputs.transitions['t1'] = true;
        }

        // Execute Step
        const result = SimulationService.executeStep(diagram, state, inputs);

        // Check if state changed
        const activeStepsChanged = JSON.stringify(state.activeSteps) !== JSON.stringify(result.state.activeSteps);

        state = result.state;

        // Broadcast Update
        await broadcast('sim_step', {
            stepNumber: i,
            activeSteps: state.activeSteps,
            name: `Step ${i}`,
            variables: state.variables,
            actions: result.actions
        });

        if (result.actions.length > 0) {
            console.log("⚡ Actions:", result.actions);
        }

        if (activeStepsChanged) {
            console.log("🔀 State Changed:", state.activeSteps);
        }

        await new Promise(r => setTimeout(r, delayMs));
    }

    console.log("✅ Simulation Complete");
    await broadcast('sim_complete');
}

run();
