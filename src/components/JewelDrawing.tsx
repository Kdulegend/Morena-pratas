import type { Material } from "@/lib/catalog";

// Desenhos chapados das peças, gerados a partir do nome na planilha.
// Ficam no lugar da foto até a coluna "Foto (URL)" ser preenchida. Sem degradê: só tons chapados.

const STONES: Record<string, [string, string]> = {
  vermelho: ["#c62a3b", "#ea6170"],
  verde: ["#2b8a57", "#62c08b"],
  azul: ["#3a68bd", "#7ea0e0"],
  rosa: ["#e07fa6", "#f6b9d0"],
  cristal: ["#e9edf6", "#ffffff"],
  perola: ["#efe6d6", "#fffaf0"],
};

export function metal(material: Material) {
  return material === "ouro"
    ? { hi: "var(--gold-1)", base: "var(--gold-2)", shade: "var(--gold-3)", deep: "#8a6a27" }
    : { hi: "var(--silver-1)", base: "var(--silver-2)", shade: "var(--silver-3)", deep: "var(--silver-4)" };
}

type M = ReturnType<typeof metal>;

function Stone({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  const [c, light] = STONES[color] ?? STONES.cristal;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={c} />
      <path d={`M${x - r * 0.62} ${y - r * 0.1} L${x} ${y - r * 0.72} L${x + r * 0.62} ${y - r * 0.1} Z`} fill={light} />
      <circle cx={x + r * 0.3} cy={y + r * 0.32} r={r * 0.16} fill={light} />
    </g>
  );
}

function Heart({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return (
    <path
      d={`M${x} ${y + s * 0.9} C${x - s * 1.4} ${y - s * 0.1} ${x - s * 0.7} ${y - s * 1.15} ${x} ${y - s * 0.35} C${x + s * 0.7} ${y - s * 1.15} ${x + s * 1.4} ${y - s * 0.1} ${x} ${y + s * 0.9} Z`}
      fill={fill}
    />
  );
}

function Band({ m, cx = 100, cy = 118, rx = 56, ry = 58, t = 8 }: { m: M; cx?: number; cy?: number; rx?: number; ry?: number; t?: number }) {
  const outer = `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${rx * 2} 0 a${rx} ${ry} 0 1 0 ${-rx * 2} 0 Z`;
  const ix = rx - t, iy = ry - t;
  const inner = `M${cx - ix} ${cy + 2} a${ix} ${iy} 0 1 0 ${ix * 2} 0 a${ix} ${iy} 0 1 0 ${-ix * 2} 0 Z`;
  return (
    <g>
      <path d={outer + inner} fill={m.base} fillRule="evenodd" />
      {/* face interna em sombra, borda de luz em cima */}
      <path d={`M${cx - ix} ${cy + 2} a${ix} ${iy} 0 0 1 ${ix * 2} 0 a${ix} ${iy * 0.86} 0 0 0 ${-ix * 2} 0 Z`} fill={m.shade} />
      <path d={`M${cx - rx + 6} ${cy - 18} A${rx - 3} ${ry - 3} 0 0 1 ${cx - 8} ${cy - ry + 3}`} fill="none" stroke={m.hi} strokeWidth={Math.max(2.5, t * 0.4)} strokeLinecap="round" />
    </g>
  );
}

function Chain({ d, m, w = 2.6, link = 5 }: { d: string; m: M; w?: number; link?: number }) {
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke={m.shade} strokeWidth={w + 1.4} />
      <path d={d} stroke={m.hi} strokeWidth={w * 0.6} strokeDasharray={`${link * 0.5} ${link}`} />
    </g>
  );
}

