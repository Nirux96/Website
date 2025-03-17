"use client";

import { useState } from "react";
import { ChevronDown, Globe, Menu, X } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { useToast } from "@/components/ui/toast";
import { WORKSPACE_OPTIONS } from "@/lib/constants";

export function Navbar({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const contractAddress =
    "The contract will be published on our official Twitter";
  const { addToast } = useToast();

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-[#181818] border-b border-[#262626] relative z-40">
      {/* Logo and left section */}
      <div className="flex items-center flex-wrap gap-2">
        {/* Add sidebar toggle button before the logo - only on mobile */}
        {setSidebarOpen && (
          <button
            id="sidebar-toggle"
            className="md:hidden mr-1 text-white"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}

        <div className="flex items-center mr-2 md:mr-6">
          <div className="w-8 h-8 mr-2 flex items-center justify-center">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Mask%20group-IlcRvKHwtmSQY0LcwbnJWPLDdvOaO5.png"
              alt="Omni 3D Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-[#d1afe4] font-semibold text-lg">Omni 3D</span>
        </div>

        {/* Update workspace selector */}
        <div className="relative group">
          <button
            className="flex items-center px-3 py-1 text-white text-sm bg-[#262626] rounded-md mr-2 md:mr-6"
            onClick={() => {
              addToast({
                type: "info",
                title: "Workspace Selection",
                description: "Additional workspaces will be available soon.",
                duration: 3000,
              });
            }}
          >
            <svg
              className="mr-1"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 4H14M2 8H14M2 12H14"
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
            <span className="hidden xs:inline">Text to 3D</span>
            <ChevronDown className="ml-1 h-4 w-4" />
          </button>
          <div className="absolute hidden group-hover:block top-full left-0 mt-1 w-64 bg-[#262626] rounded-md shadow-lg z-50">
            <div className="py-1">
              {WORKSPACE_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-start px-4 py-2 text-sm ${
                    option.comingSoon
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-[#3f3f3f] cursor-pointer"
                  }`}
                  onClick={() => {
                    if (option.comingSoon) {
                      addToast({
                        type: "info",
                        title: "Coming Soon",
                        description: `${option.name} will be available soon!`,
                        duration: 3000,
                      });
                    }
                  }}
                >
                  <span className="mr-2">{option.icon}</span>
                  <div>
                    <div className="text-white flex items-center flex-wrap gap-1">
                      {option.name}
                      {option.comingSoon && (
                        <span className="text-xs bg-[#3f3f3f] px-2 py-0.5 rounded">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <div className="text-[#696969] text-xs mt-0.5">
                      {option.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:flex space-x-6">
          <a
            href="https://linktr.ee/omni3dofficial"
            target="_blank"
            className="text-white text-sm hover:text-[#d1afe4] transition-colors"
          >
            Socials
          </a>
          <a
            href="https://omni3d.gitbook.io/omni3d"
            target="_blank"
            className="text-white text-sm hover:text-[#d1afe4] transition-colors"
          >
            Docs
          </a>
          <a
            href="#"
            className="text-white text-sm hover:text-[#d1afe4] transition-colors"
          >
            Token <span className="text-[#696969]">(Coming Soon)</span>
          </a>
        </nav>

        {/* Referral link */}
        <a
          href="#"
          className="hidden md:flex items-center text-white text-sm ml-4 hover:text-[#d1afe4] transition-colors"
          onClick={(e) => {
            e.preventDefault();
            addToast({
              type: "info",
              title: "Referral Program",
              description: "Our referral program is coming soon!",
              duration: 3000,
            });
          }}
        >
          <span className="text-[#c5f955]">🎁</span>
          <span className="ml-1">
            Refer for a Free Pro{" "}
            <span className="text-[#696969]">(Coming Soon)</span>
          </span>
        </a>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Contract address - copyable */}
        <div className="hidden md:flex items-center text-white text-sm mr-4 bg-[#262626] px-3 py-1.5 rounded-md">
          <span className="mr-2 truncate max-w-[120px] lg:max-w-none">
            {contractAddress}
          </span>
          <CopyButton
            text={"https://x.com/omni3Dofficial"}
            successMessage="Contract copied!"
          />
        </div>

        {/* Globe button */}
        <button
          className="flex items-center p-2 bg-transparent rounded-full hover:bg-[#262626] transition-colors"
          onClick={() => {
            addToast({
              type: "info",
              title: "Language Settings",
              description: "Language settings will be available soon.",
              duration: 3000,
            });
          }}
        >
          <Globe className="h-5 w-5 text-white" />
        </button>

        {/* Connect wallet button */}
        <button
          className="hidden xs:flex px-3 py-1.5 text-[#D1AFE4] text-sm bg-[#262626] rounded-md border border-[#3F3F3F] hover:bg-[#3f3f3f] transition-colors"
          onClick={() => {
            const button = document.activeElement as HTMLButtonElement;
            const originalText = button.textContent;
            button.textContent = "Coming soon";
            setTimeout(() => {
              button.textContent = originalText;
            }, 2000);
          }}
        >
          Connect wallet
        </button>

        {/* Telegram button */}
        <button
          className="hidden xs:flex px-3 py-1.5 text-white font-medium text-sm rounded-md hover:opacity-90 transition-colors"
          style={{
            background: `url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SVG-aRzTTPYxmLYa9oqqIRu8VL7R9PuDSA.png)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          onClick={() => {
            addToast({
              type: "success",
              title: "Telegram",
              description: "Opening Telegram community...",
              duration: 3000,
            });
          }}
        >
          <a href="https://t.me/omni3d" target="_blank">
            Telegram
          </a>
        </button>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-white rounded-md hover:bg-[#262626]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-[#181818] border-b border-[#262626] z-50 md:hidden">
          <div className="px-4 py-3 space-y-3">
            <nav className="flex flex-col space-y-3">
              <a
                href="https://linktr.ee/omni3dofficial"
                target="_blank"
                className="text-white text-sm hover:text-[#d1afe4] transition-colors"
              >
                Socials
              </a>
              <a
                href="https://omni3d.gitbook.io/omni3d"
                target="_blank"
                className="text-white text-sm hover:text-[#d1afe4] transition-colors"
              >
                Docs
              </a>
              <a
                href="#"
                className="text-white text-sm hover:text-[#d1afe4] transition-colors"
              >
                Token <span className="text-[#696969]">(Coming Soon)</span>
              </a>
            </nav>

            <div className="flex items-center text-white text-sm py-2 overflow-hidden">
              <span className="mr-2 truncate">{contractAddress}</span>
              <CopyButton
                text={"https://x.com/omni3Dofficial"}
                successMessage="Contract copied!"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <button
                className="w-full px-3 py-1.5 text-[#D1AFE4] text-sm bg-[#262626] rounded-md hover:bg-[#3f3f3f]"
                onClick={() => {
                  const button = document.activeElement as HTMLButtonElement;
                  const originalText = button.textContent;
                  button.textContent = "Coming soon";
                  setTimeout(() => {
                    button.textContent = originalText;
                  }, 2000);
                }}
              >
                Connect wallet
              </button>
              <button
                className="w-full px-3 py-1.5 text-white font-medium text-sm rounded-md hover:opacity-90 transition-colors"
                style={{
                  background: `url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SVG-aRzTTPYxmLYa9oqqIRu8VL7R9PuDSA.png)`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                onClick={() => {
                  addToast({
                    type: "success",
                    title: "Telegram",
                    description: "Opening Telegram community...",
                    duration: 3000,
                  });
                }}
              >
                Telegram
              </button>
              <a
                href="#"
                className="flex items-center text-white text-sm py-2"
                onClick={(e) => {
                  e.preventDefault();
                  addToast({
                    type: "info",
                    title: "Referral Program",
                    description: "Our referral program is coming soon!",
                    duration: 3000,
                  });
                }}
              >
                <span className="text-[#c5f955] mr-1">🎁</span>
                <span>
                  Refer for a Free Pro{" "}
                  <span className="text-[#696969]">(Coming Soon)</span>
                </span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
