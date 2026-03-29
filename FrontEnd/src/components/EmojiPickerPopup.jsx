import { useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { LuImage, LuX } from 'react-icons/lu';

const EmojiPickerPopup = (props) => {
    const { icon, onSelect } = props;

    const [isOpen, setIsOpen] = useState(false);

    // Check if icon is valid emoji (not URL)
    const isValidEmoji = (str) => {
      if (!str || typeof str !== "string") return false;
      if (/[a-zA-Z0-9]/.test(str)) return false; // Reject ASCII mixed with symbols
      if (str.length > 4) return false;
      // Include more emoji ranges including miscellaneous symbols (lightning bolt ⚡)
      const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{1F000}-\u{1F02F}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{2764}]/u;
      return emojiRegex.test(str);
    };

    return (
        <div className="flex flex-col md:flex-row items-center gap-5 mb-6">
            <div
                className="flex items-center gap-4 cursor-pointer"
                onClick={() => setIsOpen(true)}
            >
                <div className="w-12 h-12 flex items-center justify-center text-2xl bg-purple-50 dark:bg-slate-800 text-primary rounded-lg">
                    {icon ? (
                        isValidEmoji(icon) ? (
                            <span>{icon}</span>
                        ) : icon.startsWith("http") || icon.startsWith("data:") ? (
                            <img src={icon} alt="Icon" className="w-12 h-12" />
                        ) : (
                            <LuImage />
                        )
                    ) : (
                        <LuImage />
                    )}
                </div>

                <p className="">
                    {icon ? "Change Icon" : "Pick Icon"}
                </p>
            </div>

            {isOpen && (
                <div className="relative">
                    <button
                        className="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 dark:text-white rounded-full absolute -top-2 -right-2 z-10 cursor-pointer"
                        onClick={() => setIsOpen(false)}
                    >
                        <LuX />
                    </button>

                    <EmojiPicker
                        theme="auto"
                        open={isOpen}
                        onEmojiClick={(emoji) => {
                          // Prioritize native emoji character
                          const emojiValue = emoji?.emoji || emoji?.imageUrl || "";
                          onSelect(emojiValue);
                          setIsOpen(false);
                        }}
                    />
                </div>
            )}
        </div>
    );
}

export default EmojiPickerPopup;