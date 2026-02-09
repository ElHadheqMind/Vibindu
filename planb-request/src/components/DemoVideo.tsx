import styled from 'styled-components';

const VideoSection = styled.section`
  padding: 80px 5%;
  background-color: ${props => props.theme.surface};
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const SectionTitle = styled.h2`
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 40px;
  background: linear-gradient(135deg, ${props => props.theme.text} 30%, ${props => props.theme.primary});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const VideoWrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 1000px;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 40px ${props => props.theme.shadow};
  border: 1px solid ${props => props.theme.border}40;

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }
`;

const DemoVideo = () => {
  return (
    <VideoSection id="demo-video">
      <SectionTitle>Watch Demo Video</SectionTitle>
      <VideoWrapper>
        <iframe
          src="https://www.youtube.com/embed/lCipLa-1s-o"
          title="Demo Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </VideoWrapper>
    </VideoSection>
  );
};

export default DemoVideo;
