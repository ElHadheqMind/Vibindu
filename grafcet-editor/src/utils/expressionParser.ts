export type TokenType = 'variable' | 'operator' | 'paren' | 'function' | 'timer' | 'comparison' | 'unknown';

export interface Token {
    id: string;
    type: TokenType;
    value: string;
    inverted?: boolean; // For NOT (overbar)
}

// Regex patterns
const TOKEN_PATTERNS = [
    { type: 'function', regex: /^(RE|FE)\b/ },
    { type: 'timer', regex: /^X\d+\.t\s*(>=|<=|>|<|=|!=)\s*(\d+(\.\d+)?[a-zA-Z]*)/ }, // Timer: X1.t > 5s
    { type: 'comparison', regex: /^([a-zA-Z_]\w*)\s*(>=|<=|>|<|=|!=)\s*(\d+(\.\d+)?|[a-zA-Z_]\w*)/ }, // Comparison: Level > 50 or A > B
    { type: 'operator', regex: /^(\.|and|or|\+|not|!)/i },
    { type: 'paren', regex: /^(\(|\))/ },
    { type: 'variable', regex: /^[a-zA-Z_]\w*/ }, // Standard variable
];

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const parseExpression = (expression: string): Token[] => {
    let remaining = expression.trim();
    const tokens: Token[] = [];

    while (remaining.length > 0) {
        remaining = remaining.trim();
        let matchFound = false;

        // Check for specific NOT prefixes that should be attached to the next variable
        // This handles explicit "NOT A" or "!A" converting to inverted A token
        const notMatch = remaining.match(/^(not\s+|!)/i);
        let pendingInversion = false;

        if (notMatch) {
            pendingInversion = true;
            remaining = remaining.slice(notMatch[0].length).trim();
        }

        for (const pattern of TOKEN_PATTERNS) {
            const match = remaining.match(pattern.regex);
            if (match) {
                let value = match[0];
                let type = pattern.type as TokenType;

                // Normalize operators
                if (type === 'operator') {
                    const lowerVal = value.toLowerCase();
                    if (lowerVal === 'and') value = '.';
                    else if (lowerVal === 'or') value = '+';
                    else if (lowerVal === 'not' || lowerVal === '!') {
                        // Found a standalone operator that wasn't consumed by the check above
                        // In this case, we just treat it as an operator if it's not followed by a variable immediately (which would be weird logic but safest to preserve)
                        // OR, if we are in "text editing" mode, maybe needed?
                        // For now let's normalize to !
                        value = '!';
                    }
                }

                // If we had a pending inversion and we found a variable, mark it
                const inverted = pendingInversion && type === 'variable';
                // If we had pending inversion but found something else (like an operator or function), 
                // we technically should probably add a separate NOT token or handle it. 
                // For simplified SFC, let's attach inversion only to variables for now.
                // Or if it's a function like RE/FE? Usually those return bools, so !RE() is valid.

                tokens.push({
                    id: generateId(),
                    type,
                    value,
                    inverted: inverted || undefined
                });

                remaining = remaining.slice(match[0].length);
                matchFound = true;
                break;
            }
        }

        if (!matchFound) {
            // Consume one character as unknown to prevent infinite loop
            if (remaining.length > 0) {
                // Check if it's a "NOT" symbol '!' handled separately? 
                // Actually the regex above handles !. 
                // So this is for characters we don't recognize.
                const char = remaining[0];
                tokens.push({
                    id: generateId(),
                    type: 'unknown',
                    value: char
                });
                remaining = remaining.slice(1);
            }
        }
    }

    return tokens;
};

export const tokensToString = (tokens: Token[]): string => {
    return tokens.map(t => {
        let val = t.value;
        if (t.type === 'variable' && t.inverted) {
            // For string representation, we can export as "!A" or just "A" if we rely on metadata.
            // But to save to the backend string format, we likely want "NOT A" or "!A".
            // However, the prompt asked for SFC syntax: . for AND, + for OR.
            // NOT is usually ! or / or overbar visually.
            // Let's us standardized "!Variable" for the storage string, and render differently.
            return `!${val}`;
        }
        return val;
    }).join(' ');
};

// Formatting for display (e.g. replacing !A with A and flag)
// This is handled in the component rendering.
