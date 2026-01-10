import { useEffect, useState, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedNumber({ value, duration = 600, className }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValueRef = useRef(0);

  useEffect(() => {
    const startValue = previousValueRef.current;
    const endValue = value;
    const steps = 20;
    const stepDuration = duration / steps;
    const increment = (endValue - startValue) / steps;
    
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(endValue);
        previousValueRef.current = endValue;
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(startValue + increment * currentStep));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span className={className}>{displayValue}</span>;
}
