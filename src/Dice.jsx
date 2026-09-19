const PIP_LAYOUTS = {
    1: [[50, 50]],
    2: [[28, 28], [72, 72]],
    3: [[28, 28], [50, 50], [72, 72]],
    4: [[28, 28], [72, 28], [28, 72], [72, 72]],
    5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
    6: [[28, 25], [72, 25], [28, 50], [72, 50], [28, 75], [72, 75]],
};

export default function Die({ value, removed = false, tumble = false }) {
    const pips = PIP_LAYOUTS[value] || [];
    return (
        <svg
            className={`dbg-die${removed ? ' dbg-die--removed' : ''}${tumble ? ' dbg-die--tumble' : ''}`}
            viewBox="0 0 100 100"
            role="img"
            aria-label={`Die showing ${value}`}
        >
            <rect
                x="4" y="4" width="92" height="92" rx="16"
                fill="var(--surface-raised)"
                stroke={removed ? 'var(--line)' : 'var(--gold-dim)'}
                strokeWidth="3"
            />
            {pips.map(([cx, cy], i) => (
                <circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r="8"
                    fill={removed ? 'var(--text-dim)' : 'var(--gold)'}
                />
            ))}
        </svg>
    );
}