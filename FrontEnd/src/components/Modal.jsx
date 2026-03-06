// src/components/Modal.jsx
export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="w-full max-w-md rounded-xl p-6"
        style={{
          background: "var(--surface)",
          color: "var(--text)",
          border: `1px solid var(--border)`,
          boxShadow: "0 4px 12px rgba(0,0,0,.25)",
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-strong)" }}>
            {title}
          </h3>
          <button onClick={onClose} className="text-sm text-muted hover:opacity-80">
            ✕
          </button>
        </div>

        {/* Body */}
        <div>{children}</div>
      </div>
    </div>
  );
}