function Hoop({ cx, cy, r, m, w = 7, shape = "round" }: { cx: number; cy: number; r: number; m: M; w?: number; shape?: "round" | "square" | "drop" }) {
  const d =
    shape === "square"
      ? `M${cx - r} ${cy - r + 6} q0 -6 6 -6 h${r * 2 - 12} q6 0 6 6 v${r * 2 - 12} q0 6 -6 6 h${-r * 2 + 12} q-6 0 -6 -6 Z`
      : shape === "drop"
        ? `M${cx} ${cy - r * 1.25} C${cx + r * 1.15} ${cy - r * 0.2} ${cx + r * 0.95} ${cy + r} ${cx} ${cy + r} C${cx - r * 0.95} ${cy + r} ${cx - r * 1.15} ${cy - r * 0.2} ${cx} ${cy - r * 1.25} Z`
        : `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`;
  return (
    <g fill="none">
      <path d={d} stroke={m.base} strokeWidth={w} strokeLinejoin="round" />
      <path d={d} stroke={m.hi} strokeWidth={w * 0.32} strokeDasharray={`${r * 1.1} ${r * 9}`} strokeLinecap="round" strokeLinejoin="round" />
      <rect x={cx - 2.5} y={(shape === "drop" ? cy - r * 1.25 : cy - r) - 9} width={5} height={10} fill={m.shade} />
    </g>
  );
}

