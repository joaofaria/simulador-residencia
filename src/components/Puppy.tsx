// Filhotes desenhados à mão em SVG, sem imagens externas.
type Coat = "caramel" | "cream" | "choco";
const coats: Record<Coat, { head: string; ear: string; patch: string }> = {
  caramel: { head: "#ecb67f", ear: "#9a5b34", patch: "#d39058" },
  cream: { head: "#fbe6cc", ear: "#d9a676", patch: "#f1cfa6" },
  choco: { head: "#a86a43", ear: "#5e3622", patch: "#8c5131" },
};
const ink = "#3b2a22";
export function Puppy({
  mood = "happy",
  coat = "caramel",
  paws = false,
  size = 120,
  className,
}: {
  mood?: "happy" | "sleepy";
  coat?: Coat;
  paws?: boolean;
  size?: number;
  className?: string;
}) {
  const c = coats[coat];
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
        d="M54 33c2-9 8-9 7-1 3-7 9-5 6 2"
        fill={c.head}
        stroke={c.head}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <ellipse cx="60" cy="64" rx="38" ry="34" fill={c.head} />
      <ellipse cx="77" cy="56" rx="11" ry="10" fill={c.patch} />
      <path
        d="M30 38C14 40 7 62 13 80c4 11 17 8 19-5 2-12 5-28-2-37Z"
        fill={c.ear}
      />
      <path
        d="M90 38c16 2 23 24 17 42-4 11-17 8-19-5-2-12-5-28 2-37Z"
        fill={c.ear}
      />
      <ellipse cx="60" cy="81" rx="20" ry="15" fill="#fff6ec" />
      {mood === "happy" ? (
        <>
          <circle cx="45" cy="58" r="5.5" fill={ink} />
          <circle cx="75" cy="58" r="5.5" fill={ink} />
          <circle cx="46.8" cy="56" r="1.9" fill="#fff" />
          <circle cx="76.8" cy="56" r="1.9" fill="#fff" />
          <path d="M56 86c0 9 8 9 8 0Z" fill="#f28b9b" />
        </>
      ) : (
        <>
          <path
            d="M39 59q6 5 12 0M69 59q6 5 12 0"
            fill="none"
            stroke={ink}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <text
            x="96"
            y="30"
            fontSize="14"
            fontWeight="800"
            fill="currentColor"
            fontFamily="inherit"
          >
            z
          </text>
          <text
            x="106"
            y="18"
            fontSize="10"
            fontWeight="800"
            fill="currentColor"
            fontFamily="inherit"
          >
            z
          </text>
        </>
      )}
      <ellipse cx="60" cy="73" rx="7" ry="5" fill={ink} />
      <ellipse cx="58" cy="71.5" rx="2.2" ry="1.3" fill="#fff" opacity="0.7" />
      <path
        d="M60 78v5m0 0c-2 4-8 4-10 0m10 0c2 4 8 4 10 0"
        fill="none"
        stroke={ink}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="36" cy="72" rx="6" ry="4" fill="#f5a3ae" opacity="0.65" />
      <ellipse cx="84" cy="72" rx="6" ry="4" fill="#f5a3ae" opacity="0.65" />
      {paws && (
        <g fill={c.head} stroke={c.ear} strokeWidth="1.5">
          <ellipse cx="40" cy="104" rx="12" ry="8" />
          <ellipse cx="80" cy="104" rx="12" ry="8" />
          <path d="M36 99v6M44 99v6M76 99v6M84 99v6" fill="none" />
        </g>
      )}
    </svg>
  );
}
