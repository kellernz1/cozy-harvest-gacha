import { useState } from 'react';
import { GameProvider } from '../game/state';
import HUD from '../components/HUD';
import FarmGrid from '../components/FarmGrid';
import Inventory from '../components/Inventory';
import Shop from '../components/Shop';

type Tab = 'farm' | 'inventory' | 'shop';

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: 'farm', label: 'Farm', emoji: '🌾' },
  { key: 'inventory', label: 'Inventory', emoji: '🎒' },
  { key: 'shop', label: 'Shop', emoji: '🛒' },
];

export default function Index() {
  return (
    <GameProvider>
      <GameUI />
    </GameProvider>
  );
}

function GameUI() {
  const [activeTab, setActiveTab] = useState<Tab>('farm');

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      <HUD />

      {/* Tab navigation */}
      <div className="flex border-b-2 border-border bg-card">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-center font-body text-lg transition-all relative
              ${activeTab === tab.key
                ? 'text-accent'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <span className="mr-1">{tab.emoji}</span>
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'farm' && <FarmGrid />}
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'shop' && <Shop />}
      </div>
    </div>
  );
}
