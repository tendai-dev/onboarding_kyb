import { useEffect as t } from 'react';
function e(e, n) {
  t(() => {
    const t = (t) => {
      const o = e?.current;
      if (o && !o.contains(t.target)) {
        n(t);
      }
    };
    document.addEventListener('mousedown', t);
    document.addEventListener('touchstart', t);
    return () => {
      document.removeEventListener('mousedown', t);
      document.removeEventListener('touchstart', t);
    };
  }, [e, n]);
}
export { e as useOnClickOutside };
//# sourceMappingURL=useOnClickOutside.js.map
