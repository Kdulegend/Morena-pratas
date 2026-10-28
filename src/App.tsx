import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { CartProvider } from "@/lib/cart";
import { AuthProvider } from "@/lib/auth";
import { CartDrawer } from "@/components/CartDrawer";
import Home from "@/pages/Home";

const Shop = lazy(() => import("@/pages/Shop"));
const ProductPage = lazy(() => import("@/pages/Product"));
const Login = lazy(() => import("@/pages/Login"));
const Account = lazy(() => import("@/pages/Account"));
const Return = lazy(() => import("@/pages/Return"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function ScrollTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
    if (pathname === "/") document.title = "Morena Pratas · Joias em prata 925 e banho de ouro";
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <AuthProvider>
        <CartProvider>
          <ScrollTop />
          <Suspense fallback={<div className="min-h-svh" />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/loja" element={<Shop />} />
              <Route path="/loja/:categoria" element={<Shop />} />
              <Route path="/peca/:slug" element={<ProductPage />} />
              <Route path="/entrar" element={<Login />} />
              <Route path="/conta" element={<Account />} />
              <Route path="/pedido/retorno" element={<Return />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <CartDrawer />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
