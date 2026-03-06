// src/components/ConfirmAlert.jsx
export default function ConfirmAlert({ content, onConfirm, confirmContent, color }) {
  return (
    <div className="flex flex-col gap-4">
      <p style={{ color: "var(--text)" }}>{content}</p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onConfirm}
          className={
            color === "error"
              ? "error-btn-fill px-4 py-2 rounded-md text-sm"
              : "primary-btn-fill px-4 py-2 rounded-md text-sm"
          }
        >
          {confirmContent}
        </button>
      </div>
    </div>
  );
}
