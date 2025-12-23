import { X } from "lucide-react";
import { useEffect, useState } from "react";

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

interface EditorPanelProps {
  selectedElement: SelectedElement;
  onUpdate: (updates: Partial<SelectedElement>) => void;
  onClose: () => void;
}

const EditorPanel = ({
  selectedElement,
  onUpdate,
  onClose,
}: EditorPanelProps) => {
  const [values, setValues] = useState<SelectedElement>(selectedElement);

  useEffect(() => {
    setValues(selectedElement);
  }, [selectedElement]);

  const updateStyles = (style: keyof ElementStyles, value: string) => {
    const newStyles = {
      ...values.styles,
      [style]: value,
    };

    setValues({ ...values, styles: newStyles });

    onUpdate({
      styles: newStyles,
    });
  };

  const updateField = (field: "text" | "className", value: string) => {
    setValues({ ...values, [field]: value });
    onUpdate({ [field]: value });
  };

  return (
    <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 animate-fade-in fade-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">Edit Element</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="space-y-4 text-black">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Text Content
          </label>
          <textarea
            value={values.text}
            onChange={(e) => updateField("text", e.target.value)}
            className="w-full text-sm p-2 border border-gray-400 rounded-md min-h-20"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Class Name
          </label>
          <input
            value={values.className}
            onChange={(e) => updateField("className", e.target.value)}
            className="w-full text-sm p-2 border border-gray-400 rounded-md"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(["padding", "margin", "fontSize"] as const).map((key) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {key}
              </label>
              <input
                value={values.styles[key]}
                onChange={(e) => updateStyles(key, e.target.value)}
                className="w-full text-sm p-2 border border-gray-400 rounded-md"
              />
            </div>
          ))}

          {(["backgroundColor", "color"] as const).map((key) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {key}
              </label>
              <input
                type="color"
                value={
                  values.styles[key] === "rgba(0,0,0,0)"
                    ? "#ffffff"
                    : values.styles[key]
                }
                onChange={(e) => updateStyles(key, e.target.value)}
                className="w-full h-10"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditorPanel;
