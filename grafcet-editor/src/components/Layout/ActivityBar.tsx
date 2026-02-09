import React from 'react';
import styled from 'styled-components';
import {
    FiFolder,
    FiSearch,
    FiPackage,
    FiSettings,
    FiGitBranch
} from 'react-icons/fi';

const ActivityBarContainer = styled.div`
  width: 48px;
  min-width: 48px;
  height: 100%;
  background-color: ${props => props.theme.background};
  border-right: 1px solid ${props => props.theme.border};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 8px;
  z-index: 100;
`;

const ActivityIcon = styled.button<{ $active?: boolean }>`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: ${props => props.$active ? props.theme.text : props.theme.textSecondary};
  position: relative;
  transition: color 0.2s ease;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: ${props => props.$active ? props.theme.primary : 'transparent'};
    transition: background-color 0.2s ease;
  }

  &:hover {
    color: ${props => props.theme.text};
  }

  svg {
    font-size: 24px;
  }
`;

const Spacer = styled.div`
  flex: 1;
`;

const BottomSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 8px;
`;

export type ActivityTab = 'files' | 'search' | 'extensions' | 'git';

interface ActivityBarProps {
    activeTab: ActivityTab;
    onTabChange: (tab: ActivityTab) => void;
}

const ActivityBar: React.FC<ActivityBarProps> = ({ activeTab, onTabChange }) => {
    return (
        <ActivityBarContainer>
            <ActivityIcon
                $active={activeTab === 'files'}
                onClick={() => onTabChange('files')}
                title="Explorer"
            >
                <FiFolder />
            </ActivityIcon>

            <ActivityIcon
                $active={activeTab === 'search'}
                onClick={() => onTabChange('search')}
                title="Search"
            >
                <FiSearch />
            </ActivityIcon>

            <ActivityIcon
                $active={activeTab === 'git'}
                onClick={() => onTabChange('git')}
                title="Source Control"
            >
                <FiGitBranch />
            </ActivityIcon>

            <ActivityIcon
                $active={activeTab === 'extensions'}
                onClick={() => onTabChange('extensions')}
                title="Extensions"
            >
                <FiPackage />
            </ActivityIcon>

            <Spacer />

            <BottomSection>
                <ActivityIcon title="Settings">
                    <FiSettings />
                </ActivityIcon>
            </BottomSection>
        </ActivityBarContainer>
    );
};

export default ActivityBar;
