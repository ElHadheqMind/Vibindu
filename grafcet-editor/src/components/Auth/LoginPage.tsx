import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import {
  FiUser, FiLock, FiAlertCircle, FiCpu,
  FiLayers, FiZap, FiShield, FiMail, FiMapPin, FiPhone, FiGlobe,
  FiArrowRight, FiActivity, FiSearch, FiMonitor, FiX, FiCode, FiServer
} from 'react-icons/fi';
import { SiGooglecloud } from 'react-icons/si';
import GrafcetAnimation from './GrafcetAnimation';
import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../../store/useAuthStore';
import { useTheme } from '../../context/ThemeContext';

// --- Animations ---
const slideInLeft = keyframes`
  from { transform: translateX(-50px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const slideInRight = keyframes`
  from { transform: translateX(50px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

// --- Styled Components ---
const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  overflow-x: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const Navbar = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background-color: ${props => props.theme.background}ee;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 5%;
  z-index: 1000;
  border-bottom: 1px solid ${props => props.theme.border}40;
`;

const NavLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 800;
  color: ${props => props.theme.primary};
  cursor: pointer;

  img {
    height: 40px;
    mix-blend-mode: multiply;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 32px;

  @media (max-width: 968px) {
    display: none;
  }
`;

const NavLink = styled.a`
  text-decoration: none;
  color: ${props => props.theme.text};
  font-weight: 500;
  font-size: 15px;
  transition: color 0.2s;

  &:hover {
    color: ${props => props.theme.primary};
  }
`;

const LoginNavButton = styled.button`
  padding: 10px 24px;
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => props.theme.primary}40;
  }
`;

const HeroSection = styled.section`
  padding: 160px 5% 100px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 80vh;
  background: radial-gradient(circle at top right, ${props => props.theme.primary}05 0%, transparent 60%),
    radial-gradient(circle at bottom left, ${props => props.theme.accent}05 0%, transparent 60%);

  @media (max-width: 1024px) {
    flex-direction: column;
    text-align: center;
    padding-top: 120px;
  }
`;

const HeroContent = styled.div`
  flex: 1;
  max-width: 600px;
  animation: ${slideInLeft} 1s ease-out;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 6px 16px;
  background-color: ${props => props.theme.primary}10;
  color: ${props => props.theme.primary};
  border-radius: 50px;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 24px;
`;

const PoweredBy = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 32px;
  font-size: 15px;
  font-weight: 600;
  color: ${props => props.theme.textSecondary};

  svg {
    color: ${props => props.theme.primary};
    font-size: 18px;
  }
`;

const HeroTitle = styled.h1`
  font-size: clamp(40px, 5vw, 64px);
  line-height: 1.1;
  font-weight: 900;
  margin-bottom: 24px;
  background: linear-gradient(135deg, ${props => props.theme.text} 30%, ${props => props.theme.primary});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const HeroSubtitle = styled.p`
  font-size: 18px;
  color: ${props => props.theme.textSecondary};
  line-height: 1.6;
  margin-bottom: 40px;
`;

const HeroVisual = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: ${slideInRight} 1s ease-out;
  position: relative;

  @media (max-width: 1024px) {
    margin-top: 60px;
    width: 100%;
  }
`;

const AnimationWrapper = styled.div`
  width: 100%;
  max-width: 500px;
  background: ${props => props.theme.surfaceRaised};
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 30px 60px ${props => props.theme.shadow};
  border: 1px solid ${props => props.theme.border}40;
  position: relative;
`;

const TechSection = styled.section`
  padding: 100px 5%;
  text-align: center;
  background-color: ${props => props.theme.surfaceAlt};
`;

const SectionTitle = styled.h2`
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 16px;
`;

const SectionSubtitle = styled.p`
  font-size: 18px;
  color: ${props => props.theme.textSecondary};
  max-width: 700px;
  margin: 0 auto 60px;
`;

const AIHighlight = styled.div`
  display: flex;
  background: linear-gradient(135deg, ${props => props.theme.primary}08, ${props => props.theme.accent}08);
  border-radius: 32px;
  padding: 60px;
  align-items: center;
  gap: 60px;
  text-align: left;
  border: 1px solid ${props => props.theme.primary}20;

  @media (max-width: 968px) {
    flex-direction: column;
    padding: 30px;
  }
`;

const AIContent = styled.div`
  flex: 1;
`;

const AIChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: white;
  border-radius: 100px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
  font-weight: 700;
  
  svg {
    color: #4285f4;
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 50px;
`;

const FeatureCard = styled.div`
  background: ${props => props.theme.surface};
  padding: 40px;
  border-radius: 20px;
  border: 1px solid ${props => props.theme.border}40;
  transition: all 0.3s;
  text-align: left;

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px ${props => props.theme.shadow}40;
    border-color: ${props => props.theme.primary}40;
  }
`;

const FeatureIcon = styled.div`
  width: 60px;
  height: 60px;
  background: ${props => props.theme.primary}10;
  color: ${props => props.theme.primary};
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 24px;
`;

const DSLCodeBlock = styled.div`
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 24px;
  border-radius: 16px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.5;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  text-align: left;
  border: 1px solid rgba(255,255,255,0.1);
  position: relative;
  overflow: hidden;

  &::before {
    content: 'SFC DSL';
    position: absolute;
    top: 0;
    right: 0;
    padding: 4px 12px;
    background: ${props => props.theme.primary};
    color: white;
    font-size: 10px;
    font-weight: 800;
    border-bottom-left-radius: 8px;
  }

  .keyword { color: #569cd6; }
  .string { color: #ce9178; }
  .comment { color: #6a9955; }
  .function { color: #dcdcaa; }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
`;

const ModalContent = styled.div`
  width: 100%;
  max-width: 480px;
  background-color: ${props => props.theme.surface};
  border-radius: 28px;
  position: relative;
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5);
  border: 1px solid ${props => props.theme.border}40;
  animation: ${slideInRight} 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
`;

const ModalCloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${props => props.theme.background};
  border: 1px solid ${props => props.theme.border}40;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  color: ${props => props.theme.text};
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme.primary}10;
    color: ${props => props.theme.primary};
    transform: rotate(90deg);
  }
