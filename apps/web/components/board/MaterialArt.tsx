import type { Art } from "../../lib/reclaim";

export default function MaterialArt({
  art,
  name,
  image = "demo",
}: {
  art: Art;
  name: string;
  image?: string;
}) {
  if (image !== "demo")
    return (
      <div
        className="material-art uploaded-art"
        style={{ backgroundImage: `url("${image}")` }}
        role="img"
        aria-label={name}
      />
    );
  return (
    <div className={`material-art art-${art}`}>
      <svg
        viewBox="0 0 400 300"
        role="img"
        aria-label={`${name}, demo illustration`}
      >
        <ellipse
          cx="200"
          cy="246"
          rx="116"
          ry="10"
          fill="currentColor"
          opacity=".07"
        />
        {art === "boards" &&
          [0, 1, 2, 3].map((i) => (
            <g
              key={i}
              transform={`translate(${85 + i * 54} ${70 + (i % 2) * 12})`}
            >
              <path d="M0 12 44 0v156L0 168Z" fill="#ba9367" />
              <path d="m44 0 5 4v156l-5-4Z" fill="#8c6743" />
              <path d="m0 168 44-12 5 4-44 12Z" fill="#a58057" />
              <path
                d="M8 24v120M16 22v126M34 18v126"
                stroke="#aa8256"
                strokeWidth=".7"
              />
            </g>
          ))}
        {art === "boxes" && (
          <g stroke="#99764f" strokeWidth="1.5">
            <path d="m95 136 105-40 105 40-105 42Z" fill="#d5b184" />
            <path d="M95 136v72l105 40v-70Z" fill="#c8a06f" />
            <path d="M200 178v70l105-40v-72Z" fill="#b88e60" />
            <path
              d="m95 136-25-34 105-40 25 34-105 40Zm105-40 25-34 105 40-25 34Z"
              fill="#dfbf97"
            />
            <path d="m122 151 78 30 78-30" fill="none" />
          </g>
        )}
        {art === "pots" &&
          [0, 1, 2].map((i) => (
            <g
              key={i}
              transform={`translate(${72 + i * 85} ${105 + (i === 1 ? -30 : 0)})`}
            >
              <path
                d="m0 24 12 108h48L72 24"
                fill={i === 1 ? "#b57150" : "#c78d6c"}
              />
              <ellipse cx="36" cy="24" rx="38" ry="10" fill="#d9a284" />
              <ellipse cx="36" cy="23" rx="30" ry="6" fill="#86573f" />
              <path d="m13 37 9 81" stroke="#e1b092" strokeWidth="3" />
            </g>
          ))}
        {art === "cloth" && (
          <g>
            <path d="M93 97h215v103H93Z" fill="#708b9b" />
            <path
              d="m93 109 18 15 28-8 26 11 34-12 38 13 34-10 37 11v80H93Z"
              fill="#8da7b6"
            />
            <path d="M93 142h215v80H93Z" fill="#b2c7d0" />
            <path d="M105 159h191M105 185h191" stroke="#d5e0e4" />
            <path
              d="m112 221-5 12m21-12-2 12m18-12v12m18-12v12m18-12v12m18-12v12m18-12v12m18-12v12m18-12v12m18-12 2 12m18-12 5 12"
              stroke="#8da7b6"
            />
          </g>
        )}
        {art === "stand" && (
          <g fill="#d0af82" stroke="#a4835c">
            <path d="M150 72h102v121H150Z" />
            <path d="m158 193-18 57h13l22-57Zm71 0 23 57h13l-19-57Z" />
            <path d="M162 87h78v92h-78Z" fill="#eee2cf" />
            <path d="M180 108h40m-40 14h30m-30 14h40" stroke="#b69872" />
          </g>
        )}
        {art === "metal" && (
          <g fill="none" strokeLinecap="square">
            <path
              d="M105 220V92h115v128H105Zm72 14V106h115v128H177Z"
              stroke="#82949d"
              strokeWidth="10"
            />
            <path
              d="M105 130h115m-43 40h115"
              stroke="#bdc8cd"
              strokeWidth="7"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
