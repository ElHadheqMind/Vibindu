
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// @ts-ignore
declare const process: any;

const API_URL = 'http://localhost:3001/api';

async function runVerification() {
    console.log('🚀 Starting Full Persistence Verification...');

    // 0. Authenticate
    let token = '';
    const testUser = {
        email: `test_${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Test User'
    };

    try {
        console.log(`\n0. Authenticating as ${testUser.email}...`);

        // Try register
        try {
            await axios.post(`${API_URL}/auth/register`, testUser);
            console.log('✅ Registered new test user.');
        } catch (e: any) {
            console.log('ℹ️ User might already exist or registration failed (ignoring if we can login).');
        }

        // Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });

        if (loginRes.data.success && loginRes.data.token) {
            token = loginRes.data.token;
            console.log('✅ Logged in successfully.');
        } else {
            throw new Error('Login failed: No token received.');
        }

    } catch (error: any) {
        console.error('❌ Authentication Failed:', error.response?.data || error.message);
        process.exit(1);
    }

    // Configure Axios defaults
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    try {
        // 1. Create a Project via API (to get localPath)
        const projectName = `TestPersistence_${Date.now()}`;
        const timestamp = new Date().toISOString();

        console.log(`\n1. Creating Project: ${projectName}`);

        // Call Create first
        const createRes = await axios.post(`${API_URL}/projects/create`, {
            name: projectName,
            type: 'grafcet'
        });

        if (!createRes.data.success) {
            throw new Error(`Failed to create project: ${createRes.data.error}`);
        }

        // The created project has the localPath assigned by backend
        let project = createRes.data.project;
        console.log('✅ Project created successfully. Path:', project.localPath);

        // 2. Add Elements and Simulation Data
        console.log('\n2. Adding Data (Elements & Simulation)...');

        // Add a step
        project.diagrams.push({
            id: uuidv4(),
            name: 'MainDiagram',
            elements: [
                {
                    id: uuidv4(),
                    type: 'step',
                    stepType: 'initial',
                    number: 1,
                    position: { x: 100, y: 100 },
                    size: { width: 60, height: 60 },
                    label: '1',
                    selected: false
                }
            ],
            version: '1.0',
            createdAt: timestamp,
            updatedAt: timestamp
        });

        // Add simulation variable
        project.simulation = {
            variables: [
                {
                    id: uuidv4(),
                    name: 'TestVar_Motor',
                    type: 'boolean',
                    value: true
                }
            ],
            actions: []
        };

        // Save with the updated data
        const updateRes = await axios.post(`${API_URL}/projects/save`, {
            project: project,
            type: 'grafcet'
        });

        if (!updateRes.data.success) {
            throw new Error(`Failed to update project: ${updateRes.data.error}`);
        }
        console.log('✅ Project updated with data.');

        // 3. Simulate "Reload" (Clear local state and Load from Backend)
        console.log('\n3. Simulating "Reload" (fetching from backend)...');

        // Add delay to ensure filesystem consistency
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verify file exists via list is tricky due to pagination or directory structure, 
        // but let's try to load directly using the known path, which simulates 
        // selecting the file from "Open Recent" or valid file explorer.

        const loadRes = await axios.post(`${API_URL}/projects/load`, {
            projectPath: project.localPath // Use the path we got from create
        });

        if (!loadRes.data.success) {
            throw new Error(`Failed to load project: ${loadRes.data.error}`);
        }

        const loadedProject = loadRes.data.project;
        console.log('✅ Project loaded from backend.');

        // 4. Verify Data Integrity
        console.log('\n4. Verifying Data...');

        // Check elements
        if (loadedProject.diagrams.length < 1) {
            throw new Error(`Expected at least 1 diagram, found ${loadedProject.diagrams.length}`);
        }
        // Diagrams might be loaded differently (list of diagrams), but for single file grafcet it should show up.
        // FileSystemService.loadProject puts diagrams in project.diagrams.

        let foundElement = false;
        // Check all diagrams for our element
        for (const d of loadedProject.diagrams) {
            if (d.elements.some((e: any) => e.label === '1')) {
                foundElement = true;
                break;
            }
        }

        if (!foundElement) {
            console.log('Diagrams:', JSON.stringify(loadedProject.diagrams, null, 2));
            throw new Error('Expected element with label "1" not found.');
        }
        console.log('✅ Elements verified.');

        // Check simulation data
        if (!loadedProject.simulation) {
            throw new Error('Simulation data missing from loaded project!');
        }
        if (loadedProject.simulation.variables.length !== 1) {
            throw new Error(`Expected 1 simulation variable, found ${loadedProject.simulation.variables.length}`);
        }
        if (loadedProject.simulation.variables[0].name !== 'TestVar_Motor') {
            throw new Error(`Expected variable 'TestVar_Motor', found '${loadedProject.simulation.variables[0].name}'`);
        }
        console.log('✅ Simulation data verified.');

        console.log('\n🎉 SUCCESS: Storage persistence (Flydrive) and Reload simulation passed!');

    } catch (error: any) {
        console.error('\n❌ VERIFICATION FAILED:', error.response?.data || error.message);
        process.exit(1);
    }
}

runVerification();
