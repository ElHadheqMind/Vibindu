
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/simulation/step';

const diagram = {
    elements: [
        { type: 'step', id: '1', number: '1', stepType: 'initial' },
        { type: 'step', id: '2', number: '2', stepType: 'normal' },
        { type: 'transition', id: 'T1', number: '1', condition: 'A AND B' },
        { type: 'connection', sourceId: '1', targetId: 'T1' },
        { type: 'connection', sourceId: 'T1', targetId: '2' }
    ]
};

const state = {
    activeSteps: ['1'],
    variables: {},
    stepActivationTimes: { '1': Date.now() }
};

async function testLiveServer() {
    console.log('Testing running server with "A AND B"...');
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                diagram,
                state,
                inputs: { transitions: {}, variables: { A: true, B: true } }
            })
        });

        if (!res.ok) {
            console.error('Server Status:', res.status, res.statusText);
            const txt = await res.text();
            console.error('Response:', txt);
            return;
        }

        const data = await res.json();
        if (data.success && data.state.activeSteps.includes('2')) {
            console.log('PASS: Server logic is UP TO DATE.');
        } else {
            console.error('FAIL: Server logic is STALE or BROKEN.');
            console.log('Result State:', JSON.stringify(data.state, null, 2));
        }
    } catch (e) {
        console.error('Connection Failed:', e.message);
    }
}

testLiveServer();
