/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';
import { fetchRate } from '../utils/exchange';
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

export const UserContext = createContext();

const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Function to update user data
    const updateUser = (userData) => {
        setUser(userData);
    };

    // Function to clear user data (e.g., on logout)
    const clearUser = () => {
        setUser(null);
        localStorage.removeItem('token');
    };

    // Fetch user info on mount if token exists
    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await axiosInstance.get(API_PATHS.AUTH.GET_USER_INFO);
                    setUser(response.data);
                } catch (error) {
                    console.error('Error fetching user info:', error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, updateUser, clearUser, loading }}>
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
    } catch (e) {
        console.error("Rate caching error", e);
    }
};

init();