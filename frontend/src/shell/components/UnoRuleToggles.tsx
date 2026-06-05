import { UnoRules } from "../../games/uno/types";

interface RuleConfig {
  key: keyof UnoRules;
  label: string;
  description: string;
}

const RULE_CONFIGS: RuleConfig[] = [
  {
    key: "seven_zero",
    label: "7 / 0 Swap",
    description: "Playing a 7 swaps your hand with another player. Playing a 0 rotates all hands in the turn direction.",
  },
  {
    key: "jump_in",
    label: "Jump In",
    description: "If you hold an exact duplicate of the card just played (same color and number), you can play it out of turn instantly.",
  },
  {
    key: "must_play_drawn",
    label: "Must Play Drawn Card",
    description: "If the card you draw is playable, you must play it — you cannot pass.",
  },
];

interface Props {
  rules: UnoRules;
  onToggle: (key: keyof UnoRules) => void;
  isHost: boolean;
}

export function UnoRuleToggles({ rules, onToggle, isHost }: Props) {
  return (
    <div className="rule-toggles">
      <h3 className="rule-toggles__title">House Rules</h3>
      {RULE_CONFIGS.map(({ key, label, description }) => (
        <div
          key={key}
          className={`rule-row ${!isHost ? "rule-row--disabled" : ""}`}
          onClick={() => isHost && onToggle(key)}
          role="button"
          tabIndex={isHost ? 0 : -1}
          onKeyDown={(e) => e.key === "Enter" && isHost && onToggle(key)}
          aria-pressed={rules[key]}
        >
          <div className="rule-row__text">
            <span className="rule-row__label">{label}</span>
            <span className="rule-row__desc">{description}</span>
          </div>
          <div className={`toggle ${rules[key] ? "toggle--on" : "toggle--off"}`}>
            <div className="toggle__knob" />
          </div>
        </div>
      ))}
    </div>
  );
}
