'use client';


interface Stakeholder {
  id: string;
  name: string;
  role: string;
  influence: number; // 0-100
  interest: number; // 0-100
  stance: 'supportive' | 'neutral' | 'opposed';
  keyConcerns: string[];
}

interface StakeholderMapProps {
  stakeholders: Stakeholder[];
}

export function StakeholderMap({ stakeholders }: StakeholderMapProps) {
  const quadrants = [
    { label: 'Keep Satisfied', x: 0, y: 50, w: 50, h: 50, color: 'bg-yellow-500/10' },
    { label: 'Manage Closely', x: 50, y: 50, w: 50, h: 50, color: 'bg-red-500/10' },
    { label: 'Monitor', x: 0, y: 0, w: 50, h: 50, color: 'bg-gray-500/10' },
    { label: 'Keep Informed', x: 50, y: 0, w: 50, h: 50, color: 'bg-blue-500/10' },
  ];

  const getStanceColor = (stance: string) => {
    switch (stance) {
      case 'supportive': return 'bg-emerald-500 border-emerald-300';
      case 'opposed': return 'bg-red-500 border-red-300';
      default: return 'bg-gray-500 border-gray-300';
    }
  };

  return (
    <div className="relative aspect-square w-full max-w-lg mx-auto bg-secondary/20 rounded-lg border border-border p-8">
      {/* Y-Axis Label */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-medium text-muted">
        Influence / Power
      </div>

      {/* X-Axis Label */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm font-medium text-muted">
        Interest
      </div>

      {/* Quadrants */}
      <div className="relative w-full h-full border-l-2 border-b-2 border-muted/30">
        {quadrants.map((q, idx) => (
          <div
            key={idx}
            className={`absolute flex items-center justify-center ${q.color}`}
            style={{
              left: `${q.x}%`,
              bottom: `${q.y}%`,
              width: `${q.w}%`,
              height: `${q.h}%`,
            }}
          >
            <span className="text-sm font-bold text-muted/50 uppercase tracking-widest">
              {q.label}
            </span>
          </div>
        ))}

        {/* Stakeholder Nodes */}
        {stakeholders.map((stakeholder) => (
          <div
            key={stakeholder.id}
            className="absolute group transform -translate-x-1/2 translate-y-1/2 hover:z-50"
            style={{
              left: `${stakeholder.interest}%`,
              bottom: `${stakeholder.influence}%`,
            }}
          >
            <div className={`
              w-4 h-4 rounded-full border-2 cursor-pointer shadow-lg
              transition-transform duration-300 group-hover:scale-150
              ${getStanceColor(stakeholder.stance)}
            `} />
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 hidden group-hover:block z-50">
              <div className="bg-popover text-popover-foreground text-xs rounded-md shadow-xl p-3 border border-border">
                <p className="font-bold text-sm">{stakeholder.name}</p>
                <p className="text-muted-foreground mb-2">{stakeholder.role}</p>
                <div className="space-y-1">
                  {stakeholder.keyConcerns.slice(0, 2).map((concern, i) => (
                    <p key={i} className="flex items-start gap-1">
                      <span className="text-accent-primary">•</span>
                      {concern}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 bg-background/80 p-2 rounded-md border border-border text-xs backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Supportive</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gray-500" />
          <span>Neutral</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>Opposed</span>
        </div>
      </div>
    </div>
  );
}

interface AlignmentChartProps {
  data: Array<{
    category: string;
    alignment: number; // -100 to 100
    importance: number; // 0 to 100
  }>;
}

export function AlignmentChart({ data }: AlignmentChartProps) {
  return (
    <div className="space-y-4">
      {data.map((item, idx) => (
        <div key={idx} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>{item.category}</span>
            <span className={item.alignment >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {item.alignment > 0 ? '+' : ''}{item.alignment}%
            </span>
          </div>
          <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
            {/* Center line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 z-10" />
            
            {/* Bar */}
            <div 
              className={`absolute top-0 bottom-0 transition-all duration-500 ${
                item.alignment >= 0 ? 'bg-emerald-500 left-1/2' : 'bg-red-500 right-1/2'
              }`}
              style={{ 
                width: `${Math.abs(item.alignment) / 2}%`,
                opacity: 0.5 + (item.importance / 200) // Opacity based on importance
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
