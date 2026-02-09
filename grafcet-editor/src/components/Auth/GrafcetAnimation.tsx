import React, { useEffect, useRef, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';

const Container = styled.div`
  width: 100%;
  height: 300px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow: hidden;
  position: relative;
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const flowAnimation = keyframes`
  0% { stroke-dashoffset: 1000; }
  100% { stroke-dashoffset: 0; }
`;

const activeStep = keyframes`
  0% { fill-opacity: 0.1; }
  50% { fill-opacity: 0.3; }
  100% { fill-opacity: 0.1; }
`;



const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const SVGContainer = styled.svg`
  width: 100%;
  height: 100%;
  animation: ${fadeIn} 1s ease-out;
`;

const BackgroundCircle = styled.circle<{ $delay: number }>`
  fill: ${props => props.theme.primaryLight}10;
  animation: ${pulse} 8s ease-in-out infinite ${props => props.$delay}s;
`;

const BackgroundPattern = styled.path`
  stroke: ${props => props.theme.primaryLight}20;
  stroke-width: 1;
  fill: none;
`;



const FloatingElement = styled.g<{ $delay: number; $duration: number }>`
  animation: ${props => css`${float} ${props.$duration}s ease-in-out infinite ${props.$delay}s`};
`;

const Step = styled.rect<{ $delay: number; $active?: boolean }>`
  stroke: ${props => props.theme.primary};
  stroke-width: 2;
  fill: ${props => props.theme.primary};
  fill-opacity: ${props => props.$active ? 0.2 : 0.1};
  animation: ${props => (props.$active ? css`${activeStep} 3s infinite ${props.$delay}s` : 'none')};
`;

const InitialStep = styled(Step)`
  stroke-width: 3;
`;

const Transition = styled.rect<{ $delay: number }>`
  stroke: ${props => props.theme.primary};
  stroke-width: 2;
  fill: ${props => props.theme.primary};
`;

const Connection = styled.path<{ $delay: number }>`
  stroke: ${props => props.theme.primary};
  stroke-width: 2;
  fill: none;
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: ${flowAnimation} 2s ease-out forwards ${props => props.$delay}s;
`;

const ActionBlock = styled.rect<{ $delay: number }>`
  stroke: ${props => props.theme.primary};
  stroke-width: 2;
  fill: ${props => props.theme.surface};
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: ${flowAnimation} 2s ease-out forwards ${props => props.$delay}s;
`;

const Label = styled.text`
  font-size: 12px;
  font-weight: 500;
  fill: ${props => props.theme.text};
  text-anchor: middle;
  dominant-baseline: middle;
`;

const ConditionText = styled.text<{ $delay: number }>`
  font-size: 10px;
  font-style: italic;
  fill: ${props => props.theme.primary};
  text-anchor: middle;
  dominant-baseline: middle;
  opacity: 0;
  animation: ${fadeIn} 1s ease-out forwards ${props => props.$delay}s;
`;

const ActionText = styled.text<{ $delay: number }>`
  font-size: 11px;
  fill: ${props => props.theme.text};
  text-anchor: middle;
  dominant-baseline: middle;
  opacity: 0;
  animation: ${fadeIn} 1s ease-out forwards ${props => props.$delay}s;
`;

const GrafcetAnimation: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [iteration, setIteration] = useState(0);

  // Restart animation every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setIteration(prev => prev + 1);
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Container ref={containerRef}>
      <SVGContainer viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" key={iteration}>
        {/* Background Elements */}
        <BackgroundCircle cx="300" cy="200" r="180" $delay={0} />

        {/* Background Pattern */}
        <BackgroundPattern d="M100,50 L500,50 L500,350 L100,350 Z" />

        {/* Main GRAFCET Diagram */}
        <g transform="translate(200, 20)">
          {/* Initial Step */}
          <FloatingElement $delay={0} $duration={4}>
            <InitialStep x="0" y="0" width="60" height="60" rx="4" $delay={0} $active={true} />
            <Step x="5" y="5" width="50" height="50" rx="2" $delay={0} />
            <Label x="30" y="30">Let's Go!</Label>
          </FloatingElement>

          {/* Connection to first transition */}
          <Connection
            d="M30 60 L30 90"
            $delay={0.5}
          />

          {/* First Transition */}
          <Transition x="10" y="90" width="40" height="10" rx="2" $delay={0.5} />
          <ConditionText x="30" y="85" $delay={0.7}>Time to create!</ConditionText>

          {/* Connection to second step */}
          <Connection
            d="M30 100 L30 130"
            $delay={1}
          />

          {/* Second Step */}
          <FloatingElement $delay={1} $duration={4.5}>
            <Step x="0" y="130" width="60" height="60" rx="4" $delay={1} $active={true} />
            <Label x="30" y="160">Magic!</Label>
          </FloatingElement>

          {/* Action Block for Second Step */}
          <Connection
            d="M60 160 L90 160"
            $delay={1.2}
          />
          <ActionBlock x="90" y="130" width="200" height="60" rx="4" $delay={1.2} />
          <ActionText x="190" y="160" $delay={1.5}>Create Awesome SFC Magic!</ActionText>

          {/* Connection to second transition */}
          <Connection
            d="M30 190 L30 220"
            $delay={2}
          />

          {/* Second Transition */}
          <Transition x="10" y="220" width="40" height="10" rx="2" $delay={2} />
          <ConditionText x="30" y="215" $delay={2.2}>Masterpiece complete!</ConditionText>

          {/* Connection to third step */}
          <Connection
            d="M30 230 L30 260"
            $delay={2.5}
          />

          {/* Third Step */}
          <FloatingElement $delay={2} $duration={5}>
            <Step x="0" y="260" width="60" height="60" rx="4" $delay={2.5} $active={true} />
            <Label x="30" y="290">Woohoo!</Label>
          </FloatingElement>

          {/* Connection back to Initial - vertical down, horizontal left, vertical up, horizontal right */}
          <Connection
            d="M30 320 L30 340 L-50 340 L-50 30 L0 30"
            $delay={3}
          />
        </g>
      </SVGContainer>
    </Container>
  );
};

export default GrafcetAnimation;
