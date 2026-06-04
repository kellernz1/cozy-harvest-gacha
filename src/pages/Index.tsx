import { useState } from 'react';
import { GameProvider } from '../game/state';
import HUD from '../components/HUD';
import FarmGrid from '../components/FarmGrid';
import Inventory from '../components/Inventory';
import Shop from '../components/Shop';
import Reforge from '../components/Reforge';
import SkillTree from '../components/SkillTree';
import Goals from '../components/Goals';
import { SFX } from '../game/sounds';

type Tab = 'farm' | 'inventory' | 'shop' | 'reforge' | 'skills' | 'goals';

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: 'farm', label: 'Farm', emoji: '🌾' },
  { key: 'inventory', label: 'Items', emoji: '🎒' },
  { key: 'shop', label: 'Shop', emoji: '🛒' },
  { key: 'reforge', label: 'Reforge', emoji: '⚗️' },
  { key: 'skills', label: 'Skills', emoji: '⭐' },
  { key: 'goals', label: 'Goals', emoji: '📜' },
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
    <div className="min-h-screen flex flex-col max-w-5xl mx-auto bg-background/80 shadow-2xl">
      <HUD />

      <div className="flex overflow-x-auto border-b border-border/60 bg-white/70 backdrop-blur-xl">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            className={`relative min-w-20 flex-1 py-3 text-center font-body text-sm font-medium transition-all group
              ${activeTab === tab.key
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <span className="text-xl mb-1 block group-hover:scale-110 transition-transform">{tab.emoji}</span>
            <span className="text-xs">{tab.label}</span>
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-4 right-4 h-1 bg-gradient-to-r from-primary to-accent rounded-t-full shadow-lg" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto backdrop-blur-sm bg-background/40">
        {activeTab === 'farm' && <FarmGrid />}
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'shop' && <Shop />}
        {activeTab === 'reforge' && <Reforge />}
        {activeTab === 'skills' && <SkillTree />}
        {activeTab === 'goals' && <Goals />}
      </div>
    </div>
  );
}
