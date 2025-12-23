import React, { useEffect } from "react";
import type { Project } from "../types";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import api from "@/configs/axios";
import { toast } from "sonner";

const Community = () => {
  const [loading, setLoading] = React.useState(true);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/project/published");
      setProjects(data.projects);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      toast.error(error.response.data.message || error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <>
      <div className="px-4 md:px-16 lg:px-24 xl:px-32">
        {loading ? (
          <div className="flex items-center justify-center h-[80vh]">
            <Loader2Icon className="animate-spin size-7 text-indigo-200" />
          </div>
        ) : projects.length > 0 ? (
          <div className="py-10 min-h-[80vh]">
            <div className="flex items-center justify-between mb-12">
              <h1 className="text-2xl font-medium text-white">
                Published Projects
              </h1>
            </div>
            <div className="flex flex-wrap gap-3.5">
              {projects.map((project) => (
                <Link
                  to={`/view/${project.id}`}
                  target="_blank"
                  className=" w-72 rounded max-sm:mx-auto cursor-pointer bg-gray-900/60 border hover:shadow-indigo-700/30 hover:border-indigo-800/80 transition-all duration-300"
                  key={project.id}
                >
                  <div
                    className="relative w-full h-40 bg-gray-900
                   overflow-hidden border-b border-gray-800"
                  >
                    {project.current_code ? (
                      <iframe
                        srcDoc={project.current_code}
                        className="absolute top-0 left-0 w-300 h-200 origin-top-left pointer-events-none"
                        sandbox="allow-scripts allow-same-origin"
                        style={{ transform: "scale(0.25" }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <p>No Preview</p>
                      </div>
                    )}
                  </div>
                  {/* content  */}
                  <div className="p-4 text-white bg-linear-180 from-transparent group-hover:from-indigo-950 to-transparent transition-colors">
                    <div className="flex items-start justify-between">
                      <h2 className="text-lg font-medium line-clamp-2">
                        {project.name}
                      </h2>
                      <button className="px-2 py-0.5 mt-1 ml-2 text-xs bg-gray-800 border border-gray-700 rounded-full">
                        Website
                      </button>
                    </div>
                    <p className="text-gray-800 mt-1 text-sm line-clamp-2">
                      {project.initial_prompt}
                    </p>
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex justify-between items-center mt-6"
                    >
                      <span className="text-xs to-gray-500">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>

                      <div className="flex gap-3 text-white text-sm">
                        <button
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-md transition-colors
                          flex items-center gap-3"
                        >
                          <span className="bg-gray-200 size-4 rounded-full text-black font-semibold flex items-center justify-center">
                            {project.user?.name?.slice(0, 1)}
                          </span>
                          {project.user?.name}
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[80vh]">
            <h1 className="text-2xl font-medium text-white">
              No project published !
            </h1>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-white px-3 sm:px-6 py-1 sm:py-2 rounded bg-linear-to-br from-indigo-500 to-indigo-600 hover:opacity-90
                 active:scale-95 transition-all mt-2"
            >
              {" "}
              <PlusIcon size={18} />
              Create New
            </button>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Community;
