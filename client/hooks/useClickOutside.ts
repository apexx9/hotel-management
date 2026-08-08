import { RefObject, useEffect, useRef } from "react";

const useClickOutside = <T extends HTMLElement = HTMLElement>(
  handler: (event: MouseEvent | TouchEvent) => void,
  ...ignoredRefs: RefObject<HTMLElement | null>[]
) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;

      if (!target) return;

      if (ref.current?.contains(target)) {
        return;
      }

      const isIgnored = ignoredRefs.some((ignoredRef) =>
        ignoredRef.current?.contains(target),
      );

      if (isIgnored) {
        return;
      }

      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [handler, ...ignoredRefs]);

  return ref;
};

export default useClickOutside;
