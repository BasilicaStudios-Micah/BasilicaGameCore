import React from 'react';
import { Layout } from './components/shared/Layout';
import { LobbyPage } from './components/lobby/LobbyPage';
import { BoardBuilderPage } from './components/board/BoardBuilderPage';
import { CardsPage } from './components/cards/CardsPage';
import { DicePage } from './components/dice/DicePage';
import { ScriptPage } from './components/scripting/ScriptPage';
import { useUIStore } from './store';

export const App: React.FC = () => {
  const { activeTab } = useUIStore();

  const content = {
    lobby:  <LobbyPage />,
    board:  <BoardBuilderPage />,
    cards:  <CardsPage />,
    dice:   <DicePage />,
    script: <ScriptPage />,
  }[activeTab] ?? <LobbyPage />;

  return (
    <Layout>
      <div key={activeTab} style={{ flex: 1, overflow: 'hidden', animation: 'fadeIn 150ms ease' }}>
        {content}
      </div>
    </Layout>
  );
};
