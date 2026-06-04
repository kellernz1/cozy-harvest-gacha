import { useMemo } from 'react';
import { useGame } from '../game/state';
import {
  ACHIEVEMENTS,
  DAILY_GOALS,
  SEED_EMOJIS,
  SEED_TYPES,
  type AchievementDef,
  type DailyGoalDef,
} from '../game/constants';
import { toast } from 'sonner';
import { SFX } from '../game/sounds';

export default function Goals() {
  const { state } = useGame();

  const collected = useMemo(() => {
    const seen = new Set(state.inventory.map(seed => seed.type));
    state.plots.forEach(plot => {
      if (plot.seed) seen.add(plot.seed.type);
    });
    return seen;
  }, [state.inventory, state.plots]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg text-primary">Daily Goals</h2>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Resets tomorrow
          </span>
        </div>
        <div className="grid gap-3">
          {DAILY_GOALS.map(goal => (
            <DailyGoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-heading text-lg text-primary">Achievements</h2>
        <div className="grid gap-3">
          {ACHIEVEMENTS.map(achievement => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-heading text-lg text-primary">Fruit Collection</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SEED_TYPES.map(type => {
            const unlocked = collected.has(type);
            return (
              <div
                key={type}
                className={`rounded-xl border p-3 text-center shadow-sm transition-all ${
                  unlocked ? 'border-primary/30 bg-white/70' : 'border-dashed border-border bg-muted/40 opacity-70'
                }`}
              >
                <div className="text-3xl">{unlocked ? SEED_EMOJIS[type] : '?'}</div>
                <div className="mt-1 text-sm font-semibold">{type}</div>
                <div className="text-xs text-muted-foreground">{unlocked ? 'Collected' : 'Unknown'}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function DailyGoalCard({ goal }: { goal: DailyGoalDef }) {
  const { state, dispatch } = useGame();
  const progress = getDailyProgress(goal, state.daily);
  const complete = progress >= goal.target;
  const claimed = state.claimedDailyGoals.includes(goal.id);

  const claim = () => {
    if (!complete || claimed) return;
    SFX.levelUp();
    dispatch({ type: 'CLAIM_DAILY_GOAL', goalId: goal.id, reward: goal.reward });
    toast.success(`Daily goal claimed: +$${goal.reward}`);
  };

  return (
    <GoalCard
      title={goal.label}
      description={goal.description}
      progress={progress}
      target={goal.target}
      reward={goal.reward}
      complete={complete}
      claimed={claimed}
      onClaim={claim}
    />
  );
}

function AchievementCard({ achievement }: { achievement: AchievementDef }) {
  const { state, dispatch } = useGame();
  const progress = getAchievementProgress(achievement, state);
  const complete = progress >= achievement.target;
  const claimed = state.claimedAchievements.includes(achievement.id);

  const claim = () => {
    if (!complete || claimed) return;
    SFX.levelUp();
    dispatch({ type: 'CLAIM_ACHIEVEMENT', achievementId: achievement.id, reward: achievement.reward });
    toast.success(`Achievement claimed: +$${achievement.reward}`);
  };

  return (
    <GoalCard
      title={achievement.label}
      description={achievement.description}
      progress={progress}
      target={achievement.target}
      reward={achievement.reward}
      complete={complete}
      claimed={claimed}
      onClaim={claim}
    />
  );
}

function GoalCard({
  title,
  description,
  progress,
  target,
  reward,
  complete,
  claimed,
  onClaim,
}: {
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: number;
  complete: boolean;
  claimed: boolean;
  onClaim: () => void;
}) {
  const capped = Math.min(progress, target);
  const percent = Math.floor((capped / target) * 100);

  return (
    <div className="rounded-xl border border-border/70 bg-white/75 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <button
          onClick={onClaim}
          disabled={!complete || claimed}
          className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {claimed ? 'Claimed' : `+$${reward}`}
        </button>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-1 text-right text-xs text-muted-foreground">
        {capped}/{target}
      </div>
    </div>
  );
}

function getDailyProgress(goal: DailyGoalDef, daily: { incomeEarned: number; packsOpened: number; seedsPlanted: number; reforges: number }) {
  switch (goal.id) {
    case 'dailyPacks':
      return daily.packsOpened;
    case 'dailyPlanting':
      return daily.seedsPlanted;
    case 'dailyIncome':
      return daily.incomeEarned;
    case 'dailyReforge':
      return daily.reforges;
  }
}

function getAchievementProgress(achievement: AchievementDef, state: ReturnType<typeof useGame>['state']) {
  switch (achievement.id) {
    case 'firstHarvest':
      return state.stats.incomeEarned;
    case 'packCollector':
      return state.stats.packsOpened;
    case 'plotPlanner':
      return state.stats.plotsUnlocked;
    case 'rareFarmer':
      return state.stats.legendaryFound ? 1 : 0;
    case 'reforgeApprentice':
      return state.stats.reforges;
  }
}
