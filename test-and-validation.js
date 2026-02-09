const fs = require('fs');

// Test script to verify AND divergence validation
const testInvalidAND = `SFC "Test Example 1: Invalid AND Divergence"
Step 0 (Initial)
Transition T0
Divergence AND
    Branch
        Step 1
        Transition T2
    EndBranch
    Branch
        Step 2
        Transition T3
    EndBranch
EndDivergence
Step 3`;

const testValidAND = `SFC "Test Example 1: Valid AND Divergence"
Step 0 (Initial)
Transition T0
Divergence AND
    Branch
        Step 1
    EndBranch
    Branch
        Step 2
    EndBranch
EndDivergence
Transition T1
Step 3`;

const output = [];
const log = (msg) => {
    console.log(msg);
    output.push(msg);
};

async function testCompilation(code, testName) {
    log(`\n${'='.repeat(60)}`);
    log(`Testing: ${testName}`);
    log('='.repeat(60));

    try {
        const response = await fetch('http://localhost:3001/api/sfc/compile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, title: testName })
        });

        const result = await response.json();

        if (result.success) {
            log('✅ Compilation SUCCEEDED');
            log('Generated SFC: ' + result.generatedSFC?.name);
        } else {
            log('❌ Compilation FAILED (as expected for invalid input)');
            log('Error: ' + result.error);
            if (result.details) {
                log('\nValidation Errors:');
                if (Array.isArray(result.details)) {
                    result.details.forEach(err => {
                        log(`  - ${err.type.toUpperCase()}: ${err.message}`);
                        if (err.element) log(`    Location: ${err.element}`);
                    });
                } else {
                    log(result.details);
                }
            }
        }
    } catch (error) {
        log('❌ Request failed: ' + error.message);
    }
}

async function runTests() {
    log('Starting AND Divergence Validation Tests...\n');

    // Test 1: Invalid AND (branches end with transitions)
    await testCompilation(testInvalidAND, 'Invalid AND Divergence');

    // Test 2: Valid AND (branches end with steps)
    await testCompilation(testValidAND, 'Valid AND Divergence');

    log('\n' + '='.repeat(60));
    log('Tests completed!');
    log('='.repeat(60));

    // Write to file
    fs.writeFileSync('test-results.txt', output.join('\n'));
    console.log('\n✅ Results written to test-results.txt');
}

runTests();
