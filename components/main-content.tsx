"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, ChevronDown, Download, List, Box } from "lucide-react";
import { ModelViewer } from "@/components/model-viewer";
import { useToast } from "@/components/ui/toast";
import { RightSidebar } from "@/components/right-sidebar";

// Helper function to proxy URLs through our API
function getProxyUrl(url: string) {
  if (!url) return "";
  // Encode the URL to handle special characters
  const encodedUrl = encodeURIComponent(url);
  return `/api/proxy/model?url=${encodedUrl}`;
}

interface Task {
  id: string;
  mode: "preview" | "refine";
  prompt: string;
  status: string;
  created_at: number;
  progress: number;
  model_urls?: {
    glb?: string;
    fbx?: string;
    obj?: string;
    usdz?: string;
    mtl?: string;
  };
  thumbnail_url: string;
  texture_urls?: Array<{
    base_color: string;
    metallic: string;
    roughness: string;
    normal: string;
  }> | null;
}

export function MainContent() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTexturing, setIsTexturing] = useState(false);
  const [recordsPerPage] = useState(12);
  const { addToast } = useToast();

  // Add state for current view
  const [currentView, setCurrentView] = useState<string>("model");

  // Update the state to track which task is being textured
  const [texturingTaskId, setTexturingTaskId] = useState<string | null>(null);

  // Add state to track tasks in progress
  const [inProgressTasks, setInProgressTasks] = useState<Task[]>([]);

  // Add a new state for model loading
  const [isModelLoading, setIsModelLoading] = useState(false);

  // Mobile view state (list or model)
  const [mobileView, setMobileView] = useState<"list" | "model">("list");

  // useRef to hold the latest values of inProgressTasks and selectedTask
  const inProgressTasksRef = useRef(inProgressTasks);
  const selectedTaskRef = useRef(selectedTask);

  // Close mobile download dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById("mobile-download-dropdown");
      if (
        dropdown &&
        !dropdown.contains(event.target as Node) &&
        !(event.target as Element)
          .closest("button")
          ?.contains(document.querySelector(".lucide-download"))
      ) {
        dropdown.classList.add("hidden");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    inProgressTasksRef.current = inProgressTasks;
  }, [inProgressTasks]);

  useEffect(() => {
    selectedTaskRef.current = selectedTask;
  }, [selectedTask]);

  // Fetch all tasks at once
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/text-to-3d");
      const data = await response.json();

      if (Array.isArray(data)) {
        // Sort tasks by creation date (newest first)
        const sortedTasks = data.sort((a, b) => b.created_at - a.created_at);

        // Separate in-progress tasks
        const inProgress = sortedTasks.filter(
          (task) => task.status === "PENDING" || task.status === "IN_PROGRESS"
        );

        setInProgressTasks(inProgress);

        // Set all tasks
        setAllTasks(sortedTasks);

        // Select the first task by default if none is selected
        if (!selectedTask && sortedTasks.length > 0) {
          setSelectedTask(sortedTasks[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      addToast({
        type: "error",
        title: "Error",
        description: "Failed to load models. Please try again.",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedTask, addToast]);

  // Poll for task updates
  useEffect(() => {
    fetchTasks();

    // Set up polling for all in-progress tasks
    const pollInterval = setInterval(() => {
      // Only poll if there are in-progress tasks
      if (inProgressTasksRef.current.length > 0) {
        fetchTasks();
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [fetchTasks]);

  // Update the polling mechanism to handle errors better and add exponential backoff
  useEffect(() => {
    // Set up event listener for new tasks
    const handleTaskCreated = (event: CustomEvent) => {
      const { taskId, mode, previewTaskId } = event.detail;

      // If this is a refine task, we should mark the preview task as being textured
      if (mode === "refine" && previewTaskId) {
        setTexturingTaskId(previewTaskId);
      }

      // Immediately fetch the new task to add it to the list
      const fetchNewTask = async () => {
        try {
          const response = await fetch(`/api/text-to-3d/${taskId}`);

          if (!response.ok) {
            console.error("Error fetching new task:", response.statusText);
            return;
          }

          const taskData = await response.json();

          if (taskData && taskData.id) {
            // Add the new task to the list
            setAllTasks((prev) => {
              // Check if task already exists
              const exists = prev.some((task) => task.id === taskData.id);
              if (exists) {
                // Update the existing task
                return prev.map((task) =>
                  task.id === taskData.id ? taskData : task
                );
              } else {
                // Add the new task
                return [taskData, ...prev];
              }
            });

            // Add to in-progress tasks
            if (
              taskData.status === "PENDING" ||
              taskData.status === "IN_PROGRESS"
            ) {
              setInProgressTasks((prev) => {
                // Check if task already exists
                const exists = prev.some((task) => task.id === taskData.id);
                if (exists) {
                  // Update the existing task
                  return prev.map((task) =>
                    task.id === taskData.id ? taskData : task
                  );
                } else {
                  // Add the new task
                  return [taskData, ...prev];
                }
              });
            }

            // Select the new task
            setSelectedTask(taskData);

            // On mobile, switch to model view when a new task is created
            if (window.innerWidth < 768) {
              setMobileView("model");
            }
          }
        } catch (error) {
          console.error("Error fetching new task:", error);
        }
      };

      fetchNewTask();

      // Set up polling to check task status with exponential backoff
      let attempts = 0;
      const maxAttempts = 20; // Maximum number of polling attempts
      const baseDelay = 3000; // Start with 3 seconds
      const maxDelay = 15000; // Maximum delay of 15 seconds

      const pollTaskStatus = async () => {
        try {
          const response = await fetch(`/api/text-to-3d/${taskId}`);

          if (!response.ok) {
            console.error("Error polling task status:", response.statusText);
            attempts++;
            return;
          }

          const data = await response.json();

          // Reset attempts on successful response
          attempts = 0;

          // Update the task in the lists
          if (data && data.id) {
            setAllTasks((prev) =>
              prev.map((task) => (task.id === data.id ? data : task))
            );

            // Update in-progress tasks
            if (data.status === "PENDING" || data.status === "IN_PROGRESS") {
              setInProgressTasks((prev) => {
                const exists = prev.some((task) => task.id === data.id);
                if (exists) {
                  return prev.map((task) =>
                    task.id === data.id ? data : task
                  );
                } else {
                  return [data, ...prev];
                }
              });
            } else {
              // Remove from in-progress if completed
              setInProgressTasks((prev) =>
                prev.filter((task) => task.id !== data.id)
              );
            }

            // Update selected task if it's the one we're looking at
            if (
              selectedTaskRef.current &&
              selectedTaskRef.current.id === data.id
            ) {
              setSelectedTask(data);
            }
          }

          if (data.status === "SUCCEEDED" || data.status === "FAILED") {
            // Task completed, refresh the list
            fetchTasks();

            if (mode === "refine") {
              setTexturingTaskId(null);
            }

            // Clear the polling interval
            clearTimeout(pollingTimeoutId);
            return;
          }
        } catch (error) {
          console.error("Error polling task status:", error);
          attempts++;
        }

        // If we've reached max attempts, stop polling
        if (attempts >= maxAttempts) {
          console.warn("Max polling attempts reached, stopping polling");
          return;
        }

        // Calculate next delay with exponential backoff
        const delay = Math.min(baseDelay * Math.pow(1.5, attempts), maxDelay);

        // Schedule next poll with calculated delay
        pollingTimeoutId = setTimeout(pollTaskStatus, delay);
      };

      // Start polling
      let pollingTimeoutId = setTimeout(pollTaskStatus, baseDelay);

      // Clean up the timeout after 5 minutes (300000ms) to prevent infinite polling
      const maxTimeout = setTimeout(() => {
        clearTimeout(pollingTimeoutId);
      }, 300000);

      return () => {
        clearTimeout(pollingTimeoutId);
        clearTimeout(maxTimeout);
      };
    };

    window.addEventListener("taskCreated" as any, handleTaskCreated);
    return () =>
      window.removeEventListener("taskCreated" as any, handleTaskCreated);
  }, [fetchTasks]);

  const handleTexture = async (previewTask: Task) => {
    try {
      setIsTexturing(true);
      setTexturingTaskId(previewTask.id);

      const response = await fetch("/api/text-to-3d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "refine",
          preview_task_id: previewTask.id,
          enable_pbr: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start texturing");
      }

      addToast({
        type: "success",
        title: "Texturing Started",
        description: "Your model is being textured. This may take a minute.",
        duration: 5000,
      });

      // Dispatch custom event for task created
      const event = new CustomEvent("taskCreated", {
        detail: {
          taskId: data.result,
          mode: "refine",
          previewTaskId: previewTask.id,
        },
      });
      window.dispatchEvent(event);

      // On mobile, switch to model view when texturing starts
      if (window.innerWidth < 768) {
        setMobileView("model");
      }
    } catch (error) {
      console.error("Error starting texture:", error);
      addToast({
        type: "error",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to start texturing",
        duration: 3000,
      });
    } finally {
      setIsTexturing(false);
    }
  };

  const handleDownload = (url: string, format: string) => {
    if (!url) return;

    try {
      const proxyUrl = getProxyUrl(url);
      const a = document.createElement("a");
      a.href = proxyUrl;
      a.download = `model.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      addToast({
        type: "success",
        title: "Download Started",
        description: `Your model is being downloaded in ${format.toUpperCase()} format.`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error downloading model:", error);
      addToast({
        type: "error",
        title: "Download Failed",
        description:
          "There was a problem downloading the model. Please try again.",
        duration: 3000,
      });
    }
  };

  // Filter tasks for the Models section (preview mode)
  const modelTasks = allTasks.filter(
    (task) => task.mode === "preview" && task.status === "SUCCEEDED"
  );

  // Filter tasks for the Textured section (refine mode)
  const texturedTasks = allTasks.filter(
    (task) => task.mode === "refine" && task.status === "SUCCEEDED"
  );

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
      {/* Mobile view toggle - only visible on small screens */}
      <div className="md:hidden sticky top-0 z-10 flex justify-center p-3 bg-[#262626] border-b border-[#3f3f3f] shadow-md">
        <div className="flex bg-[#181818] rounded-lg p-1 w-full max-w-xs">
          <button
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mobileView === "list"
                ? "bg-[#3f3f3f] text-white"
                : "text-[#696969] hover:text-white"
            }`}
            onClick={() => setMobileView("list")}
          >
            <div className="flex items-center justify-center">
              <List className="w-4 h-4 mr-2" />
              Task List
            </div>
          </button>
          <button
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mobileView === "model"
                ? "bg-[#3f3f3f] text-white"
                : "text-[#696969] hover:text-white"
            }`}
            onClick={() => setMobileView("model")}
          >
            <div className="flex items-center justify-center">
              <Box className="w-4 h-4 mr-2" />
              3D Model
            </div>
          </button>
        </div>
      </div>

      {/* Left part - Task Listings */}
      <div
        className={`w-full md:w-1/2 bg-[#1e1e1e] relative flex flex-col h-[calc(100vh-160px)] md:h-auto overflow-hidden ${
          mobileView === "model" ? "hidden md:block" : "block"
        }`}
      >
        {/* Top bar - UPDATED FOR BETTER RESPONSIVENESS */}
        <div className="p-4 border-b border-[#262626] flex flex-col sm:flex-row justify-between gap-3">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#505050]" />
            <input
              type="text"
              className="pl-10 pr-4 py-2 bg-[#262626] text-white rounded-md w-full sm:w-64"
              placeholder="Search my generations"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button className="flex items-center px-3 py-1.5 bg-[#262626] text-white text-sm rounded-md">
              <span className="whitespace-nowrap">Filters</span>
              <ChevronDown className="ml-1 h-4 w-4" />
            </button>
            <button className="flex items-center px-3 py-1.5 bg-[#262626] text-white text-sm rounded-md">
              <span className="whitespace-nowrap">Date created</span>
              <ChevronDown className="ml-1 h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          {isLoading && allTasks.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-t-[#d1afe4] border-[#3f3f3f] rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* In Progress Section */}
              {inProgressTasks.length > 0 && (
                <div>
                  <h2 className="text-white text-sm font-semibold mb-4">
                    In Progress
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {inProgressTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`bg-[#262626] rounded-lg overflow-hidden transition-all hover:scale-[1.02] cursor-pointer ${
                          selectedTask?.id === task.id
                            ? "ring-2 ring-[#d1afe4]"
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedTask(task);
                          setCurrentView("model"); // Reset view when selecting a new task
                          if (window.innerWidth < 768) {
                            setMobileView("model"); // Switch to model view on mobile when selecting a task
                          }
                        }}
                      >
                        <div className="h-32 bg-[#181818] flex items-center justify-center relative">
                          {task.thumbnail_url ? (
                            <img
                              src={task.thumbnail_url || "/placeholder.svg"}
                              alt={task.prompt}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center">
                              <div className="w-10 h-10 border-2 border-t-[#d1afe4] border-[#3f3f3f] rounded-full animate-spin mb-2"></div>
                              <div className="text-white text-sm">
                                {task.progress || 0}% Complete
                              </div>
                            </div>
                          )}
                          {/* Progress bar overlay */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#3f3f3f]">
                            <div
                              className="h-full bg-[#d1afe4]"
                              style={{ width: `${task.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-white text-sm truncate mb-2">
                            {task.prompt}
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="text-[#696969] text-xs">
                              {new Date(task.created_at).toLocaleDateString()}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-400">
                              {task.mode === "preview"
                                ? "Generating"
                                : "Texturing"}{" "}
                              ({task.progress || 0}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Models Section */}
              {modelTasks.length > 0 && (
                <div>
                  <h2 className="text-white text-sm font-semibold mb-4">
                    Models
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {modelTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`bg-[#262626] rounded-lg overflow-hidden transition-all hover:scale-[1.02] cursor-pointer ${
                          selectedTask?.id === task.id
                            ? "ring-2 ring-[#d1afe4]"
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedTask(task);
                          setCurrentView("model"); // Reset view when selecting a new task
                          if (window.innerWidth < 768) {
                            setMobileView("model"); // Switch to model view on mobile when selecting a task
                          }
                        }}
                      >
                        <div className="h-32 bg-[#181818] flex items-center justify-center">
                          {task.thumbnail_url ? (
                            <img
                              src={task.thumbnail_url || "/placeholder.svg"}
                              alt={task.prompt}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-[#505050]">No preview</div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-white text-sm truncate mb-2">
                            {task.prompt}
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="text-[#696969] text-xs">
                              {new Date(task.created_at).toLocaleDateString()}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTexture(task);
                              }}
                              className="p-2 bg-[#d1afe4] text-white rounded-md disabled:opacity-50"
                              disabled={
                                isTexturing || texturingTaskId === task.id
                              }
                            >
                              {texturingTaskId === task.id
                                ? "Texturing..."
                                : "Texture"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Textured Models Section */}
              {texturedTasks.length > 0 && (
                <div>
                  <h2 className="text-white text-sm font-semibold mb-4">
                    Textured
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {texturedTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`bg-[#262626] rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${
                          selectedTask?.id === task.id
                            ? "ring-2 ring-[#d1afe4]"
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedTask(task);
                          setCurrentView("model"); // Reset view when selecting a new task
                          if (window.innerWidth < 768) {
                            setMobileView("model"); // Switch to model view on mobile when selecting a task
                          }
                        }}
                      >
                        <div className="h-32 bg-[#181818] flex items-center justify-center">
                          {task.thumbnail_url ? (
                            <img
                              src={task.thumbnail_url || "/placeholder.svg"}
                              alt={task.prompt}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-[#505050]">No preview</div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-white text-sm truncate mb-2">
                            {task.prompt}
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="text-[#696969] text-xs">
                              {new Date(task.created_at).toLocaleDateString()}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/30 text-green-400">
                              Textured
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {allTasks.length === 0 && (
                <div className="flex items-center justify-center h-64">
                  <p className="text-[#505050]">No generations yet</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom pagination - UPDATED FOR BETTER RESPONSIVENESS */}
        <div className="p-4 border-t border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-start">
            <div className="relative">
              <button className="flex items-center space-x-1 text-[#505050] text-sm">
                <span>{recordsPerPage}</span>
                <ChevronDown className="h-4 w-4 text-[#505050]" />
              </button>
            </div>
            <span className="text-[#505050] text-sm">Records per page</span>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-end">
            <span className="text-[#505050] text-sm">1 of 1</span>
            <div className="flex space-x-1">
              <button
                className="p-1 text-[#505050] disabled:opacity-50"
                disabled
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 4L5 8L9 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
              <button
                className="p-1 text-[#505050] disabled:opacity-50"
                disabled
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 4L6 8L10 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
              <button
                className="p-1 text-[#505050] disabled:opacity-50"
                disabled
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 4L10 8L6 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
              <button
                className="p-1 text-[#505050] disabled:opacity-50"
                disabled
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7 4L11 8L7 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right part - Model Viewer */}
      <div
        className={`w-full md:w-1/2 bg-[#181818] relative h-[calc(100vh-160px)] md:h-auto ${
          mobileView === "list" ? "hidden md:block" : "block"
        }`}
      >
        {/* Model viewer */}
        <div className="absolute inset-0">
          <ModelViewer
            modelUrl={selectedTask?.model_urls?.glb}
            thumbnailUrl={selectedTask?.thumbnail_url}
            status={selectedTask?.status}
            progress={selectedTask?.progress}
            textureUrls={selectedTask?.texture_urls}
            currentView={currentView}
            onLoadStart={() => setIsModelLoading(true)}
            onLoadEnd={() => setIsModelLoading(false)}
          />
        </div>

        {/* Download options */}
        {selectedTask?.status === "SUCCEEDED" && selectedTask?.model_urls && (
          <div className="absolute bottom-4 right-4 flex flex-wrap gap-2 justify-end">
            <div className="md:flex flex-wrap gap-2 hidden">
              {selectedTask.model_urls.glb && (
                <button
                  className="px-3 py-1.5 bg-[#262626] text-white text-sm rounded-md flex items-center hover:bg-[#3f3f3f]"
                  onClick={() =>
                    handleDownload(selectedTask.model_urls.glb!, "glb")
                  }
                >
                  <Download className="h-4 w-4 mr-1" />
                  GLB
                </button>
              )}
              {selectedTask.model_urls.fbx && (
                <button
                  className="px-3 py-1.5 bg-[#262626] text-white text-sm rounded-md flex items-center hover:bg-[#3f3f3f]"
                  onClick={() =>
                    handleDownload(selectedTask.model_urls.fbx!, "fbx")
                  }
                >
                  <Download className="h-4 w-4 mr-1" />
                  FBX
                </button>
              )}
              {selectedTask.model_urls.obj && (
                <button
                  className="px-3 py-1.5 bg-[#262626] text-white text-sm rounded-md flex items-center hover:bg-[#3f3f3f]"
                  onClick={() =>
                    handleDownload(selectedTask.model_urls.obj!, "obj")
                  }
                >
                  <Download className="h-4 w-4 mr-1" />
                  OBJ
                </button>
              )}
            </div>

            {/* Mobile download dropdown */}
            <div className="md:hidden">
              <button
                className="px-3 py-1.5 bg-[#262626] text-white text-sm rounded-md flex items-center hover:bg-[#3f3f3f]"
                onClick={() => {
                  const dropdown = document.getElementById(
                    'mobile-download-dropdown")wn'
                  );
                  if (dropdown) {
                    dropdown.classList.toggle("hidden");
                  }
                }}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </button>
              <div
                id="mobile-download-dropdown"
                className="hidden absolute bottom-12 right-0 bg-[#262626] rounded-md shadow-lg p-2 flex flex-col gap-2 min-w-[120px]"
              >
                {selectedTask.model_urls.glb && (
                  <button
                    className="px-3 py-1.5 text-white text-sm rounded-md flex items-center hover:bg-[#3f3f3f]"
                    onClick={() => {
                      handleDownload(selectedTask.model_urls.glb!, "glb");
                      document
                        .getElementById("mobile-download-dropdown")
                        ?.classList.add("hidden");
                    }}
                  >
                    GLB Format
                  </button>
                )}
                {selectedTask.model_urls.fbx && (
                  <button
                    className="px-3 py-1.5 text-white text-sm rounded-md flex items-center hover:bg-[#3f3f3f]"
                    onClick={() => {
                      handleDownload(selectedTask.model_urls.fbx!, "fbx");
                      document
                        .getElementById("mobile-download-dropdown")
                        ?.classList.add("hidden");
                    }}
                  >
                    FBX Format
                  </button>
                )}
                {selectedTask.model_urls.obj && (
                  <button
                    className="px-3 py-1.5 text-white text-sm rounded-md flex items-center hover:bg-[#3f3f3f]"
                    onClick={() => {
                      handleDownload(selectedTask.model_urls.obj!, "obj");
                      document
                        .getElementById("mobile-download-dropdown")
                        ?.classList.add("hidden");
                    }}
                  >
                    OBJ Format
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3D Grid Floor */}
        {!selectedTask && (
          <div className="absolute bottom-0 left-0 right-0 h-[40%] pointer-events-none">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Component%201-AQqa22FnHRM7e6e4wBTLMPhoT1eYGD.png"
              alt="3D Grid"
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <RightSidebar
        selectedTask={selectedTask}
        onViewChange={setCurrentView}
        currentView={currentView}
        className="hidden md:flex"
      />

      {/* Mobile floating action button to switch views */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            const newView = mobileView === "list" ? "model" : "list";
            setMobileView(newView);
          }}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-[#d1afe4] text-white shadow-lg hover:bg-[#cc81f4] transition-colors"
          aria-label={`Switch to ${
            mobileView === "list" ? "model" : "list"
          } view`}
        >
          {mobileView === "list" ? (
            <Box className="w-6 h-6" />
          ) : (
            <List className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
}
