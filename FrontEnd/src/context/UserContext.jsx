import { createContext, useState, useEffect } from 'react';
import { getCurrency } from '../utils/currency';
import { fetchRate } from '../utils/exchange';

export const UserContext = createContext();

const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // Function to update user data
    const updateUser = (userData) => {
        setUser(userData);
    };

    // Function to clear user data (e.g., on logout)
    const clearUser = () => {
        setUser(null);
    };

    return (
        <UserContext.Provider value={{ user, updateUser, clearUser }}>
            {children}
        </UserContext.Provider>
    );
}

export default UserProvider;

// Warm up exchange rate cache on load for USD -> PKR for forecast conversion
// so formatMoney(convert) can work synchronously using cached rate.
const init = async () => {
    try {
        // Always fetch USD to PKR rate since forecasts come in USD
        await fetchRate('USD', 'PKR').catch(() => {});
    } catch {}
};

init();