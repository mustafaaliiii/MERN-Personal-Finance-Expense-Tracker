const Textarea = (props) => {
  const { value, onChange, label, placeholder, allowInput = true, rows = 8 } = props;

  return (
    <div>
      {/* Strong, theme-aware label */}
      <label className="text-[13px]" style={{ color: 'var(--text-strong)' }}>
        {label}
      </label>

      <div className="input-box">
        <textarea
          placeholder={placeholder}
          className="w-full bg-transparent outline-none resize-none"
          value={value}
          onChange={(e) => onChange(e)}
          disabled={!allowInput}
          rows={rows}
          style={{ color: 'var(--text)' }}
        />
      </div>
    </div>
  );
};

export default Textarea;
