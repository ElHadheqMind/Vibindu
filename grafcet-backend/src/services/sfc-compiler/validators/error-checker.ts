
import { CompilerInput, ElementInput, DivergenceInput } from '../schemas.js';

export interface ValidationError {
    type: 'error' | 'warning';
    message: string;
    line?: number;
    element?: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

/**
 * Validates the entire SFC input for structural correctness
 */
export function validateSfcInput(input: CompilerInput): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate the sequence
    validateSequence(input.sequence, errors);

    return {
        isValid: errors.filter(e => e.type === 'error').length === 0,
        errors
    };
}

/**
 * Validates a sequence of elements
 */
function validateSequence(sequence: ElementInput[], errors: ValidationError[], context: string = 'main'): void {
    // First pass: validate sequence structure (transitions before/after divergences)
    validateSequenceStructure(sequence, errors, context);

    // Second pass: validate each divergence individually
    sequence.forEach((element, index) => {
        if (element.type === 'divergence') {
            validateDivergence(element as DivergenceInput, errors, context, index);
        }
    });
}

/**
 * Validates the sequence structure, checking for proper transition placement
 * around divergences
 */
function validateSequenceStructure(sequence: ElementInput[], errors: ValidationError[], context: string): void {
    for (let i = 0; i < sequence.length; i++) {
        const current = sequence[i];
        const previous = i > 0 ? sequence[i - 1] : null;
        const next = i < sequence.length - 1 ? sequence[i + 1] : null;

        if (current.type === 'divergence') {
            const divergence = current as DivergenceInput;

            if (divergence.divergenceType === 'AND') {
                // AND Divergence Rule: Must be preceded by a transition
                // (The compiler auto-adds the transition, but the INPUT should have one)
                if (previous && previous.type === 'step') {
                    errors.push({
                        type: 'error',
                        message: `AND divergence at position ${i} must be preceded by a transition. Found 'step' instead. Add a transition before the AND divergence.`,
                        element: `${context}[${i}]`
                    });
                }

                // Note: Transition after AND convergence is auto-created by compiler,
                // so we don't validate the sequence AFTER the divergence
            } else if (divergence.divergenceType === 'OR') {
                // OR Divergence Rule: Validated at branch level (see validateORDivergence)
                // No sequence-level requirements for OR divergence itself
            }
        }

        // Check for redundant auto-transitions: if user manually adds transition after AND divergence
        if (current.type === 'transition' && previous?.type === 'divergence') {
            const prevDivergence = previous as DivergenceInput;
            if (prevDivergence.divergenceType === 'AND') {
                errors.push({
                    type: 'warning',
                    message: `Transition at position ${i} after AND divergence is redundant. The compiler automatically adds transitions after AND convergence. Remove this transition.`,
                    element: `${context}[${i}]`
                });
            }
        }
    }
}

/**
 * Validates divergence structure and rules
 */
function validateDivergence(
    divergence: DivergenceInput,
    errors: ValidationError[],
    context: string,
    index: number
): void {
    if (divergence.divergenceType === 'AND') {
        validateANDDivergence(divergence, errors, context, index);
    } else if (divergence.divergenceType === 'OR') {
        validateORDivergence(divergence, errors, context, index);
    }

    // Recursively validate nested divergences in branches
    divergence.branches.forEach((branch: ElementInput[], branchIndex: number) => {
        validateSequence(branch, errors, `${context}.divergence[${index}].branch[${branchIndex}]`);
    });
}

/**
 * Validates AND divergence rules:
 * - Must be preceded by a transition (handled in sequence validation)
 * - Branches must NOT end with transitions (they should end with steps)
 * - Must be followed by a transition after convergence (automatically created)
 */
function validateANDDivergence(
    divergence: DivergenceInput,
    errors: ValidationError[],
    context: string,
    index: number
): void {
    if (!divergence.branches || divergence.branches.length < 2) {
        errors.push({
            type: 'error',
            message: `AND divergence must have at least 2 branches`,
            element: `${context}.divergence[${index}]`
        });
        return;
    }

    // Validate each branch
    divergence.branches.forEach((branch: ElementInput[], branchIndex: number) => {
        if (branch.length === 0) {
            errors.push({
                type: 'error',
                message: `AND divergence branch ${branchIndex + 1} is empty`,
                element: `${context}.divergence[${index}].branch[${branchIndex}]`
            });
            return;
        }

        // Check if branch starts with a step (AND divergence branches should start with steps)
        const firstElement = branch[0];
        if (firstElement.type !== 'step') {
            errors.push({
                type: 'error',
                message: `AND divergence branch ${branchIndex + 1} must start with a step, but starts with '${firstElement.type}'`,
                element: `${context}.divergence[${index}].branch[${branchIndex}]`
            });
        }

        // CRITICAL: Check if branch ends with a transition
        // AND divergence branches should NOT end with transitions before convergence
        const lastElement = branch[branch.length - 1];
        if (lastElement.type === 'transition') {
            errors.push({
                type: 'error',
                message: `AND divergence branch ${branchIndex + 1} must NOT end with a transition. Branches should end with steps. The transition after convergence is automatically added by the compiler.`,
                element: `${context}.divergence[${index}].branch[${branchIndex}]`
            });
        }

        // Ensure branch ends with a step
        if (lastElement.type !== 'step') {
            errors.push({
                type: 'error',
                message: `AND divergence branch ${branchIndex + 1} must end with a step, but ends with '${lastElement.type}'`,
                element: `${context}.divergence[${index}].branch[${branchIndex}]`
            });
        }
    });

    // Note: The transition before divergence gate is automatically handled by the compiler
    // when it encounters an AND divergence. The transition after convergence gate is also
    // automatically created by the divergence-builder.
}

/**
 * Validates OR divergence rules:
 * - Each branch must START with a transition
 * - Each branch must END with a transition
 */
function validateORDivergence(
    divergence: DivergenceInput,
    errors: ValidationError[],
    context: string,
    index: number
): void {
    if (!divergence.branches || divergence.branches.length < 2) {
        errors.push({
            type: 'error',
            message: `OR divergence must have at least 2 branches`,
            element: `${context}.divergence[${index}]`
        });
        return;
    }

    // Validate each branch
    divergence.branches.forEach((branch: ElementInput[], branchIndex: number) => {
        if (branch.length === 0) {
            errors.push({
                type: 'error',
                message: `OR divergence branch ${branchIndex + 1} is empty`,
                element: `${context}.divergence[${index}].branch[${branchIndex}]`
            });
            return;
        }

        // Check if branch starts with a transition
        const firstElement = branch[0];
        if (firstElement.type !== 'transition') {
            errors.push({
                type: 'error',
                message: `OR divergence branch ${branchIndex + 1} must start with a transition, but starts with '${firstElement.type}'`,
                element: `${context}.divergence[${index}].branch[${branchIndex}]`
            });
        }

        // Check if branch ends with a transition
        const lastElement = branch[branch.length - 1];
        if (lastElement.type !== 'transition') {
            errors.push({
                type: 'error',
                message: `OR divergence branch ${branchIndex + 1} must end with a transition, but ends with '${lastElement.type}'`,
                element: `${context}.divergence[${index}].branch[${branchIndex}]`
            });
        }
    });
}

/**
 * Formats validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
    if (errors.length === 0) {
        return 'No validation errors';
    }

    return errors.map(error => {
        const prefix = error.type === 'error' ? '❌ ERROR' : '⚠️ WARNING';
        const location = error.element ? ` [${error.element}]` : '';
        return `${prefix}${location}: ${error.message}`;
    }).join('\n');
}
