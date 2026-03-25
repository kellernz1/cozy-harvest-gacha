import { useState } from 'react';
import { GameProvider } from '../game/state';
import HUD from '../components/HUD';
import FarmGrid from '../components/FarmGrid';
import Inventory from '../components/Inventory';
import Shop from '../components/Shop';
import Reforge from '../components/Reforge';
import SkillTree from '../components/SkillTree';
import { SFX } from '../game/sounds';

type Tab = 'farm' | 'inventory' | 'shop' | 'reforge' | 'skills';

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: 'farm', label: 'Farm', emoji: '🌾' },
  { key: 'inventory', label: 'Items', emoji: '🎒' },
  { key: 'shop', label: 'Shop', emoji: '🛒' },
  { key: 'reforge', label: 'Reforge', emoji: '⚗️' },
  { key: 'skills', label: 'Skills', emoji: '⭐' },
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

  const switchTab = (tab: Tab) => {
    SFX.tabSwitch();
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      <HUD />

      {/* Tab navigation */}
      <div className="flex border-b-2 border-border bg-card">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            className={`flex-1 py-2 text-center font-body text-base transition-all relative
              ${activeTab === tab.key
                ? 'text-accent'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <span className="mr-0.5">{tab.emoji}</span>
            <span className="hidden sm:inline">{tab.label}</span>
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
        {activeTab === 'reforge' && <Reforge />}
        {activeTab === 'skills' && <SkillTree />}
      </div>
    </div>
  );
}
