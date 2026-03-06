import { useState, useContext } from "react";
import { SIDE_MENU_DATA } from "../../utils/data";
import { UserContext } from "../../context/userContext";
import { useNavigate } from "react-router-dom";
import CharAvatar from "../Cards/CharAvatar";
import Modal from "../Modal";
import ConfirmAlert from "../ConfirmAlert";

const SideMenu = ({ activeMenu }) => {
  const { user, clearUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [openLogoutModal, setOpenLogoutModal] = useState(false);

  const handleClick = (route) => {
    if (route === "/logout") {
      setOpenLogoutModal(true);
      return;
    }
    navigate(route);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    clearUser();
    navigate("/login");
  };

  return (
    <>
      <div className="w-64 h-[calc(100vh-61px)] theme-card border-r p-5 sticky top-[61px] z-20">
        <div className="flex flex-col items-center justify-center gap-3 mt-3 mb-7">
          {user?.profileImageUrl ? (
            <img
              src={user?.profileImageUrl}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <CharAvatar fullName={user?.fullName} width="w-20" height="h-20" style="text-xl" />
          )}
          <h5 className="font-medium leading-6 theme-text">{user?.fullName || ""}</h5>
        </div>

        {SIDE_MENU_DATA.map((item, index) => {
          const isActive = activeMenu === item.label;
          return (
            <button
              key={`menu_${index}`}
              onClick={() => handleClick(item.path)}
              className={`w-full flex items-center gap-4 text-[15px] py-3 px-6 rounded-lg mb-3 cursor-pointer border
                ${isActive ? "primary-btn-fill" : "theme-card"}`}
            >
              <item.icon className={`text-xl ${isActive ? "text-white" : "text-gray-700 dark:text-gray-200"}`} />
              <span className={isActive ? "text-white font-medium" : "theme-text"}>{item.label}</span>
            </button>
          );
        })}
      </div>

      <Modal
        isOpen={openLogoutModal}
        onClose={() => setOpenLogoutModal(false)}
        title="Logout"
      >
        <ConfirmAlert
          content="Are you sure you want to logout?"
          onConfirm={handleLogout}
          confirmContent="Logout"
          color="error"
        />
      </Modal>
    </>
  );
};

export default SideMenu;
