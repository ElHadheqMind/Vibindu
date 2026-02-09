import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface StreamingTextProps {
  text: string;
  enabled?: boolean;
  wordsPerTick?: number;
  tickInterval?: number;
  components?: React.ComponentProps<typeof ReactMarkdown>['components'];
}

/**
 * Component that displays text with a word-by-word streaming effect.
 * Uses markdown rendering for the displayed text.
 * Each instance manages its own streaming state.
 */
export const StreamingText: React.FC<StreamingTextProps> = ({
  text,
  enabled = true,
  wordsPerTick = 4,
  tickInterval = 25,
  components
}) => {
  const [displayedText, setDisplayedText] = useState(enabled ? '' : text);
  const [isComplete, setIsComplete] = useState(!enabled);
  const wordIndexRef = useRef(0);
  const textRef = useRef(text);
  const mountedRef = useRef(true);

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Reset when text changes
  useEffect(() => {
    if (text !== textRef.current) {
      textRef.current = text;
      wordIndexRef.current = 0;
      if (enabled) {
        setDisplayedText('');
        setIsComplete(false);
      } else {
        setDisplayedText(text);
        setIsComplete(true);
      }
    }
  }, [text, enabled]);

  // Streaming effect
  useEffect(() => {
    if (!enabled || isComplete) return;

    const tokens = text.split(/(\s+)/);

    if (wordIndexRef.current >= tokens.length) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    const timer = setInterval(() => {
      if (!mountedRef.current) {
        clearInterval(timer);
        return;
      }

      wordIndexRef.current += wordsPerTick;

      if (wordIndexRef.current >= tokens.length) {
        setDisplayedText(text);
        setIsComplete(true);
        clearInterval(timer);
      } else {
        setDisplayedText(tokens.slice(0, wordIndexRef.current).join(''));
      }
    }, tickInterval);

    return () => clearInterval(timer);
  }, [text, enabled, isComplete, wordsPerTick, tickInterval]);

  return (
    <>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {displayedText}
      </ReactMarkdown>
      {!isComplete && (
        <span
          style={{
            display: 'inline-block',
            width: '6px',
            height: '14px',
            backgroundColor: '#1976d2',
            marginLeft: '2px',
            animation: 'blink 0.7s infinite',
            verticalAlign: 'text-bottom',
            borderRadius: '1px',
            opacity: 0.8
          }}
        />
      )}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 0.8; }
          51%, 100% { opacity: 0.2; }
        }
      `}</style>
    </>
  );
};

