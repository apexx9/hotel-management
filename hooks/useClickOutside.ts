import { useRef, useEffect } from "react";

const useClickOutside = <T extends HTMLDivElement = HTMLDivElement>(
  handler: (event: MouseEvent | TouchEvent) => void,
) => {
  const closeRef = useRef<T>(null);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (
        !closeRef.current ||
        closeRef.current.contains(event.target as Node)
      ) {
        return;
      }
      return handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [handler]);
  return closeRef;
};

export default useClickOutside;
