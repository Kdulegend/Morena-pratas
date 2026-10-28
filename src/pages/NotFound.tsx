import { Link } from "react-router-dom";
import { Header } from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="wrap min-h-[70svh] pt-[18svh]">
        <h1 className="t-head">Página não encontrada</h1>
        <Link to="/loja" className="btn mt-8">Ir para a loja</Link>
      </main>
    </>
  );
}
