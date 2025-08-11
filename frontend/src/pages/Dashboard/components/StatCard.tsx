import React from 'react';


interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isIncrease: boolean;
  icon: React.ReactNode;
  iconBg: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon,
  iconBg 
}) => {
  return (
    <div className="card group hover:shadow-glow transition-all duration-300">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-accent/60">{title}</p>
          <p className="text-2xl font-display font-bold text-accent mt-1">{value}</p>
        </div>
        <div className={`${iconBg} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;