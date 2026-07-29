import "../pages/globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import ChatWidget from "../components/ChatWidget";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isAdminPage = router.pathname.startsWith("/admin");

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminPage && <Header />}
      <main className="flex-grow">
        <Component {...pageProps} />
      </main>
      {!isAdminPage && <Footer />}
      {!isAdminPage && <ChatWidget />}
      <Toast />
    </div>
  );
}
