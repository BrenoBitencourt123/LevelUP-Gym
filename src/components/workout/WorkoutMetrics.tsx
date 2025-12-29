type WorkoutMetricsProps = {
  durationLabel: string;
  volumeKg: number;
  setsLabel: string;
};

const WorkoutMetrics = ({ durationLabel, volumeKg, setsLabel }: WorkoutMetricsProps) => {
  return (
    <div className="max-w-md mx-auto px-4 pt-4">
      <div className="card-glass p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Tempo</p>
          <p className="text-lg font-semibold text-foreground tabular-nums">{durationLabel}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Volume</p>
          <p className="text-lg font-semibold text-foreground tabular-nums">{volumeKg} kg</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Series</p>
          <p className="text-lg font-semibold text-foreground tabular-nums">{setsLabel}</p>
        </div>
      </div>
    </div>
  );
};

export default WorkoutMetrics;
