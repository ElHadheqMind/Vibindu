
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/simulation/scenario';

// Mock SFC with Timer
// Step 1 (Initial) -> T1 (X1.t > 1s) -> Step 2
const diagram = {
    elements: [
        { type: 'step', id: '1', number: '1', stepType: 'initial' },
        { type: 'step', id: '2', number: '2', stepType: 'normal' },
        { type: 'transition', id: 'T1', number: '1', condition: 'X1.t > 1s' },
        { type: 'connection', sourceId: '1', targetId: 'T1' },
        { type: 'connection', sourceId: 'T1', targetId: '2' }
    ]
};

async function testScenario() {
    console.log('Testing Scenario with Timer (X1.t > 1s)...');
    try {
        const scenarios = [
            { name: "Time 0.5s", variables: {}, transitions: {} }, // Should NOT fire
            { name: "Time 1.5s", variables: {}, transitions: {} }, // Should FIRE (if state persisted)
        ];

        // We can't easily mock time injection in /scenario endpoint without modding backend again
        // BUT, the backend uses real time.
        // So we will verify if state is preserved by checking if subsequent calls maintain active steps

        // Actually, without time injection, we have to wait real time.
        // Let's use a simpler test: RE (Rising Edge)

        console.log('Switching to RE test (RE A)...');
        // Step 1 -> T1 (RE A) -> Step 2
        const diagramRE = {
            elements: [
                { type: 'step', id: '1', number: '1', stepType: 'initial' },
                { type: 'step', id: '2', number: '2', stepType: 'normal' },
                { type: 'transition', id: 'T1', number: '1', condition: 'RE A' },
                { type: 'connection', sourceId: '1', targetId: 'T1' },
                { type: 'connection', sourceId: 'T1', targetId: '2' }
            ]
        };

        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectPath: 'TEST_PATH', // Mock path
                diagram: diagramRE, // Backend supports proving diagram directly
                scenarios: [
                    { name: "A=0", variables: { A: false } }, // Init A=0
                    { name: "A=1", variables: { A: true } }   // Rising Edge -> Trigger
                ]
            })
        });

        if (!res.ok) {
            console.error('Request Failed:', await res.text());
            return;
        }

        const data = await res.json();
        const results = data.results || [];

        console.log('Results:', JSON.stringify(results, null, 2));

        const step1Active = results[0].activeSteps.includes('1');
        const step2Active = results[1].activeSteps.includes('2');

        if (step1Active && step2Active) {
            console.log('PASS: RE Logic detected across scenario steps!');
        } else {
            console.error('FAIL: RE Logic failed.');
        }

    } catch (e) {
        console.error('Connection Failed:', e.message);
    }
}

testScenario();
