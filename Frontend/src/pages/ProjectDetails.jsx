import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Reveal from "../components/common/Reveal";
import Button from "../components/common/Button";
import api from "../services/api";

export default function ProjectDetails() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`);

      if (res.data.success) {
        setProject(res.data.data.project);
      }

    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Project not found
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}

        <Reveal>
          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-4xl font-bold">{project.name}</h1>
              <p className="text-gray-400 mt-2">
                {project.category}
              </p>
            </div>

            <Button onClick={() => navigate("/dashboard")}>
              Back
            </Button>
          </div>
        </Reveal>

        {/* Project Info */}

        <div className="grid md:grid-cols-2 gap-8">

          {/* Left */}

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">

            <h3 className="text-lg font-bold mb-4">
              Project Details
            </h3>

            <div className="space-y-4">

              <div>
                <p className="text-gray-400 text-sm">Description</p>
                <p>{project.description}</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Status</p>
                <p>{project.status}</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Priority</p>
                <p>{project.priority}</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Deadline</p>
                <p>{new Date(project.deadline).toLocaleDateString()}</p>
              </div>

            </div>

          </div>

          {/* Right */}

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">

            <h3 className="text-lg font-bold mb-4">
              Project Stats
            </h3>

            <div className="space-y-5">

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>

                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Budget</p>
                <p className="text-lg font-bold">
                  {project.currency} {project.budget}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Client</p>
                <p>{project.client?.name}</p>
                <p className="text-sm text-gray-400">
                  {project.client?.email}
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* Team Members */}

        <div className="mt-10 p-6 rounded-2xl bg-white/5 border border-white/10">

          <h3 className="text-lg font-bold mb-6">
            Team Members
          </h3>

          <div className="grid md:grid-cols-3 gap-6">

            {project.teamMembers?.map((member) => (

              <div
                key={member._id}
                className="p-4 rounded-xl bg-white/5"
              >

                <p className="font-medium">
                  {member.user?.name}
                </p>

                <p className="text-sm text-gray-400">
                  {member.role}
                </p>

              </div>

            ))}

          </div>

        </div>

      </div>
    </div>
  );
}