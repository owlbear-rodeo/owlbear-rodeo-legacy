import { useEffect, useState } from "react";

function useDebounce<Type>(value: Type, delay: number): Type | undefined {
  const [debouncedValue, setDebouncedValue] = useState<Type>();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(timeout);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
