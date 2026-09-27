import React from 'react';

interface RadarData {
  threatDetection: number;
  investigation: number;
  escalation: number;
  incidentResponse: number;
  securityOperations: number;
  governanceOversight: number;
  operationalDiscipline: number;
  cyberResilience: number;
}

interface RadarChartProps {
  data?: RadarData;
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  data = {
    threatDetection: 85,
    investigation: 78,
    escalation: 65,
    incidentResponse: 72,
    securityOperations: 80,
    governanceOversight: 60,
    operationalDiscipline: 70,
    cyberResilience: 75
  },
  size = 320
}) => {
  const categories = [
    { key: 'threatDetection', label: 'Threat Detection' },
    { key: 'investigation', label: 'Investigation' },
    { key: 'escalation', label: 'Escalation' },
    { key: 'incidentResponse', label: 'Incident Response' },
    { key: 'securityOperations', label: 'Sec Operations' },
    { key: 'governanceOversight', label: 'Governance' },
    { key: 'operationalDiscipline', label: 'Discipline' },
    { key: 'cyberResilience', label: 'Resilience' }
  ];

  const center = size / 2;
  const radius = (size / 2) - 45;
  const total = categories.length;

  const getCoordinates = (value: number, index: number) => {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Concentric polygon grid levels: 25%, 50%, 75%, 100%
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const polygonPoints = categories.map((cat, i) => {
    const val = (data as any)[cat.key] || 50;
    const { x, y } = getCoordinates(val, i);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Grid Polygons */}
        {gridLevels.map((lvl, idx) => {
          const points = categories.map((_, i) => {
            const { x, y } = getCoordinates(lvl * 100, i);
            return `${x},${y}`;
          }).join(' ');

          return (
            <polygon
              key={idx}
              points={points}
              fill={idx === 3 ? 'rgba(15, 23, 42, 0.6)' : 'none'}
              stroke="rgba(51, 65, 85, 0.4)"
              strokeWidth="1"
              strokeDasharray={idx < 3 ? '3 3' : 'none'}
            />
          );
        })}

        {/* Radial axes */}
        {categories.map((cat, i) => {
          const { x, y } = getCoordinates(100, i);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(51, 65, 85, 0.5)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Shape */}
        <polygon
          points={polygonPoints}
          fill="rgba(6, 182, 212, 0.25)"
          stroke="#06b6d4"
          strokeWidth="2.5"
          className="drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
        />

        {/* Points and Labels */}
        {categories.map((cat, i) => {
          const val = (data as any)[cat.key] || 50;
          const { x, y } = getCoordinates(val, i);
          const labelCoord = getCoordinates(120, i);

          const isWarning = val < 60;

          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={4}
                fill={isWarning ? '#f59e0b' : '#22d3ee'}
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              <text
                x={labelCoord.x}
                y={labelCoord.y + 4}
                textAnchor="middle"
                className={`text-[10px] font-mono font-medium ${
                  isWarning ? 'fill-amber-400 font-bold' : 'fill-slate-300'
                }`}
              >
                {cat.label} ({val}%)
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