`;

const LoginForm = styled.form`
  width: 100%;
  padding: 40px;
`;

const FormTitle = styled.h3`
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 12px;
  text-align: center;
`;

const FormSubtitle = styled.p`
  color: ${props => props.theme.textSecondary};
  text-align: center;
  margin-bottom: 32px;
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
`;

const InputWrapper = styled.div`
  position: relative;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.primary};
  font-size: 18px;
  opacity: 0.7;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 16px 14px 48px;
  border: 1.5px solid ${props => props.theme.border};
  border-radius: 12px;
  font-size: 16px;
  background: ${props => props.theme.background};
  color: #000;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
    box-shadow: 0 0 0 4px ${props => props.theme.primary}15;
  }
`;

const PrimaryButton = styled.button`
  width: 100%;
  padding: 16px;
  background: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;

  &:hover {
    background: ${props => props.theme.primaryDark};
    transform: translateY(-2px);
    box-shadow: 0 10px 20px ${props => props.theme.primary}30;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const GoogleButtonWrapper = styled.div`
  justify-content: center;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 24px 0;
  color: ${props => props.theme.textTertiary};
  font-size: 14px;

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${props => props.theme.border};
  }

  span {
    padding: 0 16px;
  }
`;

const ContactSection = styled.section`
  padding: 100px 5%;
  background: ${props => props.theme.background};
`;

const ContactGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  max-width: 1100px;
  margin: 0 auto;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const ContactInfo = styled.div``;

const ContactItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 30px;

  div.icon {
    width: 48px;
    height: 48px;
    background: ${props => props.theme.primary}10;
    color: ${props => props.theme.primary};
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }

  h4 {
    margin: 0 0 4px 0;
    font-size: 18px;
  }

  p {
    color: ${props => props.theme.textSecondary};
    margin: 0;
  }
`;

const Footer = styled.footer`
  padding: 60px 5% 30px;
  background: ${props => props.theme.surfaceAlt};
  border-top: 1px solid ${props => props.theme.border}40;
`;

const FooterMain = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 60px;
  flex-wrap: wrap;
  gap: 40px;
`;

const FooterBrand = styled.div`
  max-width: 300px;
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 80px;

  @media (max-width: 600px) {
    gap: 40px;
  }
`;

const FooterCol = styled.div`
  h5 {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 24px;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    margin-bottom: 12px;
  }

  a {
    text-decoration: none;
    color: ${props => props.theme.textSecondary};
    transition: color 0.2s;

    &:hover {
      color: ${props => props.theme.primary};
    }
  }
`;

const Copyright = styled.div`
  padding-top: 30px;
  border-top: 1px solid ${props => props.theme.border}40;
  text-align: center;
  font-size: 14px;
  color: ${props => props.theme.textTertiary};

  a {
    color: ${props => props.theme.primary};
    font-weight: 600;
    text-decoration: none;
  }
`;

const ErrorMessage = styled.div`
  padding: 12px;
  background: ${props => props.theme.error}10;
  color: ${props => props.theme.error};
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

// --- Component ---
const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { login, register, googleLogin, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/welcome');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [username, password, email, name, error, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      await register(email, password, name, username);
    } else {
      await login(username, password);
    }
  };

  const openLoginModal = () => setShowLoginModal(true);
  const closeLoginModal = () => {
    setShowLoginModal(false);
    if (error) clearError();
  };


  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMsg) return;

    setIsSending(true);
    try {
      const response = await fetch('http://localhost:3001/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          message: contactMsg
        }),
      });

      if (response.ok) {
        setSendSuccess(true);
        setContactName('');
        setContactEmail('');
        setContactMsg('');
        setTimeout(() => setSendSuccess(false), 5000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <PageContainer>
      <Navbar>
        <NavLogo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/logo.png" alt="VibIndu Logo" />
        </NavLogo>
        <NavLinks>
          <NavLink onClick={() => openLoginModal()} style={{ cursor: 'pointer' }}>Login</NavLink>
          <NavLink href="#features">Features</NavLink>
          <NavLink href="#gemini">Gemini 3</NavLink>
          <NavLink href="#contact">Contact</NavLink>
        </NavLinks>
        <LoginNavButton onClick={openLoginModal}>Get Started</LoginNavButton>
      </Navbar>

      <HeroSection>
        <HeroContent>
          <Badge>Vibe Coding Revolution</Badge>
          <HeroTitle>Industrial Automation Meets Vibe Coding</HeroTitle>
          <HeroSubtitle>
            The world's first platform dedicated to industrial automation that lets you
            <strong> draw, generate, and orchestrate SFC & GSRSM </strong> using only your intent.
            Experience the future of engineering.
          </HeroSubtitle>
          <PoweredBy>
            <SiGooglecloud /> Powered by Gemini 3
          </PoweredBy>
          <PrimaryButton style={{ width: 'auto', padding: '18px 36px', fontSize: '18px' }} onClick={openLoginModal}>
            Start Building Now <FiArrowRight />
          </PrimaryButton>
        </HeroContent>
        <HeroVisual>
          <AnimationWrapper>
            <GrafcetAnimation />
          </AnimationWrapper>
        </HeroVisual>
      </HeroSection>

      <TechSection id="gemini">
        <SectionTitle>Next-Gen Multimodal Intelligence</SectionTitle>
        <SectionSubtitle>
          We leverage the world's most advanced AI models to transform industrial intent into reality.
        </SectionSubtitle>

        <AIHighlight>
          <AIContent>
            <AIChip>
              <SiGooglecloud size={20} /> Gemini 3 & Agentic Logic
            </AIChip>
            <h3>Industrial Reasoning Engine</h3>
            <p>
              Our system understands complex industrial specifications using Gemini 3's deep reasoning.
              Combined with our Agentic Orchestrator, we achieve:
            </p>
            <ul style={{ paddingLeft: '20px', color: '#666', lineHeight: '2' }}>
              <li>Natural language to SFC (Sequential Function Chart) generation.</li>
              <li>Automated GSRSM logic resolution and connection.</li>
              <li>Real-time industrial diagram optimization and safety checking.</li>
            </ul>
          </AIContent>
          <div style={{ flex: 0.8, display: 'flex', justifyContent: 'center' }}>
            <FiCpu size={200} style={{ color: '#1976d2', opacity: 0.1, position: 'absolute' }} />
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <FiActivity size={80} style={{ color: '#1976d2' }} />
              <div style={{ marginTop: '20px', fontWeight: 800, fontSize: '24px' }}>Logic Synthesis</div>
            </div>
          </div>
        </AIHighlight>

        <AIHighlight style={{ marginTop: '40px', background: `linear-gradient(135deg, ${theme.accent}08, ${theme.primary}08)` }}>
          <div style={{ flex: 0.8, display: 'flex', justifyContent: 'center' }}>
            <FiZap size={200} style={{ color: theme.accent, opacity: 0.1, position: 'absolute' }} />
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <FiGlobe size={80} style={{ color: theme.accent }} />
              <div style={{ marginTop: '20px', fontWeight: 800, fontSize: '24px' }}>System Rendering</div>
            </div>
          </div>
          <AIContent>
            <AIChip style={{ background: 'rgba(255, 152, 0, 0.1)', color: '#f57c00' }}>
              <FiZap size={18} /> Multimodal Generation
            </AIChip>
            <h3>Advanced Visual Synthesis</h3>
            <p>
              Experience the power of state-of-the-art rendering. We've integrated the latest models for unparalleled visual and system generation:
            </p>
            <ul style={{ paddingLeft: '20px', color: '#666', lineHeight: '2' }}>
              <li><strong>Veo 3:</strong> Cinematic-quality system walkthroughs and video generation.</li>
              <li><strong>Imagen 4:</strong> Photorealistic component rendering and UI generation.</li>
              <li><strong>Nano Banana 3:</strong> High-speed industrial asset synthesis and edge-optimized visuals.</li>
            </ul>
          </AIContent>
        </AIHighlight>

        <AIHighlight style={{ marginTop: '40px' }}>
          <AIContent>
            <AIChip style={{ background: 'rgba(76, 175, 80, 0.1)', color: '#2e7d32' }}>
              <FiCode size={18} /> Proprietary SFC Language
            </AIChip>
            <h3>SFC Domain-Specific Language</h3>
            <p>
              We've developed a custom SFC DSL that makes industrial logic design faster than ever.
              Write your automation intent in human-readable code and let our server handle the complexity.
            </p>
            <ul style={{ paddingLeft: '20px', color: '#666', lineHeight: '2' }}>
              <li><strong>Instant Compilation:</strong> Turn text into complex diagrams in milliseconds.</li>
              <li><strong>Dual-SFC Generation:</strong> Automatically generates both Design and Conduct versions.</li>
              <li><strong>Server-Side Orchestration:</strong> Dedicated high-performance server for logic synthesis.</li>
            </ul>
          </AIContent>
          <div style={{ flex: 1.2 }}>
            <DSLCodeBlock>
              <div className="comment">// Define your process in seconds</div>
              <div><span className="keyword">SFC</span> <span className="string">"Production_Line"</span></div>
              <br />
              <div><span className="keyword">Step</span> 0 (<span className="function">Initial</span>) <span className="string">"Power_ON"</span></div>
              <div><span className="keyword">Transition</span> Start</div>
              <br />
              <div><span className="keyword">Step</span> 1 <span className="string">"Initialize"</span></div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="keyword">Action</span> <span className="string">"System_Check"</span></div>
              <div><span className="keyword">Transition</span> Ready</div>
              <br />
              <div><span className="keyword">Jump</span> 0</div>
            </DSLCodeBlock>
            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', color: theme.textSecondary, fontSize: '14px' }}>
              <FiServer /> High-Performance Compiler Server Active
            </div>
          </div>
        </AIHighlight>
      </TechSection>

      <section id="features" style={{ padding: '100px 5%' }}>
        <div style={{ textAlign: 'center' }}>
          <SectionTitle>Professional Automation Tools</SectionTitle>
          <SectionSubtitle>Built for engineers who want to move at the speed of thought.</SectionSubtitle>
        </div>
        <FeaturesGrid>
          <FeatureCard>
            <FeatureIcon><FiLayers /></FeatureIcon>
            <h3>SFC Visual Editor</h3>
            <p>A drag-and-drop environment to build industrial logic with zero friction. Fully standards-compliant.</p>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon><FiZap /></FeatureIcon>
            <h3>Vibe Coding Engine</h3>
            <p>Tell the agent what you want to achieve, and watch as it builds the diagram for you in real-time.</p>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon><FiActivity /></FeatureIcon>
            <h3>GSRSM Generation</h3>
            <p>The first automated generator for GSRSM. Simply define your inputs/outputs and let the AI handle the rest.</p>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon><FiMonitor /></FeatureIcon>
            <h3>Simulation Studio</h3>
            <p>Test your logic before deployment. Interactive simulation with variable tracking and step execution.</p>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon><FiShield /></FeatureIcon>
            <h3>Industrial Grade</h3>
            <p>Built with robustness in mind. Export code ready for PLCs and industrial controllers.</p>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon><FiSearch /></FeatureIcon>
            <h3>Spec Analyst</h3>
            <p>Let AI analyze your project specifications and recommend the best control strategy.</p>
          </FeatureCard>
        </FeaturesGrid>
      </section>

      <ContactSection id="contact">
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <SectionTitle>Get in Touch</SectionTitle>
          <SectionSubtitle>Have questions about integration or custom solutions? Our team is here to help.</SectionSubtitle>
        </div>
        <ContactGrid>
          <ContactInfo>
            <ContactItem>
              <div className="icon"><FiMapPin /></div>
              <div>
                <h4>Global Headquarters</h4>
                <p>El Hadheq Mind</p>
              </div>
            </ContactItem>
            <ContactItem>
              <div className="icon"><FiPhone /></div>
              <div>
                <h4>Talk to an Engineer</h4>
                <p>+216 26706183</p>
              </div>
            </ContactItem>
            <ContactItem>
              <div className="icon"><FiGlobe /></div>
              <div>
                <h4>Online Presence</h4>
                <p>www.elhadheqmind.com</p>
              </div>
            </ContactItem>
          </ContactInfo>
          <div>
            <div style={{ background: '#f8f9fa', padding: '40px', borderRadius: '24px', border: '1px solid #eee' }}>
              <h3 style={{ marginBottom: '20px' }}>Send a Message</h3>
              <form onSubmit={handleContactSubmit}>
                <InputGroup>
                  <Input
                    type="text"
                    placeholder="Your Name"
                    style={{ background: 'white' }}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                  />
                </InputGroup>
                <InputGroup>
                  <Input
                    type="email"
                    placeholder="Your Email"
                    style={{ background: 'white' }}
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                  />
                </InputGroup>
                <InputGroup>
                  <textarea
                    placeholder="How can we help you?"
                    value={contactMsg}
                    onChange={(e) => setContactMsg(e.target.value)}
                    required
                    style={{
                      width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e0e0e0',
                      minHeight: '120px', fontSize: '16px', fontFamily: 'inherit', color: '#000'
                    }}
                  />
                </InputGroup>
                <PrimaryButton type="submit" disabled={isSending}>
                  {isSending ? 'Sending...' : 'Send Message'}
                </PrimaryButton>
                {sendSuccess && (
                  <div style={{ marginTop: '10px', color: '#2e7d32', fontSize: '14px', textAlign: 'center' }}>
                    Message sent successfully!
                  </div>
                )}
              </form>
            </div>
          </div>
        </ContactGrid>
      </ContactSection>

      <Footer>
        <FooterMain>
          <FooterBrand>
            <NavLogo style={{ marginBottom: '20px' }}>
              <img src="/logo.png" alt="Logo" />
            </NavLogo>
            <p style={{ color: '#777', lineHeight: '1.6' }}>
              Empowering industrial engineers with agentic AI and vibe coding.
              The future of automation is here.
            </p>
          </FooterBrand>
          <FooterLinks>
            <FooterCol>
              <h5>Platform</h5>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#gemini">Gemini 3</a></li>
                <li><a href="#">Simulation</a></li>
                <li><a href="#">Security</a></li>
              </ul>
            </FooterCol>
            <FooterCol>
              <h5>Company</h5>
              <ul>
                <li><a href="https://www.elhadheqmind.com/" target="_blank" rel="noopener noreferrer">El Hadheq Mind</a></li>
                <li><a href="https://www.elhadheqmind.com/" target="_blank" rel="noopener noreferrer">Antigravity</a></li>
                <li><a href="#">About Us</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </FooterCol>
          </FooterLinks>
        </FooterMain>
        <Copyright>
          &copy; {new Date().getFullYear()} El Hadheq Mind. Built with
          <a href="https://www.elhadheqmind.com/" target="_blank" rel="noopener noreferrer"> Antigravity</a>. All Rights Reserved.
        </Copyright>
      </Footer>

      {/* Login Modal */}
      {showLoginModal && (
        <ModalOverlay onClick={(e) => e.target === e.currentTarget && closeLoginModal()}>
          <ModalContent>
            <ModalCloseButton onClick={closeLoginModal}>
              <FiX size={20} />
            </ModalCloseButton>

            <LoginForm onSubmit={handleSubmit}>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <img src="/logo.png" alt="Logo" style={{ height: '60px', mixBlendMode: 'multiply' }} />
              </div>
              <FormTitle>{isRegistering ? 'Create Account' : 'Welcome to the Future'}</FormTitle>
              <FormSubtitle>
                {isRegistering ? 'Start your vibe coding journey today.' : 'Sign in to access your dashboard.'}
              </FormSubtitle>

              {error && (
                <ErrorMessage>
                  <FiAlertCircle /> {error}
                </ErrorMessage>
              )}

              {isRegistering && (
                <InputGroup>
                  <Label>Full Name</Label>
                  <InputWrapper>
                    <InputIcon><FiUser /></InputIcon>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </InputWrapper>
                </InputGroup>
              )}

              <InputGroup>
                <Label>{isRegistering ? 'Username' : 'Email or Username'}</Label>
                <InputWrapper>
                  <InputIcon><FiUser /></InputIcon>
                  <Input
                    type="text"
                    placeholder={isRegistering ? "choose_username" : "your@email.com"}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </InputWrapper>
              </InputGroup>

              {isRegistering && (
                <InputGroup>
                  <Label>Email</Label>
                  <InputWrapper>
                    <InputIcon><FiMail /></InputIcon>
                    <Input
                      type="email"
                      placeholder="john@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </InputWrapper>
                </InputGroup>
              )}

              <InputGroup>
                <Label>Password</Label>
                <InputWrapper>
                  <InputIcon><FiLock /></InputIcon>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </InputWrapper>
              </InputGroup>

              <PrimaryButton type="submit" disabled={isLoading}>
                {isLoading ? 'Processing...' : (isRegistering ? 'Register' : 'Sign In')}
              </PrimaryButton>

              <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
                {isRegistering ? 'Already have an account?' : "Don't have an account?"} {' '}
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setIsRegistering(!isRegistering); }}
                  style={{ color: '#1976d2', fontWeight: 700, textDecoration: 'none' }}
                >
                  {isRegistering ? 'Sign In' : 'Create Account'}
                </a>
              </div>

              {!isRegistering && (
                <>
                  <Divider><span>OR</span></Divider>
                  <GoogleButtonWrapper>
                    <GoogleLogin
                      onSuccess={credentialResponse => {
                        if (credentialResponse.credential) {
                          googleLogin(credentialResponse.credential);
                        }
                      }}
                      onError={() => console.log('Login Failed')}
                      useOneTap
                    />
                  </GoogleButtonWrapper>
                </>
              )}

            </LoginForm>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default LoginPage;
