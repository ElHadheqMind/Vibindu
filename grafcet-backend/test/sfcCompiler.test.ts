
import { sfcCompiler } from '../src/services/sfcCompiler';

describe('SFC Compiler', () => {

    it('should compile a simple sequence', () => {
        const dsl = `
        SFC "Simple"
        Step 1 "Start"
        Transition T1 "Go"
        Step 2 "End"
        `;

        const { generatedSFC, conductSFC } = sfcCompiler.compile(dsl);

        expect(generatedSFC.name).toBe("Simple");
        expect(generatedSFC.elements.length).toBe(3); // Step 1, T1, Step 2

        const step1 = generatedSFC.elements.find(e => e.type === 'step' && (e as any).number === 1);
        const step2 = generatedSFC.elements.find(e => e.type === 'step' && (e as any).number === 2);
        const trans1 = generatedSFC.elements.find(e => e.type === 'transition');

        expect(step1).toBeDefined();
        expect(step2).toBeDefined();
        expect(trans1).toBeDefined();

        const conn1 = generatedSFC.elements.find(e => e.type === 'connection' && (e as any).sourceId === step1!.id);
        expect(conn1).toBeDefined();
        expect((conn1 as any).targetId).toBe(trans1!.id);

        expect(conductSFC.name).toBe("Simple - Conduct");
        expect(conductSFC.elements.length).toBe(3);
    });

    it('should compile a divergence and convergence', () => {
        const dsl = `
        SFC "Div"
        Step 1 "Init"
        Divergence AND
            Branch
                Step 2 "B1"
            EndBranch
            Branch
                Step 3 "B2"
            EndBranch
        EndDivergence
        Converge AND
        Step 4 "Final"
        `;

        const { generatedSFC, conductSFC } = sfcCompiler.compile(dsl);
        const steps = generatedSFC.elements.filter(e => e.type === 'step');
        expect(steps.length).toBe(4);

        const gates = generatedSFC.elements.filter(e => e.type === 'and-gate');
        expect(gates.length).toBe(2); // Div and Conv

        expect(conductSFC.elements.filter(e => e.type === 'step').length).toBe(4);
    });

    it('should handle action blocks', () => {
        const dsl = `
        SFC "Actions"
        Step 1 "S1"
            Action "A1"
            Action "A2" (Type=Temporal)
        `;

        const { generatedSFC, conductSFC } = sfcCompiler.compile(dsl);
        const actions = generatedSFC.elements.filter(e => e.type === 'action-block');
        expect(actions.length).toBe(2);

        const a2 = actions.find(a => (a as any).actionType === 'temporal');
        expect(a2).toBeDefined();

        expect(conductSFC.elements.filter(e => e.type === 'action-block').length).toBe(2);
    });

    it('should resolve jumps', () => {
        const dsl = `
        SFC "Jump"
        Step 1 "S1"
        Transition T1 "T1"
        Jump 1
        `;

        const { generatedSFC, conductSFC } = sfcCompiler.compile(dsl);
        sfcCompiler.resolveJumps();

        // Find jump connection
        // Source should be T1, Target should be S1
        const trans = generatedSFC.elements.find(e => e.type === 'transition');
        const step = generatedSFC.elements.find(e => e.type === 'step');

        const jumpConn = generatedSFC.elements.find(e =>
            e.type === 'connection' &&
            (e as any).sourceId === trans!.id &&
            (e as any).targetId === step!.id
        );

        expect(jumpConn).toBeDefined();

        // Verify conduct SFC also has the jump
        const conductJumpConn = conductSFC.elements.find(e => e.type === 'connection' && (e as any).targetId);
        expect(conductJumpConn).toBeDefined();
    });
});