export function JewelDrawing({ kind, stone, material, title, className }: { kind: string; stone: string | null; material: Material; title?: string; className?: string }) {
  const m = metal(material);
  const st = stone ?? "cristal";
  let body: JSX.Element;

  switch (kind) {
    case "anel-liso":
      body = <Band m={m} t={9} />;
      break;
    case "anel-solitario":
      body = (
        <g>
          <Band m={m} t={7} cy={124} />
          <path d="M88 70 L94 56 H106 L112 70 Z" fill={m.shade} />
          <Stone x={100} y={52} r={15} color={st} />
          <path d="M86 46 l4 -6 M114 46 l-4 -6 M86 60 l4 6 M114 60 l-4 6" stroke={m.base} strokeWidth={4} strokeLinecap="round" />
        </g>
      );
      break;
    case "anel-coracao":
      body = (
        <g>
          <Band m={m} t={7} cy={124} />
          <Heart x={100} y={60} s={20} fill={m.base} />
          {stone ? <Heart x={100} y={61} s={13} fill={(STONES[st] ?? STONES.cristal)[0]} /> : <Heart x={100} y={61} s={10} fill="var(--stage)" />}
        </g>
      );
      break;
    case "aparador":
      body = (
        <g>
          <Band m={m} t={8} />
          {Array.from({ length: 11 }, (_, i) => {
            const a = Math.PI + (i + 0.5) * (Math.PI / 11);
            return <circle key={i} cx={100 + Math.cos(a) * 52} cy={118 + Math.sin(a) * 54} r={3.6} fill="#ffffff" stroke={m.shade} strokeWidth={1.2} />;
          })}
        </g>
      );
      break;
    case "colar-ponto":
    case "colar-coracao":
      body = (
        <g>
          <Chain d="M28 20 C34 110 76 146 100 146 C124 146 166 110 172 20" m={m} />
          <circle cx={100} cy={150} r={4} fill={m.shade} />
          {kind === "colar-coracao" ? (
            <g><Heart x={100} y={170} s={17} fill={m.base} /><Heart x={100} y={171} s={11} fill={(STONES[st] ?? STONES.cristal)[0]} /></g>
          ) : (
            <g><circle cx={100} cy={168} r={15} fill={m.base} /><Stone x={100} y={168} r={11} color={st} /></g>
          )}
        </g>
      );
      break;
    case "choker":
    case "corrente":
      body = (
        <g>
          <Chain d="M24 30 C30 120 70 152 100 152 C130 152 170 120 176 30" m={m} w={kind === "corrente" ? 6 : 3} link={kind === "corrente" ? 9 : 5} />
          {kind === "choker" && [70, 100, 130].map((x, i) => (
            <path key={x} d={`M${x - 2} ${148 - Math.abs(i - 1) * 8} h4 v8 h7 v5 h-7 v14 h-4 v-14 h-7 v-5 h7 Z`} fill={m.base} />
          ))}
        </g>
      );
      break;
    case "bracelete":
      body = (
        <g fill="none">
          <path d="M60 64 C24 86 24 148 100 160 C176 148 176 86 140 64" stroke={m.base} strokeWidth={16} strokeLinecap="square" />
          <path d="M52 92 C44 124 66 146 96 150" stroke={m.hi} strokeWidth={4} strokeLinecap="round" />
        </g>
      );
      break;
    case "pulseira":
    case "pulseira-coracao":
    case "pulseira-perolas":
      body = (
        <g>
          <Chain d="M100 52 C170 52 182 150 100 154 C18 150 30 52 100 52" m={m} w={kind === "pulseira" ? 3.4 : 2.6} />
          <rect x={92} y={46} width={16} height={11} fill={m.shade} />
          {kind === "pulseira-coracao" && [[44, 120], [100, 154], [156, 120]].map(([x, y]) => <Heart key={x} x={x} y={y} s={10} fill={m.base} />)}
          {kind === "pulseira-perolas" && [[50, 128], [80, 150], [120, 150], [150, 128]].map(([x, y]) => <Stone key={x} x={x} y={y} r={10} color="perola" />)}
          {kind === "pulseira" && [[64, 140], [100, 154], [136, 140]].map(([x, y]) => <Stone key={x} x={x} y={y} r={8} color={st} />)}
        </g>
      );
      break;
    case "argola":
      body = <g><Hoop cx={66} cy={104} r={34} m={m} /><Hoop cx={138} cy={104} r={34} m={m} /></g>;
      break;
    case "argola-quadrada":
      body = <g><Hoop cx={64} cy={104} r={32} m={m} shape="square" /><Hoop cx={138} cy={104} r={32} m={m} shape="square" /></g>;
      break;
    case "argola-gota":
      body = <g><Hoop cx={66} cy={112} r={30} m={m} shape="drop" /><Hoop cx={136} cy={112} r={30} m={m} shape="drop" /></g>;
      break;
    case "brinco-trio":
      body = (
        <g>
          <Hoop cx={50} cy={110} r={26} m={m} w={6} />
          <Hoop cx={112} cy={110} r={18} m={m} w={6} />
          <Stone x={164} y={104} r={12} color={st} />
        </g>
      );
      break;
    case "brinco-folhas":
      body = (
        <g>
          {[60, 140].map((x) => (
            <g key={x}>
              <path d={`M${x} 40 C${x - 4} 90 ${x + 4} 130 ${x} 170`} stroke={m.shade} strokeWidth={4} fill="none" />
              {[60, 88, 116, 144].map((y, i) => (
                <ellipse key={y} cx={x + (i % 2 ? 13 : -13)} cy={y} rx={13} ry={6} transform={`rotate(${i % 2 ? -30 : 30} ${x + (i % 2 ? 13 : -13)} ${y})`} fill={m.base} />
              ))}
            </g>
          ))}
        </g>
      );
      break;
    default: {
      // tornozeleiras
      const charm =
        kind === "tornozeleira-estrela" ? (
          <path d="M100 150 l6 13 14 1 -11 9 4 14 -13 -8 -12 8 4 -14 -11 -9 14 -1 Z" fill={m.base} />
        ) : kind === "tornozeleira-concha" ? (
          <g><path d="M84 182 C82 158 118 158 116 182 Z" fill={m.base} /><path d="M92 180 L100 162 L108 180" stroke={m.shade} strokeWidth={2.5} fill="none" /></g>
        ) : (
          <Heart x={100} y={168} s={14} fill={m.base} />
        );
      body = (
        <g>
          <Chain d="M100 40 C182 46 186 140 100 148 C14 140 18 46 100 40" m={m} w={2} link={4} />
          <path d="M100 148 v4" stroke={m.shade} strokeWidth={2} />
          {charm}
        </g>
      );
    }
  }

  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={title ?? "Desenho da peça"}>
      {body}
    </svg>
  );
}
