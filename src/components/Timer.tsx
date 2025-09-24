import { useState, useEffect } from 'react';

interface TimerProps {
  startTime: Date | null;
  isCompleted: boolean;
}

export const Timer: React.FC<TimerProps> = ({ startTime, isCompleted }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime || isCompleted) return;

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isCompleted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!startTime) {
    return (
      <div className="text-center p-4">
        <div className="text-2xl font-mono font-bold text-gray-400">
          0:00
        </div>
        <div className="text-sm text-gray-500">
          Start typing to begin
        </div>
      </div>
    );
  }

  return (
    <div className="text-center p-4">
      <div className="text-2xl font-mono font-bold text-gray-900">
        {formatTime(elapsed)}
      </div>
      <div className="text-sm text-gray-600">
        {isCompleted ? 'Completed!' : 'Time'}
      </div>
    </div>
  );
};