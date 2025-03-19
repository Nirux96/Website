"use client";

import { useState, useEffect } from "react";
import { Info } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { EXAMPLE_PROMPTS, MAX_GENERATIONS, GUIDE_URL } from "@/lib/constants";

export function LeftSidebar() {
  const [promptText, setPromptText] = useState("");
  const [fixedSeed, setFixedSeed] = useState(true);
  const [seedValue, setSeedValue] = useState("42");
  const [polycount, setPolycount] = useState("adaptive");
  const [polycountLevel, setPolycountLevel] = useState("high");
  const [topology, setTopology] = useState("quad");
  const [symmetry, setSymmetry] = useState("auto");
  const [artStyle, setArtStyle] = useState("realistic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [enablePBR, setEnablePBR] = useState(false);
  const { addToast } = useToast();

  // Initialize with default value, will be updated in useEffect
  const [generationsLeft, setGenerationsLeft] = useState(MAX_GENERATIONS);

  // Safely access localStorage after component mounts (client-side only)
  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window !== "undefined") {
      const used = localStorage.getItem("generationsUsed") || "0";
      setGenerationsLeft(MAX_GENERATIONS - Number.parseInt(used));
    }
  }, []);

  // Art style options
  const artStyles = [
    {
      id: "realistic",
      name: "Realistic",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-in7qowGSQsA8EbXkdv705wL4OFsdjw.png",
    },
    {
      id: "sculpture",
      name: "Sculpture",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image%20%281%29-nLpTAVABa12D2PMXyGVFiHHX3hpxsm.png",
    },
    {
      id: "pbr",
      name: "PBR",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image%20%282%29-zbPu8ujVNFE9Pu40Nz4HmdYdybZXmz.png",
    },
  ];

  // Polycount options
  const polycountOptions = [
    { id: "adaptive", name: "Adaptive" },
    { id: "fixed", name: "Fixed" },
  ];

  // Polycount level options
  const polycountLevels = [
    { id: "low", name: "Low" },
    { id: "medium", name: "Medium" },
    { id: "high", name: "High" },
    { id: "ultra", name: "Ultra" },
  ];

  // Topology options
  const topologyOptions = [
    {
      id: "triangle",
      name: "Triangle",
      icon: (isSelected:any) => (
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Component%201%20%281%29-r4c4mOJUj6Fi9oX6SrzqfmdyUwTAY2.png"
          alt="Triangle topology"
          className="mr-1 w-4 h-4"
        />
      ),
    },
    {
      id: "quad",
      name: "Quad",
      icon: (isSelected:any) => (
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Component%201%20%282%29-sW38T0qExAr0YeyhizZNWG8RGh4TNF.png"
          alt="Quad topology"
          className="mr-1 w-4 h-4"
        />
      ),
    },
  ];

  // Symmetry options
  const symmetryOptions = [
    { id: "off", name: "Off" },
    { id: "auto", name: "Auto" },
    { id: "on", name: "On" },
  ];

  // Function to get a random example prompt
  const getRandomExample = () => {
    const randomIndex = Math.floor(Math.random() * EXAMPLE_PROMPTS.length);
    setPromptText(EXAMPLE_PROMPTS[randomIndex]);
  };

  // Calculate target polycount based on level
  const getTargetPolycount = () => {
    switch (polycountLevel) {
      case "low":
        return 5000;
      case "medium":
        return 15000;
      case "high":
        return 30000;
      case "ultra":
        return 50000;
      default:
        return 30000;
    }
  };

  // Replace the handleGenerate function with this version that only creates the preview task
  const handleGenerate = async () => {
    if (generationsLeft <= 0) {
      addToast({
        type: "error",
        title: "Generation Limit Reached",
        description:
          "You have used all your free generations. Please upgrade for more.",
        duration: 5000,
      });
      return;
    }

    if (!promptText.trim()) {
      addToast({
        type: "error",
        title: "Error",
        description: "Please enter a prompt to generate a 3D model.",
        duration: 3000,
      });
      return;
    }

    try {
      setIsGenerating(true);

      // Create preview task
      const previewResponse = await fetch("/api/text-to-3d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "preview",
          prompt: promptText,
          art_style: artStyle,
          seed: fixedSeed ? Number.parseInt(seedValue) : undefined,
          topology: topology,
          target_polycount: getTargetPolycount(),
          symmetry_mode: symmetry,
        }),
      });

      const previewData = await previewResponse.json();

      if (!previewResponse.ok || previewData.error) {
        throw new Error(previewData.error || "Failed to create preview task");
      }

      // Update generations count in localStorage (safely)
      if (typeof window !== "undefined") {
        const usedGenerations =
          Number.parseInt(localStorage.getItem("generationsUsed") || "0") + 1;
        localStorage.setItem("generationsUsed", usedGenerations.toString());
        setGenerationsLeft(MAX_GENERATIONS - usedGenerations);
      }

      // Check if we have a task ID in the response
      if (!previewData.result) {
        throw new Error(
          "No task ID returned. Please check your API key configuration."
        );
      }

      console.log("Preview task created:", previewData.result);

      // Dispatch custom event for main content to listen to
      const event = new CustomEvent("taskCreated", {
        detail: { taskId: previewData.result, mode: "preview" },
      });
      window.dispatchEvent(event);

      addToast({
        type: "success",
        title: "Preview Task Created",
        description: "Preview generation started. This may take a minute.",
        duration: 5000,
      });

      // Close sidebar on mobile after generating
      if (window.innerWidth < 768) {
        // Find the sidebar toggle button and click it
        const sidebarToggle = document.getElementById("sidebar-toggle");
        if (sidebarToggle) {
          sidebarToggle.click();
        }
      }
    } catch (error) {
      console.error("Error generating 3D model:", error);
      addToast({
        type: "error",
        title: "Generation Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        duration: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Update the prompt tools section to show "Coming Soon" tooltips
  const renderPromptTools = () => (
    <div className="flex mt-2 space-x-2 bg-[#262626] p-1.5 rounded-lg w-fit">
      <button
        className="p-1.5 hover:bg-[#3f3f3f] rounded-md transition-colors relative group"
        onClick={() => {
          addToast({
            type: "info",
            title: "Coming Soon",
            description: "This feature will be available soon!",
            duration: 3000,
          });
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M2 4H14M2 8H14M2 12H8" stroke="#dedede" strokeWidth="1.5" />
        </svg>
        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[#3f3f3f] text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Coming Soon
        </span>
      </button>
      <button
        className="p-1.5 hover:bg-[#3f3f3f] rounded-md transition-colors relative group"
        onClick={() => {
          addToast({
            type: "info",
            title: "Coming Soon",
            description: "This feature will be available soon!",
            duration: 3000,
          });
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="2"
            y="2"
            width="12"
            height="12"
            rx="1"
            stroke="#dedede"
            strokeWidth="1.5"
          />
          <circle cx="5.5" cy="5.5" r="1.5" fill="#dedede" />
          <path d="M2 10L5 7L8 10L14 4" stroke="#dedede" strokeWidth="1.5" />
        </svg>
        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[#3f3f3f] text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Coming Soon
        </span>
      </button>
      <button
        className="p-1.5 hover:bg-[#3f3f3f] rounded-md transition-colors relative group"
        onClick={() => {
          addToast({
            type: "info",
            title: "Coming Soon",
            description: "This feature will be available soon!",
            duration: 3000,
          });
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 2L3 5V11L8 14L13 11V5L8 2Z"
            stroke="#dedede"
            strokeWidth="1.5"
          />
        </svg>
        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[#3f3f3f] text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Coming Soon
        </span>
      </button>
    </div>
  );

  return (
    <div className="w-full h-full bg-[#262626] border-r border-[#262626] flex flex-col overflow-hidden">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto md:pb-0">
        <div className="p-4 bg-[#1e1e1e] rounded-md m-4 mb-2">
          <p className="text-white text-sm leading-tight">
            Unleash the power of AI to create characters, objects, and entire
            worlds in 3D instantly. No complex software, no technical
            skills—just imagination.
          </p>
        </div>

        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm">Prompt</span>
            <div className="flex space-x-4">
              <button
                className="flex items-center text-[#6C99F2] text-xs hover:opacity-80"
                onClick={getRandomExample}
              >
                <svg
                  className="mr-1.5 w-4 h-4"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 4H14M2 8H14M2 12H8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                Try an Example
              </button>
              <button
                className="flex items-center text-[#6C99F2] text-xs hover:opacity-80"
                onClick={() => window.open(GUIDE_URL, "_blank")}
              >
                <a
                  href="https://omni3d.gitbook.io/omni3d/how-it-works"
                  target="_blank"
                  className="flex items-center"
                >
                  <svg
                    className="mr-1.5 w-4 h-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 2H12V14H4V2Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                  Guide
                </a>
              </button>
            </div>
          </div>

          <div className="relative mb-4">
            <textarea
              className="w-full h-[176px] bg-[#181818] border border-solid border-[#3F3F3F] text-white text-sm p-3 rounded-xl resize-none"
              placeholder="Describe the object you want to generate. You can use your native language e.g., a cute dog/ein süßer Hund/un chien mignon/一只可爱的狗/かわいい犬/etc."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              disabled={isGenerating}
            ></textarea>
            <div className="absolute bottom-2 right-2 text-[#505050] text-xs">
              {promptText.length}/500
            </div>
            {renderPromptTools()}
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white text-sm">AI Model</span>
              <span className="text-[#696969] text-sm">Omni4</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-white text-sm mb-2">Art Style</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {artStyles.map((style) => (
                <button
                  key={style.id}
                  className={`flex items-center justify-between p-3 ${
                    artStyle === style.id
                      ? "border-[#D1AFE4] border bg-[#262626] !text-[#D1AFE4]  "
                      : "bg-[#181818]"
                  } rounded-[12px] hover:border hover:border-[#D1AFE4]/50`}
                  onClick={() => {
                    setArtStyle(style.id);
                    // Disable PBR for sculpture style
                    if (style.id === "sculpture") {
                      setEnablePBR(false);
                    }
                  }}
                  disabled={isGenerating}
                >
                  <span className="text-white text-sm">{style.name}</span>
                  <div className="w-[60px] h-[60px]  overflow-hidden rounded-md bg-transparent">
                    <img
                      src={style.image || "/placeholder.svg"}
                      width={60}
                      height={60}
                      alt={style.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center text-white text-sm mb-2">
              Target Polycount
              <Info className="ml-1 h-3 w-3 text-[#505050]" />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2 bg-[#181818] rounded-[12px] p-[6px]">
              {polycountOptions.map((option) => (
                <button
                  key={option.id}
                  className={`py-1.5 px-3 ${
                    polycount === option.id
                      ? "bg-[#C5F955]/15 !text-[#D1AFE4] "
                      : "bg-transparent text-white"
                  } text-sm rounded-md`}
                  onClick={() => setPolycount(option.id)}
                  disabled={isGenerating}
                >
                  {option.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 bg-[#181818] rounded-[12px] p-[6px]">
              {polycountLevels.map((level) => (
                <button
                  key={level.id}
                  className={`py-1.5 px-2 ${
                    polycountLevel === level.id
                      ? "bg-[#C5F955]/15 text-[#D1AFE4]"
                      : "bg-transparent text-white"
                  } text-xs rounded-md`}
                  onClick={() => setPolycountLevel(level.id)}
                  disabled={isGenerating}
                >
                  {level.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center text-white text-sm mb-2">
              Topology
              <Info className="ml-1 h-3 w-3 text-[#505050]" />
            </div>
            <div className="grid grid-cols-2 gap-2 bg-[#181818] rounded-[12px] p-[6px]">
              {topologyOptions.map((option) => (
                <button
                  key={option.id}
                  className={`flex items-center justify-center py-1.5 px-3 ${
                    topology === option.id
                      ? "bg-[#C5F955]/15 text-[#D1AFE4]"
                      : "bg-transparent text-white"
                  } text-sm rounded-md`}
                  onClick={() => setTopology(option.id)}
                  disabled={isGenerating}
                >
                  {option.icon(topology === option.id)}
                  {option.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="text-white text-sm mb-2">Symmetry</div>
            <div className="grid grid-cols-3 gap-2 bg-[#181818] rounded-[12px] p-[6px]">
              {symmetryOptions.map((option) => (
                <button
                  key={option.id}
                  className={`py-1.5 px-3 ${
                    symmetry === option.id
                      ? "bg-[#C5F955]/15 text-[#D1AFE4]"
                      : "bg-transparent text-white"
                  } text-sm rounded-md`}
                  onClick={() => setSymmetry(option.id)}
                  disabled={isGenerating}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-white text-sm">
                Use Fixed Seed
                <Info className="ml-1 h-3 w-3 text-[#505050]" />
              </div>
              <button
                className={`w-10 h-5 rounded-full relative ${
                  fixedSeed ? "bg-[#cc81f4]" : "bg-[#3f3f3f]"
                }`}
                onClick={() => setFixedSeed(!fixedSeed)}
                disabled={isGenerating}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                    fixedSeed ? "right-0.5" : "left-0.5"
                  }`}
                ></div>
              </button>
            </div>
            <input
              type="text"
              className="w-full border border-solid border-[#3F3F3F] bg-[#262626] text-white text-sm p-2 rounded-md"
              placeholder="Enter a number"
              value={seedValue}
              onChange={(e) =>
                setSeedValue(e.target.value.replace(/[^0-9]/g, ""))
              }
              disabled={!fixedSeed || isGenerating}
            />
          </div>
        </div>
        {/* Generate on mobile */}
        <div className="block md:hidden md:bottom-0 md:left-0 right-0 p-4 border-t border-[#262626] bg-[#262626] z-10">
        <div className="mb-4">
          <div className="flex justify-between items-center text-[#696969] text-xs mb-1">
            <span>Estimated time:</span>
            <span>1-2 minutes</span>
          </div>
          <div className="flex justify-between items-center text-[#696969] text-xs">
            <span>Credit cost:</span>
            <span className="flex items-center">
              <span className="text-[#c5f955] mr-1">⭐</span>
              Free ({MAX_GENERATIONS - generationsLeft}/{MAX_GENERATIONS})
            </span>
          </div>
        </div>
        <button
          className="w-full py-2 bg-[#d1afe4] text-white rounded-md flex items-center justify-center disabled:opacity-50"
          onClick={handleGenerate}
          disabled={isGenerating || !promptText.trim()}
        >
          {isGenerating ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg
                className="mr-2"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 2L10 6H14L11 9L12 13L8 11L4 13L5 9L2 6H6L8 2Z"
                  fill="white"
                />
              </svg>
              Generate
            </>
          )}
        </button>
      </div>
      </div>

      {/* Fixed Generate button at the bottom */}
      <div className="hidden md:block md:sticky md:bottom-0 md:left-0 right-0 p-4 border-t border-[#262626] bg-[#262626] z-10">
        <div className="mb-4">
          <div className="flex justify-between items-center text-[#696969] text-xs mb-1">
            <span>Estimated time:</span>
            <span>1-2 minutes</span>
          </div>
          <div className="flex justify-between items-center text-[#696969] text-xs">
            <span>Credit cost:</span>
            <span className="flex items-center">
              <span className="text-[#c5f955] mr-1">⭐</span>
              Free ({MAX_GENERATIONS - generationsLeft}/{MAX_GENERATIONS})
            </span>
          </div>
        </div>
        <button
          className="w-full py-2 bg-[#d1afe4] text-white rounded-md flex items-center justify-center disabled:opacity-50"
          onClick={handleGenerate}
          disabled={isGenerating || !promptText.trim()}
        >
          {isGenerating ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg
                className="mr-2"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 2L10 6H14L11 9L12 13L8 11L4 13L5 9L2 6H6L8 2Z"
                  fill="white"
                />
              </svg>
              Generate
            </>
          )}
        </button>
      </div>
    </div>
  );
}
