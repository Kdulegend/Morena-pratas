import type { Product } from "@/lib/catalog";
import { JewelDrawing } from "./JewelDrawing";

/** Foto da planilha quando existir; senão, o desenho da peça sobre o campo do palco. */
export function ProductArt({ product, className = "", eager = false }: { product: Product; className?: string; eager?: boolean }) {
  if (product.photo) {
    return (
      <img
        src={product.photo}
        alt={product.name}
        width={800}
        height={800}
        loading={eager ? "eager" : "lazy"}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }
  return (
    <div className={`flex h-full w-full items-center justify-center bg-stage ${className}`}>
      <JewelDrawing kind={product.drawing.kind} stone={product.drawing.stone} material={product.material} title={product.name} className="h-[72%] w-[72%]" />
    </div>
  );
}
