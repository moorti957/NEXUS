// src/components/projects/EnhancedProjectCard.jsx

import { useState } from 'react';
import Button from '../common/Button';
import LivePreviewButton from './LivePreviewButton';
import ManageProgressModal from './ManageProgressModal';
import { useNavigate } from 'react-router-dom';

export default function EnhancedProjectCard({
    project,
    onProgressUpdate
}) {

    const navigate = useNavigate();

    const [
        showProgressModal,
        setShowProgressModal
    ] = useState(false);

    const [
        currentProgress,
        setCurrentProgress
    ] = useState(
        project.progress ??
        project.completionPercentage ??
        0
    );


    const handleProgressUpdated = (newProgress) => {
        setCurrentProgress(newProgress);
        onProgressUpdate?.(
            project._id,
            newProgress
        );
    };


    const statusColors = {
        Planning:
            'bg-purple-500/20 text-purple-400',

        'In Progress':
            'bg-blue-500/20 text-blue-400',

        Review:
            'bg-yellow-500/20 text-yellow-400',

        Testing:
            'bg-orange-500/20 text-orange-400',

        Completed:
            'bg-green-500/20 text-green-400'
    };


    return (

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all group">

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">

                <div className="flex-1">

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold">
                            {project.name}
                        </h3>

                        <span className={`px-3 py-1 rounded-full text-xs ${statusColors[project.status] ||
                            'bg-gray-500/20 text-gray-400'
                            }`}>
                            {project.status}
                        </span>

                    </div>


                    {/* Description */}
                    <p className="text-sm text-gray-400 mb-5">
                        {project.description ||
                            'Project in progress'}
                    </p>



                    {/* Main Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">

                        <div>
                            <span className="text-gray-500">
                                Client
                            </span>

                            <p className="font-medium">
                                {
                                    project.clientName ||
                                    project.client?.name ||
                                    'Freelancer'
                                }
                            </p>
                        </div>


                        <div>
                            <span className="text-gray-500">
                                Budget
                            </span>

                            <p className="font-medium">
                                ${project.budget?.toLocaleString() || '0'}
                            </p>
                        </div>


                        <div>
                            <span className="text-gray-500">
                                Team
                            </span>

                            <p className="font-medium">
                                {
                                    project.teamCount ??
                                    project.assignedTeam?.length ??
                                    project.teamMembers?.length ??
                                    0
                                }
                                members
                            </p>
                        </div>


                        <div>
                            <span className="text-gray-500">
                                Deadline
                            </span>

                            <p className="font-medium">
                                {
                                    project.deadline
                                        ? new Date(
                                            project.deadline
                                        ).toLocaleDateString()
                                        : 'No deadline'
                                }
                            </p>

                        </div>

                    </div>



                    {/* EXTRA DETAILS */}
                    <div className="grid md:grid-cols-3 gap-4 mt-6 text-sm">

                        <div>
                            <span className="text-gray-500">
                                Category
                            </span>

                            <p className="font-medium">
                                {project.category || 'N/A'}
                            </p>
                        </div>


                        <div>
                            <span className="text-gray-500">
                                Project Type
                            </span>

                            <p className="font-medium">
                                {project.projectType || 'N/A'}
                            </p>
                        </div>


                        <div>
                            <span className="text-gray-500">
                                Priority
                            </span>

                            <p className="font-medium">
                                {project.priority || 'High'}
                            </p>
                        </div>


                        <div>
                            <span className="text-gray-500">
                                Payment Status
                            </span>

                            <p className="font-medium">
                                {project.paymentStatus || 'Pending'}
                            </p>
                        </div>


                        <div>
                            <span className="text-gray-500">
                                Currency
                            </span>

                            <p className="font-medium">
                                {project.currency || 'USD'}
                            </p>
                        </div>


                        <div>
                            <span className="text-gray-500">
                                Client Email
                            </span>

                            <p className="font-medium break-all">
                                {project.clientEmail || 'N/A'}
                            </p>
                        </div>

                    </div>



                    {/* TECH STACK */}
                    {
                        project.technologies?.length > 0 && (

                            <div className="mt-5">

                                <h4 className="font-semibold mb-2">
                                    Tech Stack
                                </h4>

                                <div className="flex gap-2 flex-wrap">

                                    {project.technologies.map(
                                        (tech, index) => (

                                            <span
                                                key={index}
                                                className="
px-3 py-1
rounded-full
bg-indigo-500/20
text-indigo-300
text-xs
"
                                            >
                                                {tech}
                                            </span>

                                        ))}

                                </div>
                            </div>

                        )}



                </div>


                {/* Right Side */}
                <div className="flex flex-col items-end gap-4 min-w-[180px]">

                    <div className="w-full">

                        <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>

                            <span className="font-mono">
                                {currentProgress}%
                            </span>
                        </div>


                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="
h-full
bg-gradient-to-r
from-indigo-500
to-purple-600
rounded-full
transition-all
duration-500
"
                                style={{
                                    width: `${Math.min(
                                        100,
                                        Math.max(
                                            0,
                                            currentProgress
                                        )
                                    )
                                        }%`
                                }}
                            />
                        </div>

                    </div>



                    <div className="flex gap-2 flex-wrap w-full">

                        <LivePreviewButton
                            url={project.livePreviewUrl}
                        />


                        <Button
                            variant="glass"
                            size="sm"
                            onClick={() =>
                                setShowProgressModal(true)
                            }
                        >
                            Manage Progress
                        </Button>


                        <Button
                            variant="glass"
                            size="sm"
                            onClick={() =>
                                navigate(
                                    `/projects/${project._id}`
                                )
                            }
                        >
                            View
                        </Button>

                    </div>

                </div>

            </div>


            {
                showProgressModal && (
                    <ManageProgressModal
                        project={project}
                        onClose={() =>
                            setShowProgressModal(false)
                        }
                        onProgressUpdate={
                            handleProgressUpdated
                        }
                    />
                )
            }

        </div>

    );

}