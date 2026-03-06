
import { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";

const Input = (props) => {
  const {
    value,
    onChange,
    label,
    placeholder,
    type,
    allowInput = true,
    ...rest // ✅ IMPORTANT: forward extra props like step, inputMode, pattern
  } = props;

  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => setShowPassword((s) => !s);

  return (
    <div>
      <label className="text-[13px]" style={{ color: "var(--text-strong)" }}>
        {label}
      </label>

      <div className="input-box">
        <input
          type={type === "password" ? (showPassword ? "text" : "password") : type}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none"
          value={value}
          onChange={(e) => onChange(e)}
          disabled={!allowInput}
          style={{ color: "var(--text)" }}
          {...rest} // ✅ now inputMode/step will work
        />

        {type === "password" && (
          <>
            {showPassword ? (
              <FaRegEye
                size={22}
                className="cursor-pointer"
                style={{ color: "var(--primary)" }}
                onClick={togglePasswordVisibility}
              />
            ) : (
              <FaRegEyeSlash
                size={22}
                className="cursor-pointer"
                style={{ color: "var(--text-muted)" }}
                onClick={togglePasswordVisibility}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Input;
