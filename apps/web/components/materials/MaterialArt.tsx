const artBackgrounds: Record<Art, string> = {
  boards: "bg-[var(--material-sand)]",
  boxes: "bg-[var(--material-sage)]",
  pots: "bg-[var(--material-clay)]",
  cloth: "bg-[var(--material-mist)]",
  stand: "bg-[var(--material-cream)]",
  metal: "bg-[var(--material-steel)]",
  chair: "bg-[var(--material-mist)]",
  pallet: "bg-[var(--material-sage)]",
  bottles: "bg-[var(--material-steel)]",
  cables: "bg-[var(--material-sand)]",
  books: "bg-[var(--material-cream)]",
  crates: "bg-[var(--material-clay)]",
};
import type { Art, MaterialArtProps } from "@/types/materials/type";

export default function MaterialArt({
  art,
  name,
  image = "demo",
}: MaterialArtProps) {
  if (image !== "demo")
    return (
      <div
        className="material-art uploaded-art grid aspect-[4/3] w-full place-items-center overflow-hidden bg-[var(--material-sand)] bg-cover bg-center text-ink"
        style={{ backgroundImage: `url("${image}")` }}
        role="img"
        aria-label={name}
      />
    );
  return (
    <div
      className={`material-art grid aspect-[4/3] w-full place-items-center overflow-hidden text-ink [&_svg]:size-full [&_svg]:transition-transform [&_svg]:duration-300 motion-safe:group-hover:[&_svg]:scale-[1.03] motion-reduce:[&_svg]:transition-none ${artBackgrounds[art]}`}
    >
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
              <path d="M0 12 44 0v156L0 168Z" fill="var(--wood)" />
              <path d="m44 0 5 4v156l-5-4Z" fill="var(--wood-edge)" />
              <path d="m0 168 44-12 5 4-44 12Z" fill="var(--wood-base)" />
              <path
                d="M8 24v120M16 22v126M34 18v126"
                stroke="var(--wood-grain)"
                strokeWidth=".7"
              />
            </g>
          ))}
        {art === "boxes" && (
          <g stroke="var(--cardboard-line)" strokeWidth="1.5">
            <path
              d="m95 136 105-40 105 40-105 42Z"
              fill="var(--cardboard-top)"
            />
            <path d="M95 136v72l105 40v-70Z" fill="var(--cardboard-front)" />
            <path d="M200 178v70l105-40v-72Z" fill="var(--cardboard-side)" />
            <path
              d="m95 136-25-34 105-40 25 34-105 40Zm105-40 25-34 105 40-25 34Z"
              fill="var(--cardboard-flap)"
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
                fill={i === 1 ? "var(--pot-dark)" : "var(--pot)"}
              />
              <ellipse cx="36" cy="24" rx="38" ry="10" fill="var(--pot-rim)" />
              <ellipse cx="36" cy="23" rx="30" ry="6" fill="var(--pot-inner)" />
              <path d="m13 37 9 81" stroke="var(--pot-light)" strokeWidth="3" />
            </g>
          ))}
        {art === "cloth" && (
          <g>
            <path d="M93 97h215v103H93Z" fill="var(--cloth-dark)" />
            <path
              d="m93 109 18 15 28-8 26 11 34-12 38 13 34-10 37 11v80H93Z"
              fill="var(--cloth-middle)"
            />
            <path d="M93 142h215v80H93Z" fill="var(--cloth-light)" />
            <path d="M105 159h191M105 185h191" stroke="var(--cloth-line)" />
            <path
              d="m112 221-5 12m21-12-2 12m18-12v12m18-12v12m18-12v12m18-12v12m18-12v12m18-12v12m18-12v12m18-12 2 12m18-12 5 12"
              stroke="var(--cloth-middle)"
            />
          </g>
        )}
        {art === "stand" && (
          <g fill="var(--stand)" stroke="var(--stand-edge)">
            <path d="M150 72h102v121H150Z" />
            <path d="m158 193-18 57h13l22-57Zm71 0 23 57h13l-19-57Z" />
            <path d="M162 87h78v92h-78Z" fill="var(--stand-paper)" />
            <path
              d="M180 108h40m-40 14h30m-30 14h40"
              stroke="var(--stand-ink)"
            />
          </g>
        )}
        {art === "metal" && (
          <g fill="none" strokeLinecap="square">
            <path
              d="M105 220V92h115v128H105Zm72 14V106h115v128H177Z"
              stroke="var(--metal)"
              strokeWidth="10"
            />
            <path
              d="M105 130h115m-43 40h115"
              stroke="var(--metal-light)"
              strokeWidth="7"
            />
          </g>
        )}
        {art === "chair" && (
          <g stroke="var(--metal)" strokeWidth="6" strokeLinejoin="round">
            <path d="M146 70h96v102h-96Z" fill="var(--cloth-middle)" />
            <path d="m135 175 105-12 30 24-108 13Z" fill="var(--cloth-dark)" />
            <path
              d="m150 193-13 52m109-61 17 61m-84-47 7 47m-36-73-18 26"
              fill="none"
            />
            <path
              d="M158 89h72m-72 16h72m-72 16h72"
              stroke="var(--cloth-light)"
              strokeWidth="3"
            />
          </g>
        )}
        {art === "pallet" && (
          <g stroke="var(--wood-edge)" strokeWidth="2">
            <path d="m79 169 139-64 112 53-137 65Z" fill="var(--wood)" />
            <path d="m79 169 114 54v25L79 193Z" fill="var(--wood-base)" />
            <path d="m193 223 137-65v26l-137 64Z" fill="var(--wood-edge)" />
            {[0, 1, 2, 3, 4].map((i) => (
              <path
                key={i}
                d={`m${93 + i * 23} ${163 + i * 11} 136-63`}
                stroke="var(--wood-grain)"
                strokeWidth="6"
              />
            ))}
            <path
              d="m98 197 27 13v18l-27-13m40 19 26 12v-18l-26-13"
              fill="var(--material-sage)"
            />
          </g>
        )}
        {art === "bottles" &&
          [0, 1, 2].map((i) => (
            <g
              key={i}
              transform={`translate(${111 + i * 62} ${i === 1 ? 65 : 95})`}
              stroke="var(--cloth-dark)"
              strokeWidth="2"
            >
              <path
                d="M13 0h22v31l12 17v104q0 9-9 9H9q-9 0-9-9V48l13-17Z"
                fill="var(--cloth-light)"
              />
              <path d="M12 0h24v8H12Z" fill="var(--cloth-dark)" />
              <path
                d="M8 62h31v57H8Z"
                fill="var(--stand-paper)"
                stroke="none"
              />
              <path d="M11 130v18" stroke="var(--surface)" strokeWidth="3" />
            </g>
          ))}
        {art === "cables" && (
          <g fill="none" strokeLinecap="round">
            <ellipse
              cx="196"
              cy="158"
              rx="78"
              ry="59"
              stroke="var(--cloth-dark)"
              strokeWidth="9"
            />
            <ellipse
              cx="196"
              cy="158"
              rx="63"
              ry="46"
              stroke="var(--metal)"
              strokeWidth="8"
            />
            <ellipse
              cx="196"
              cy="158"
              rx="49"
              ry="34"
              stroke="var(--cloth-dark)"
              strokeWidth="8"
            />
            <path
              d="M256 180q45 14 46 42h-32m-119-70q-45-8-52-43"
              stroke="var(--metal)"
              strokeWidth="8"
            />
            <path
              d="M269 214h20v16h-20m-175-126h15v-20H94Z"
              fill="var(--cloth-dark)"
              stroke="var(--cloth-dark)"
              strokeWidth="3"
            />
            <path d="M199 103v106" stroke="var(--wood)" strokeWidth="12" />
          </g>
        )}
        {art === "books" && (
          <g stroke="var(--stand-edge)" strokeWidth="2">
            {[0, 1, 2].map((i) => (
              <g
                key={i}
                transform={`translate(${108 + i * 7} ${198 - i * 34})`}
              >
                <path
                  d="m0 0 135-10 56 23-137 11Z"
                  fill={i % 2 ? "var(--cloth-middle)" : "var(--pot)"}
                />
                <path
                  d="m0 0 54 24v24L0 24Z"
                  fill={i % 2 ? "var(--cloth-dark)" : "var(--pot-dark)"}
                />
                <path d="m54 24 137-11v24L54 48Z" fill="var(--stand-paper)" />
                <path
                  d="m63 32 119-9m-119 16 119-9"
                  stroke="var(--stand-ink)"
                  strokeWidth="1"
                />
              </g>
            ))}
          </g>
        )}
        {art === "crates" && (
          <g stroke="var(--wood-edge)" strokeWidth="3">
            <path d="m104 119 115-40 86 49-116 45Z" fill="var(--wood-base)" />
            <path d="m104 119 85 54v73l-85-54Z" fill="var(--wood)" />
            <path d="m189 173 116-45v74l-116 44Z" fill="var(--stand)" />
            <path d="m111 141 70 45m-70-23 70 45m20-24 94-36m-94 60 94-36" />
            <path
              d="m223 167 41-15v12l-41 15Z"
              fill="var(--wood-edge)"
              stroke="none"
            />
            <path
              d="m104 119 115-40 86 49"
              fill="none"
              stroke="var(--stand)"
              strokeWidth="8"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
