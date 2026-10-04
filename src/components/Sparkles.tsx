/**
 * Gentle twinkling stars behind the page – pure CSS (no JavaScript loop), so it costs almost no battery.
 * Positions come from a fixed list, so server and browser render the same markup.
 */
const STARS: [number, number, number, number, number][] = [
  // left %, top %, size px, duration s, delay s
  [6, 12, 14, 5.2, 0], [18, 64, 9, 6.4, 1.8], [27, 22, 7, 4.6, 3.1], [38, 82, 12, 7.1, 0.6],
  [47, 9, 8, 5.8, 2.4], [58, 46, 6, 4.9, 4.2], [66, 74, 15, 6.8, 1.1], [74, 18, 10, 5.5, 3.7],
  [83, 58, 8, 6.1, 0.3], [92, 30, 13, 7.4, 2.9], [12, 40, 6, 4.4, 5.0], [33, 50, 5, 5.0, 1.4],
  [52, 92, 9, 6.6, 3.3], [70, 36, 5, 4.2, 0.9], [88, 88, 11, 5.9, 4.6], [3, 86, 8, 6.3, 2.0],
  [96, 6, 7, 5.1, 3.9], [42, 34, 4, 4.7, 2.7],
];

export function Sparkles() {
  return (
    <div className="sparkles" aria-hidden="true">
      {STARS.map(([x, y, s, d, delay], i) => (
        <i
          key={i}
          style={{ left: `${x}%`, top: `${y}%`, width: s, height: s, animationDuration: `${d}s, ${d * 3.1}s`, animationDelay: `${-delay}s, ${-delay * 2}s` }}
        />
      ))}
    </div>
  );
}
