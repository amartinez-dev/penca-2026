import { getCountryCode, getTeamInitials, isPlaceholderTeam } from '@/lib/teamAssets';

type Props = {
  team: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  muted?: boolean;
};

export function TeamBadge({ team, size = 'md', showName = true, muted = false }: Props) {
  const name = String(team || 'Por definir').trim();
  const code = getCountryCode(name);
  const placeholder = isPlaceholderTeam(name);
  const classes = ['team-badge', `team-badge-${size}`, muted || placeholder ? 'muted' : ''].filter(Boolean).join(' ');

  return (
    <span className={classes} title={name}>
      <span className="team-shield" aria-hidden="true">
        {code ? (
          <img src={`https://flagcdn.com/w80/${code}.png`} alt="" loading="lazy" />
        ) : (
          <span className="team-initials">{getTeamInitials(name)}</span>
        )}
      </span>
      {showName && <span className="team-name">{placeholder ? 'Por definir' : name}</span>}
    </span>
  );
}
