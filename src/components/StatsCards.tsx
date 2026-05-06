interface StatsCardsProps {
  totalEmployees: number;
  missedClockIns: number;
  missedClockOuts: number;
  avgHoursWorked: number;
}

const StatsCards = ({
  totalEmployees, missedClockIns, missedClockOuts, avgHoursWorked,
}: StatsCardsProps) => {
  const stats = [
    {
      label: "Total staff",
      value: totalEmployees.toString(),
      tone:  "neutral" as const,
    },
    {
      label: "Missed clock-in",
      value: missedClockIns.toString(),
      tone:  missedClockIns > 0 ? "warn" as const : "neutral" as const,
    },
    {
      label: "Missed clock-out",
      value: missedClockOuts.toString(),
      tone:  missedClockOuts > 0 ? "warn" as const : "neutral" as const,
    },
    {
      label: "Avg hours / week",
      value: avgHoursWorked.toFixed(1),
      tone:  "neutral" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => {
        const valueColor = stat.tone === "warn" ? "text-destructive" : "text-foreground";
        return (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-xl p-5 transition-colors hover:border-foreground/20"
          >
            <p className={`font-display font-bold text-[36px] leading-none tabular-nums ${valueColor}`}>
              {stat.value}
            </p>
            <p className="text-[12px] text-foreground/55 mt-3">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;