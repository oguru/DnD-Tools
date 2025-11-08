import '../../styles/HealthBar.css';

type HealthBarVariant = 'default' | 'mini' | 'character' | 'boss' | 'entity';

interface HealthBarProps {
  currentHp: number;
  maxHp: number;
  tempHp?: number;
  healthPercentage?: number;
  healthColor?: string;
  variant?: HealthBarVariant;
  showText?: boolean;
  className?: string;
}

/**
 * Reusable HealthBar component
 * Displays a colored bar showing current HP percentage
 */
const HealthBar: React.FC<HealthBarProps> = ({ 
  currentHp, 
  maxHp, 
  tempHp = 0,
  healthPercentage,
  healthColor,
  variant = 'default',
  showText = true,
  className = ''
}) => {
  // Calculate percentage if not provided
  const percentage = healthPercentage !== undefined 
    ? healthPercentage 
    : maxHp > 0 ? Math.round((currentHp / maxHp) * 100) : 0;

  // Determine color if not provided
  const barColor = healthColor || (
    percentage > 60 ? '#22c55e' :
    percentage > 30 ? '#eab308' :
    '#ef4444'
  );

  // Get CSS classes based on variant
  const containerClass = `health-bar-container ${variant}-health-bar-container ${className}`.trim();
  const barClass = `health-bar ${variant}-health-bar`;

  return (
    <div className={containerClass}>
      {showText && (
        <span className="hp-text">
          {currentHp}/{maxHp} HP
          {tempHp > 0 && <span className="temp-hp-badge"> (+{tempHp} temp)</span>}
        </span>
      )}
      <div 
        className={barClass}
        style={{
          width: `${percentage}%`,
          backgroundColor: barColor
        }}
      />
    </div>
  );
};

export default HealthBar;
export type { HealthBarProps, HealthBarVariant };

