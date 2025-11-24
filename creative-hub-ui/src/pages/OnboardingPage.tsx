import { useNavigate } from "react-router-dom";
const OnboardingPage = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    localStorage.setItem("onboarding_completed", "1");
    navigate("/", { replace: true });  // go to dashboard
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen text-white">
      <h1 className="text-3xl font-bold mb-4">Welcome to Creative Hub 🎉</h1>
      <p className="text-sm opacity-70 mb-10">
        Let’s personalize your experience.
      </p>

      {/* buttons for roles */}
      <button className="px-6 py-3 bg-brand-purple rounded-xl" onClick={handleComplete}>
        Continue to Dashboard
      </button>
    </div>
  );
};

export default OnboardingPage;
