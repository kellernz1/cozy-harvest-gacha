import { useGame } from '../game/state';
import { SKILLS, type SkillId } from '../game/constants';
import { SFX } from '../game/sounds';
import { toast } from 'sonner';

export default function SkillTree() {
  const { state, dispatch } = useGame();

  const handleUnlock = (skillId: SkillId) => {
    SFX.buttonClick();
    const skill = SKILLS.find(s => s.id === skillId)!;
    const currentTier = state.skills[skillId];
    if (currentTier >= skill.tiers.length) return;
    const tier = skill.tiers[currentTier];
    if (state.skillPoints < tier.cost) {
      toast.error(`Need ${tier.cost} skill points!`);
      return;
    }
    dispatch({ type: 'UNLOCK_SKILL', skillId });
    toast.success(`${skill.name} upgraded to Tier ${currentTier + 1}! ${skill.emoji}`);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading text-xs text-accent">Skill Tree</h2>
        <div className="bg-secondary px-3 py-1 rounded border border-border">
          <span className="font-heading text-[10px] text-coin">⭐ {state.skillPoints} SP</span>
        </div>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        {SKILLS.map(skill => {
          const currentTier = state.skills[skill.id];
          return (
            <div key={skill.id} className="bg-card border-2 border-border rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{skill.emoji}</span>
                <div>
                  <h3 className="font-heading text-[10px] text-card-foreground">{skill.name}</h3>
                  <p className="text-xs text-muted-foreground">{skill.description}</p>
                </div>
              </div>

              {/* Tier nodes */}
              <div className="flex items-center gap-1 mt-3">
                {skill.tiers.map((tier, i) => {
                  const unlocked = currentTier > i;
                  const isNext = currentTier === i;
                  const affordable = state.skillPoints >= tier.cost;

                  return (
                    <div key={i} className="flex items-center">
                      {i > 0 && (
                        <div className={`w-4 h-0.5 ${unlocked ? 'bg-accent' : 'bg-border'}`} />
                      )}
                      <button
                        onClick={() => isNext && affordable && handleUnlock(skill.id)}
                        disabled={!isNext || !affordable}
                        className={`relative w-14 h-14 rounded border-2 flex flex-col items-center justify-center gap-0.5 transition-all
                          ${unlocked ? 'border-accent bg-accent/20' : isNext && affordable ? 'border-accent/60 bg-card hover:border-accent cursor-pointer' : 'border-border bg-muted cursor-not-allowed opacity-60'}
                        `}
                      >
                        <span className="text-[8px] font-heading text-card-foreground">{tier.label}</span>
                        {!unlocked && (
                          <span className="text-[7px] text-muted-foreground">{tier.cost} SP</span>
                        )}
                        {unlocked && (
                          <span className="text-xs text-accent">✓</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
