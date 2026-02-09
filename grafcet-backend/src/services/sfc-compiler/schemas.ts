
import { z } from 'zod';

export const ActionSchema = z.object({
    type: z.enum(['normal', 'temporal']),
    content: z.string().optional(),
    qualifier: z.string().optional(),
});

export const StepSchema = z.object({
    type: z.literal('step'),
    id: z.string().uuid().optional(),
    name: z.string(),
    stepType: z.enum(['initial', 'normal', 'task', 'macro']).default('normal'),
    actions: z.array(ActionSchema).optional()
});

export const TransitionSchema = z.object({
    type: z.literal('transition'),
    id: z.string().uuid().optional(),
    condition: z.string(),
    number: z.number().optional()
});

export const JumpSchema = z.object({
    type: z.literal('jump'),
    target: z.string() // Target step number or name
});

// Forward declaration for recursion
export type ElementInput =
    z.infer<typeof StepSchema> |
    z.infer<typeof TransitionSchema> |
    z.infer<typeof JumpSchema> |
    { type: 'divergence'; divergenceType: 'AND' | 'OR'; branches: ElementInput[][] };

export const DivergenceSchema: z.ZodType<any> = z.object({
    type: z.literal('divergence'),
    id: z.string().uuid().optional(),
    divergenceType: z.enum(['AND', 'OR']),
    branches: z.array(z.array(z.lazy(() => ElementInputSchema)))
});

export const ElementInputSchema = z.union([
    StepSchema,
    TransitionSchema,
    JumpSchema,
    DivergenceSchema
]);

export const CompilerInputSchema = z.object({
    sequence: z.array(ElementInputSchema)
});

export type StepInput = z.infer<typeof StepSchema>;
export type TransitionInput = z.infer<typeof TransitionSchema>;
export type JumpInput = z.infer<typeof JumpSchema>;
export type DivergenceInput = z.infer<typeof DivergenceSchema>;
export type CompilerInput = z.infer<typeof CompilerInputSchema>;
