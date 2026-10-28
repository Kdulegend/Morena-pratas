import { photoUrl, type Product } from "@/lib/catalog";

/** Foto da peça. Sem foto, um campo neutro com o nome: nunca um desenho. */
export function ProductArt({ product, className = "", eager = false, sizes = "(min-width: 1024px) 25vw, 50vw" }: { product: Product; className?: string; eager?: boolean; sizes?: string }) {
  if (!product.photo) {
    return (
      <div className={`flex h-full w-full items-end bg-stage p-4 t-small text-muted ${className}`}>
        Foto em breve
      </div>
    );
  }
  return (
    <img
      src={photoUrl(product.photo)}
      alt={product.name}
      width={900}
      height={900}
      sizes={sizes}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={`h-full w-full bg-stage object-cover ${className}`}
    />
  );
}

/** Foto de seção do site (atmosfera), servida da pasta img. */
export function SectionPhoto({ name, alt, className = "", eager = false, width = 1100, height = 1375 }: { name: string; alt: string; className?: string; eager?: boolean; width?: number; height?: number }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}img/secao-${name}.webp`}
      alt={alt}
      width={width}
      height={height}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={`h-full w-full bg-stage object-cover ${className}`}
    />
  );
}
