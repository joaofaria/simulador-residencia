// Thor, o golden retriever filhote do site, desenhado à mão em SVG.
const fur = "#f2c27b";
const ear = "#d38c3e";
const ink = "#3b2a22";
export type ThorMood = "happy" | "sleepy" | "proud" | "hopeful";
export function Thor({
  mood = "happy",
  paws = false,
  size = 120,
  className,
}: {
  mood?: ThorMood;
  paws?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M48 34c-1-9 6-10 8-4 1-8 9-8 9 0 3-6 10-3 7 4"
        fill={fur}
        stroke={fur}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <ellipse cx="60" cy="64" rx="38" ry="34" fill={fur} />
      <ellipse cx="60" cy="46" rx="16" ry="9" fill="#f7d39d" />
      <path
        d="M31 37C16 39 7 57 11 74c1 5 5 9 9 8 2 4 8 4 10-1 2 3 6 1 6-3 2-13 4-29-5-41Z"
        fill={ear}
      />
      <path
        d="M89 37c15 2 24 20 20 37-1 5-5 9-9 8-2 4-8 4-10-1-2 3-6 1-6-3-2-13-4-29 5-41Z"
        fill={ear}
      />
      <path
        d="M34 92q26 14 52 0"
        fill="none"
        stroke="#d9534f"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="60" cy="101" r="4.5" fill="#f5c542" stroke="#c99a1e" />
      <ellipse cx="60" cy="81" rx="20" ry="15" fill="#fff4e3" />
      <Eyes mood={mood} />
      {(mood === "happy" || mood === "proud") && (
        <path d="M56 86c0 9 8 9 8 0Z" fill="#f28b9b" />
      )}
      <ellipse cx="60" cy="73" rx="7" ry="5" fill={ink} />
      <ellipse cx="58" cy="71.5" rx="2.2" ry="1.3" fill="#fff" opacity="0.7" />
      <path
        d={
          mood === "hopeful"
            ? "M60 78v4m-6 5q6-4 12 0"
            : "M60 78v5m0 0c-2 4-8 4-10 0m10 0c2 4 8 4 10 0"
        }
        fill="none"
        stroke={ink}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="36" cy="72" rx="6" ry="4" fill="#f5a3ae" opacity="0.65" />
      <ellipse cx="84" cy="72" rx="6" ry="4" fill="#f5a3ae" opacity="0.65" />
      {mood === "sleepy" && (
        <g fill="currentColor" fontWeight="800" fontFamily="inherit">
          <text x="96" y="30" fontSize="14">
            z
          </text>
          <text x="106" y="18" fontSize="10">
            z
          </text>
        </g>
      )}
      {mood === "proud" && (
        <g fill="#f5c542">
          <path d="M14 22l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
          <path d="M104 12l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
          <path d="M108 44l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5Z" />
        </g>
      )}
      {paws && (
        <g fill={fur} stroke={ear} strokeWidth="1.5">
          <ellipse cx="38" cy="106" rx="12" ry="8" />
          <ellipse cx="82" cy="106" rx="12" ry="8" />
          <path d="M34 101v6M42 101v6M78 101v6M86 101v6" fill="none" />
        </g>
      )}
    </svg>
  );
}
function Eyes({ mood }: { mood: ThorMood }) {
  if (mood === "sleepy")
    return (
      <path
        d="M39 59q6 5 12 0M69 59q6 5 12 0"
        fill="none"
        stroke={ink}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    );
  if (mood === "proud")
    return (
      <path
        d="M39 60q6-7 12 0M69 60q6-7 12 0"
        fill="none"
        stroke={ink}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    );
  const r = mood === "hopeful" ? 7 : 5.5;
  return (
    <>
      {mood === "hopeful" && (
        <path
          d="M37 47l10-4M83 47l-10-4"
          fill="none"
          stroke={ear}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      )}
      <circle cx="45" cy="58" r={r} fill={ink} />
      <circle cx="75" cy="58" r={r} fill={ink} />
      <circle cx="47" cy="55.5" r={r / 3} fill="#fff" />
      <circle cx="77" cy="55.5" r={r / 3} fill="#fff" />
      {mood === "hopeful" && (
        <>
          <circle cx="43" cy="61" r="1.2" fill="#fff" />
          <circle cx="73" cy="61" r="1.2" fill="#fff" />
        </>
      )}
    </>
  );
}
