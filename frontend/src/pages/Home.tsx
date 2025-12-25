import api from "@/configs/axios";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Home = () => {
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      toast.error("Please login to create a website");
      return;
    }

    if (!input.trim()) {
      toast.error("Describe what you want to build");
      return;
    }

    if (input.length < 20) {
      toast.error("Describe your website in more detail");
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post("/api/user/project", {
        initial_prompt: input,
      });
      navigate(`/project/${data?.projectId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#0B0D12] text-gray-200 flex flex-col items-center px-4 pb-24 font-poppins">
      <div className="mt-24 flex items-center gap-2 border border-gray-700 rounded-full px-4 py-1 text-xs">
        <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full">
          NEW
        </span>
        <span>Build websites free with 20 starter credits</span>
      </div>

      <h1 className="text-center text-4xl md:text-6xl font-semibold mt-6 max-w-4xl leading-tight">
        Build websites instantly with <br />
        <span className="text-indigo-400">AI-powered blocks</span>
      </h1>

      <p className="text-center text-gray-400 text-base md:text-lg max-w-xl mt-4">
        Siteblocks helps you turn ideas into fully functional websites in
        minutes. No design skills, no coding — just describe and launch.
      </p>

      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-2xl mt-12 bg-[#121621] border border-gray-700 rounded-xl p-4 focus-within:ring-2 ring-indigo-500 transition"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          className="w-full resize-none bg-transparent outline-none text-gray-200 placeholder:text-gray-500"
          placeholder="Describe the website you want (e.g. landing page for a SaaS, portfolio, blog...)"
        />

        <div className="flex justify-end mt-4">
          <button
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition px-5 py-2 rounded-md text-sm font-medium"
          >
            {loading ? (
              <>
                Creating
                <Loader2 className="animate-spin size-4" />
              </>
            ) : (
              "Create with AI"
            )}
          </button>
        </div>
      </form>
    </section>
  );
};

export default Home;
