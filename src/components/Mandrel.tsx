import type { Product } from "@/lib/catalog";
import { metal } from "./JewelDrawing";

// O tribulê (medidor cônico de joalheiro), gravado de 10 a 26.
// Os anéis escolhidos descem e param no aro da cliente, empilhados.

const TOP = 70, BOTTOM = 720, W_TOP = 40, W_BOTTOM = 132;
const ARO_MIN = 10, ARO_MAX = 26;
const yForAro = (a: number) => 120 + ((a - ARO_MIN) / (ARO_MAX - ARO_MIN)) * 560;
const widthAt = (y: number) => W_TOP + ((W_BOTTOM - W_TOP) * (y - TOP)) / (BOTTOM - TOP);
const CX = 210;

const STONE: Record<string, string> = { vermelho: "#c62a3b", verde: "#2b8a57", azul: "#3a68bd", rosa: "#e07fa6", cristal: "#ffffff", perola: "#efe6d6" };

function bandHeight(p: Product) {
  if (p.drawing.kind === "aparador") return 18;
  if (p.drawing.kind === "anel-liso") return p.name.toLowerCase().includes("chapa") ? 30 : p.name.includes("1mm") ? 11 : 17;
  return 15;
}

export function Mandrel({ aro, rings, className }: { aro: number; rings: Product[]; className?: string }) {
  // empilha para cima a partir do aro escolhido
  let cursor = yForAro(aro);
  const placed = rings.map((p) => {
    const h = bandHeight(p);
    const y = cursor;
    cursor -= h + 3;
    return { p, y, h };
  });

  const rod = `M${CX - W_TOP / 2} ${TOP} L${CX + W_TOP / 2} ${TOP} L${CX + W_BOTTOM / 2} ${BOTTOM} L${CX - W_BOTTOM / 2} ${BOTTOM} Z`;
  const ticks = [];
  for (let a = ARO_MIN; a <= ARO_MAX; a++) {
    const y = yForAro(a);
    const even = a % 2 === 0;
    ticks.push(
      <g key={a}>
        <rect x={CX - widthAt(y) / 2 - (even ? 22 : 12)} y={y - 1} width={even ? 16 : 8} height={2} fill={a === aro ? "var(--ink)" : "var(--muted)"} />
        {even && (
          <text x={CX - widthAt(y) / 2 - 30} y={y + 5} textAnchor="end" fontSize={a === aro ? 22 : 16} fontWeight={a === aro ? 600 : 400} fill={a === aro ? "var(--ink)" : "var(--muted)"} fontFamily="Archivo, sans-serif">
            {a}
          </text>
        )}
      </g>,
    );
  }

  const ringShape = (y: number, h: number, half: "back" | "front", fill: string) => {
    const rx = widthAt(y) / 2 + 5;
    const ry = rx * 0.3;
    if (half === "back") {
      return <path d={`M${CX - rx} ${y} A${rx} ${ry} 0 0 1 ${CX + rx} ${y} L${CX + rx} ${y - h} A${rx} ${ry} 0 0 0 ${CX - rx} ${y - h} Z`} fill={fill} />;
    }
    return <path d={`M${CX - rx} ${y - h} A${rx} ${ry} 0 0 0 ${CX + rx} ${y - h} L${CX + rx} ${y} A${rx} ${ry} 0 0 1 ${CX - rx} ${y} Z`} fill={fill} />;
  };

  return (
    <svg viewBox="0 0 360 760" className={className} role="img" aria-label={`Tribulê de joalheiro marcando o aro ${aro}${rings.length ? ` com ${rings.length} ${rings.length === 1 ? "anel" : "anéis"}` : ""}`}>
      {/* metades de trás dos anéis */}
      {placed.map(({ p, y, h }) => <g key={`b${p.id}`}>{ringShape(y, h, "back", metal(p.material).deep)}</g>)}
      {/* o tribulê */}
      <path d={rod} fill="var(--silver-3)" />
      <path d={`M${CX - W_TOP / 2 + 5} ${TOP} L${CX - W_TOP / 2 + 11} ${TOP} L${CX - W_BOTTOM / 2 + 26} ${BOTTOM} L${CX - W_BOTTOM / 2 + 12} ${BOTTOM} Z`} fill="var(--silver-2)" />
      <path d={`M${CX + W_TOP / 2 - 4} ${TOP} L${CX + W_TOP / 2} ${TOP} L${CX + W_BOTTOM / 2} ${BOTTOM} L${CX + W_BOTTOM / 2 - 16} ${BOTTOM} Z`} fill="var(--silver-4)" />
      <rect x={CX - 9} y={TOP - 40} width={18} height={42} fill="var(--silver-4)" />
      <rect x={CX - W_BOTTOM / 2 - 8} y={BOTTOM} width={W_BOTTOM + 16} height={22} fill="#5c3a28" />
      {ticks}
      {/* metades da frente, com pedra ou fileira de zircônias */}
      {placed.map(({ p, y, h }) => {
        const m = metal(p.material);
        const rx = widthAt(y) / 2 + 5;
        const ry = rx * 0.3;
        const front = y + ry - h / 2;
        return (
          <g key={`f${p.id}`} className="ring-in">
            {ringShape(y, h, "front", m.base)}
            <path d={`M${CX - rx + 3} ${y - h + 2} A${rx} ${ry} 0 0 0 ${CX} ${y - h + ry + 2}`} fill="none" stroke={m.hi} strokeWidth={2.5} strokeLinecap="round" />
            {p.drawing.kind === "aparador" &&
              [-0.7, -0.35, 0, 0.35, 0.7].map((t) => (
                <circle key={t} cx={CX + t * rx} cy={front + ry * (1 - Math.sqrt(1 - t * t)) * -1 + 1} r={3.2} fill="#fff" />
              ))}
            {(p.drawing.kind === "anel-solitario" || p.drawing.kind === "anel-coracao") && (
              <g>
                <rect x={CX - 7} y={front - 14} width={14} height={10} fill={m.shade} />
                <circle cx={CX} cy={front - 18} r={10} fill={STONE[p.drawing.stone ?? "cristal"] ?? "#fff"} />
                <circle cx={CX - 3} cy={front - 21} r={3} fill="#ffffff" opacity={0.7} />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
