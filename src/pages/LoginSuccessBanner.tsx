import { useEffect, useState } from "react";

const LoginSuccessBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const flag = localStorage.getItem("ch_login_success");
    if (flag === "1") {
      setVisible(true);
      localStorage.removeItem("ch_login_success");

      setTimeout(() => setVisible(false), 4000);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-4 py-2 rounded-xl text-sm shadow-xl">
      Logged in successfully ✓
    </div>
  );
};

export default LoginSuccessBanner;
