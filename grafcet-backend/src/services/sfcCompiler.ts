
import { parseSfcDsl } from './sfc-compiler/dsl-parser.js';
import { compileSfc } from './sfc-compiler/core/compiler.js';

export class SfcCompiler {
    private lastCompilationResult: any = null;

    /**
     * Compile SFC DSL code into a GRAFCET Diagram
     * @param code The DSL code string
     * @param title Title of the diagram
     */
    compile(code: string, title: string) {
        try {
            // 1. Parse DSL into structured object
            const parserInput = parseSfcDsl(code);

            // 2. Run the modular compiler to generate elements and positions
            const generatedDiagram = compileSfc(parserInput);

            // Handle compilation failure from modular compiler
            if (generatedDiagram.success === false) {
                return {
                    success: false,
                    error: generatedDiagram.message || 'Compilation failed',
                    details: generatedDiagram.errors
                };
            }

            // 3. Prepare result expected by frontend
            // Frontend expects 'generatedSFC' and 'conductSFC' (can be same for now)
            generatedDiagram.name = title;

            // Prepare result expected by frontend
            const finalDiagram = {
                ...generatedDiagram,
                elements: generatedDiagram.elements, // Refactored compiler already includes connections in elements
                viewport: { x: 0, y: 0, zoom: 1 },
                updatedAt: new Date().toISOString()
            };

            const result = {
                success: true, // Mark outer wrapper as success
                generatedSFC: { ...finalDiagram, name: title + ' (Generated)' },
                conductSFC: { ...finalDiagram, name: title + ' (Conduct)' }
            };

            this.lastCompilationResult = result;
            return result;
        } catch (error) {
            console.error('Compiler failed:', error);
            return {
                success: false,
                error: 'Internal compiler error',
                details: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Post-process connection targets
     */
    resolveJumps() {
        // The newly refactored compiler handles connections internally during compileSfc.
        // It uses Step IDs directly. Jump resolution is mostly built-in now.
        if (!this.lastCompilationResult) return;
        console.log('SfcCompiler.resolveJumps: Standard loopback handled by core compiler.');
    }
}

export const sfcCompiler = new SfcCompiler();
