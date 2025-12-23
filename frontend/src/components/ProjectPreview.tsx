import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
import type { Project } from "../types";
import { iframeScript } from "../assets/assets";
import EditorPanel from "./EditorPanel";
import LoaderSteps from "./LoaderSteps";

interface ElementStyles {
  padding: string;
  margin: string;
  backgroundColor: string;
  color: string;
  fontSize: string;
}

interface SelectedElement {
  tagName: string;
  className: string;
  text: string;
  styles: ElementStyles;
}

interface ProjectPreviewProps {
  project: Project;
  isGenerating: boolean;
  device: "phone" | "tablet" | "desktop";
  showEditorPanel: boolean;
}

export interface ProjectPreviewRef {
  getCode: () => string | undefined;
}

const EMPTY_STYLES: ElementStyles = {
  padding: "",
  margin: "",
  backgroundColor: "rgba(0,0,0,0)",
  color: "#000000",
  fontSize: "",
};

const ProjectPreview = forwardRef<ProjectPreviewRef, ProjectPreviewProps>(
  (
    { project, isGenerating, device = "desktop", showEditorPanel = true },
    ref
  ) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [selectedElement, setSelectedElement] =
      useState<SelectedElement | null>(null);

    const resolutions = {
      phone: "w-[412px]",
      tablet: "w-[768px]",
      desktop: "w-full",
    };

    useImperativeHandle(ref, () => ({
      getCode: () => {
        const doc = iframeRef.current?.contentDocument;
        if (!doc) return undefined;

        doc
          .querySelectorAll(".ai-selected-element,[data-ai-selected]")
          .forEach((el) => {
            el.classList.remove("ai-selected-element");
            el.removeAttribute("data-ai-selected");
            (el as HTMLElement).style.outline = "";
          });

        //Remove style + script
        const previewStyle = doc.getElementById("ai-preview-style");
        if (previewStyle) {
          previewStyle.remove();
        }

        const previewScript = doc.getElementById("ai-preview-script");
        if (previewScript) {
          previewScript.remove();
        }

        const html = doc.documentElement.outerHTML;
        return html;
      },
    }));

    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        if (!event.data?.type) return;

        if (event.data.type === "ELEMENT_SELECTED") {
          console.log(event.data.type);
          const payload = event.data.payload || {};

          setSelectedElement({
            tagName: payload.tagName ?? "",
            className: payload.className ?? "",
            text: payload.text ?? "",
            styles: {
              ...EMPTY_STYLES,
              ...(payload.styles || {}),
            },
          });
        }

        if (event.data.type === "CLEAR_SELECTION") {
          setSelectedElement(null);
        }
      };

      window.addEventListener("message", handleMessage);
      return () => window.removeEventListener("message", handleMessage);
    }, []);

    const handleUpdate = (updates: Partial<SelectedElement>) => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "UPDATE_ELEMENT", payload: updates },
        "*"
      );
    };

    const handleCloseEditor = () => {
      setSelectedElement(null);
      iframeRef.current?.contentWindow?.postMessage(
        { type: "CLEAR_SELECTION_REQUEST" },
        "*"
      );
    };

    useImperativeHandle(ref, () => ({
      getCode: () => project?.current_code,
    }));

    const injectPreview = (html?: string) => {
      if (!html) return "";
      if (!showEditorPanel) return html;

      return html.includes("</body>")
        ? html.replace("</body>", `${iframeScript}</body>`)
        : html + iframeScript;
    };

    return (
      <div className="relative h-full bg-gray-900 flex-1 rounded-xl overflow-hidden max-sm:ml-2">
        {project?.current_code ? (
          <>
            <iframe
              ref={iframeRef}
              sandbox="allow-scripts allow-same-origin"
              srcDoc={injectPreview(project.current_code)}
              className={`h-full max-sm:w-full ${resolutions[device]}`}
            />

            {showEditorPanel && selectedElement && (
              <EditorPanel
                selectedElement={selectedElement}
                onUpdate={handleUpdate}
                onClose={handleCloseEditor}
              />
            )}
          </>
        ) : (
          isGenerating && <LoaderSteps />
        )}
      </div>
    );
  }
);

export default ProjectPreview;
