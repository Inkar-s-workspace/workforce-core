import { Users, Clock, AlertTriangle, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  totalEmployees: number;
  missedClockIns: number;
  missedClockOuts: number;
  avgHoursWorked: number;
}

const StatsCards = ({ totalEmployees, missedClockIns, missedClockOuts, avgHoursWorked }: StatsCardsProps) => {
  const stats = [
    {
      label: "Total Employees",
      value: totalEmployees,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Missed Clock-In",
      value: missedClockIns,
      icon: AlertTriangle,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "Missed Clock-Out",
      value: missedClockOuts,
      icon: Clock,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "Avg Hours/Week",
      value: avgHoursWorked.toFixed(1),
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card flex items-center gap-4">
          <div className={`${stat.bgColor} p-3 rounded-lg`}>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
