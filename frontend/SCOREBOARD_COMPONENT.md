# Cricket Scoreboard Component

A production-ready React component for displaying live cricket match scores with real-time metrics, modern UI design, and full TypeScript support.

## Features

- **Team Information Display**: Shows team names, runs, wickets, and overs played
- **Real-time Metrics**: Calculates run rates, overs remaining, and required run rates
- **Multiple Layouts**: Supports both standard (full details) and compact (mini) views
- **Cricket-aware Logic**: 
  - Tracks all-out status (10 wickets)
  - Calculates required run rate for chasing team
  - Shows overs remaining counter
  - Displays match status (leading team, tied, all out)
- **Responsive Design**: Mobile-first approach using Tailwind CSS
- **Flexible Data Input**: Accepts both individual props and Match/Innings objects
- **Accessible UI**: High contrast colors, clear typography, proper semantic structure
- **Full TypeScript Support**: Complete type safety with proper interfaces

## Component Props

```typescript
interface ScoreboardProps {
  match?: Match;                 // Full match object (optional)
  innings?: Innings[];          // Array of innings objects (optional)
  team1Name?: string;          // Team 1 name (default: 'Team A')
  team2Name?: string;          // Team 2 name (default: 'Team B')
  team1Runs?: number;          // Team 1 runs scored
  team1Wickets?: number;       // Team 1 wickets lost
  team1Overs?: number;         // Team 1 overs played
  team2Runs?: number;          // Team 2 runs scored
  team2Wickets?: number;       // Team 2 wickets lost
  team2Overs?: number;         // Team 2 overs played
  compact?: boolean;           // Compact layout mode (default: false)
  maxOvers?: number;           // Maximum overs per innings (default: 20)
  showRunRate?: boolean;       // Show run rate in compact view (default: true)
}
```

## Usage Examples

### Basic Usage with Props

```jsx
import { Scoreboard } from '@/components/Scoreboard';

export function LiveMatch() {
  return (
    <Scoreboard
      team1Name="Mumbai Indians"
      team2Name="Royal Challengers"
      team1Runs={165}
      team1Wickets={7}
      team1Overs={20}
      team2Runs={142}
      team2Wickets={4}
      team2Overs={18}
      maxOvers={20}
    />
  );
}
```

### Using Match Data

```jsx
import { Scoreboard } from '@/components/Scoreboard';
import { Match } from '@/types';

export function MatchDisplay({ match }: { match: Match }) {
  return <Scoreboard match={match} />;
}
```

### Using Innings Data

```jsx
import { Scoreboard } from '@/components/Scoreboard';
import { Innings } from '@/types';

export function InningsDisplay({ innings }: { innings: Innings[] }) {
  return <Scoreboard innings={innings} maxOvers={50} />;
}
```

### Compact Layout

```jsx
<Scoreboard
  team1Name="CSK"
  team2Name="RRF"
  team1Runs={158}
  team1Wickets={6}
  team1Overs={20}
  team2Runs={145}
  team2Wickets={8}
  team2Overs={19}
  compact={true}
/>
```

## Component Layout

### Standard View
Displays comprehensive match information in a spacious layout:
- Large run numbers with prominent styling
- Separate sections for runs, wickets, and overs
- Run rate, required RR (for chasing team), and status
- Match status bar showing leading team, run margin, and overs progress

### Compact View
Minimalist layout suitable for sidebars or widgets:
- Team name and score on one line
- Overs and run rate on second line
- Smaller font sizes and reduced padding

## Styling

The component uses Tailwind CSS and is built with:
- Blue gradient for Team 1 (bat first)
- Red gradient for Team 2 (chase)
- Hover effects and smooth transitions
- Responsive grid layout (1 column on mobile, 2 columns on desktop)
- Shadow effects for depth

## Calculations Explained

### Run Rate
```
Run Rate = Total Runs / Total Overs
Example: 165 / 20 = 8.25
```

### Overs Remaining
```
Overs Remaining = Max Overs - Overs Played
Example: 20 - 18 = 2 overs left
```

### Required Run Rate (for chasing team)
```
Required RR = Required Runs / Overs Remaining
Required Runs = Team 1 Total + 1
Example: (165 + 1) / 2 = 83 runs per over
```

## Status Indicators

- **In Progress**: Team is still batting
- **All Out**: Team has lost 10 wickets
- **Innings Closed**: Team has completed their overs
- **Match Status**: Shows which team is leading and by how many runs

## Integration

The component integrates seamlessly with the existing CricLive architecture:
- Compatible with `/types/index.ts` Match and Innings types
- Works with existing pages (LiveScoring, ScoreboardDemo, etc.)
- Follows CricLive styling patterns and conventions
- Maintains component reusability and composition

## Demo

Use the `ScoreboardShowcase` component to see all features:
```jsx
import { ScoreboardShowcase } from '@/components/ScoreboardShowcase';

export function DemoPage() {
  return <ScoreboardShowcase />;
}
```

The showcase includes:
- Live match scenario
- Chasing team scenario
- All out scenario
- Tied match scenario
- Both standard and compact layouts
- Code examples and feature list

## Performance

- No external dependencies beyond React
- Minimal re-renders with proper memoization
- Efficient calculations (no loops or expensive operations)
- Lightweight component (single file)
- CSS-based styling with Tailwind (no extra CSS files)

## Accessibility

- High contrast text and backgrounds
- Proper heading hierarchy
- Clear status text and indicators
- Semantic HTML structure
- Responsive design works on all devices

## Browser Support

Works on all modern browsers that support:
- React 18.3+
- CSS Grid and Flexbox
- ES6+ JavaScript

## Related Components

- `ScoreCard.tsx` - Detailed innings card with batting/bowling stats
- `Layout.tsx` - Main layout wrapper
- `BottomNav.tsx` - Navigation component
