import React from "react";
/**
 * useOnClickOutside hook
 * @param ref
 * @param handler
 * @see https://usehooks.com/useOnClickOutside/
 * @see
 * @example
 * const ref = useRef()
 * useOnClickOutside(ref, () => console.log('clicked outside'))
 * return <div ref={ref}>...</div>
 */
export declare function useOnClickOutside<T extends HTMLElement>(ref: React.RefObject<T>, handler: (event: MouseEvent | TouchEvent) => void): void;
//# sourceMappingURL=useOnClickOutside.d.ts.map