import { useEffect, useState } from "react";

function useDebounce(value: any, delay: number): any {
  const [debouncedValue, setDebouncedValue] = useState();

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
