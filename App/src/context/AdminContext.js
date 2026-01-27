import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

const AdminContext = createContext();

const ADMIN_STORAGE_KEY = '@studysync_admin_session';

// Default admin credentials (should be changed after first login)
const DEFAULT_ADMIN_EMAIL = 'admin@studysync.com';
const DEFAULT_ADMIN_PASSWORD = 'admin123';

export const AdminProvider = ({ children }) => {
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
    const [adminUser, setAdminUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

    // Check for existing admin session on mount
    useEffect(() => {
        checkAdminSession();
    }, []);

    const checkAdminSession = async () => {
        try {
            const sessionData = await AsyncStorage.getItem(ADMIN_STORAGE_KEY);
            if (sessionData) {
                const admin = JSON.parse(sessionData);
                setAdminUser(admin);
                setIsAdminLoggedIn(true);
                setNeedsPasswordChange(admin.is_default_password);
            }
        } catch (error) {
            console.error('Error checking admin session:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const adminLogin = async (email, password) => {
        try {
            // For development/demo, check against default credentials or database
            // In production, use proper password hashing with bcrypt
            
            // First, try to fetch admin from database
            const { data: adminData, error } = await supabase
                .from('admins')
                .select('*')
                .eq('email', email.toLowerCase().trim())
                .single();

            if (error) {
                // If no admin in database, check default credentials
                if (email.toLowerCase().trim() === DEFAULT_ADMIN_EMAIL && 
                    password === DEFAULT_ADMIN_PASSWORD) {
                    const defaultAdmin = {
                        id: 1,
                        email: DEFAULT_ADMIN_EMAIL,
                        name: 'System Admin',
                        is_default_password: true,
                    };
                    
                    await AsyncStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(defaultAdmin));
                    setAdminUser(defaultAdmin);
                    setIsAdminLoggedIn(true);
                    setNeedsPasswordChange(true);
                    
                    return { success: true, needsPasswordChange: true };
                }
                return { success: false, error: 'Invalid credentials' };
            }

            // Simple password check (in production, use bcrypt.compare)
            // For now, we'll use a simple check
            if (adminData) {
                // Check if using default password
                const isDefaultPassword = password === DEFAULT_ADMIN_PASSWORD && 
                                          adminData.is_default_password;
                
                // In production, verify password hash here
                // For demo, we accept if it matches default or custom logic
                
                const adminSession = {
                    id: adminData.id,
                    email: adminData.email,
                    name: adminData.name,
                    is_default_password: adminData.is_default_password,
                };

                await AsyncStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminSession));
                setAdminUser(adminSession);
                setIsAdminLoggedIn(true);
                setNeedsPasswordChange(adminData.is_default_password);

                return { success: true, needsPasswordChange: adminData.is_default_password };
            }

            return { success: false, error: 'Invalid credentials' };
        } catch (error) {
            console.error('Admin login error:', error);
            return { success: false, error: 'Login failed. Please try again.' };
        }
    };

    const adminLogout = async () => {
        try {
            await AsyncStorage.removeItem(ADMIN_STORAGE_KEY);
            setAdminUser(null);
            setIsAdminLoggedIn(false);
            setNeedsPasswordChange(false);
        } catch (error) {
            console.error('Admin logout error:', error);
        }
    };

    const changeAdminPassword = async (currentPassword, newPassword) => {
        try {
            if (!adminUser) {
                return { success: false, error: 'Not logged in' };
            }

            // Verify current password (simplified for demo)
            if (currentPassword !== DEFAULT_ADMIN_PASSWORD && !adminUser.is_default_password) {
                // In production, verify against hashed password
            }

            // Update password in database
            const { error } = await supabase
                .from('admins')
                .update({ 
                    // In production, hash the password: password_hash: await bcrypt.hash(newPassword, 10)
                    is_default_password: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', adminUser.id);

            if (error) {
                console.error('Password update error:', error);
                return { success: false, error: 'Failed to update password' };
            }

            // Update local state
            const updatedAdmin = { ...adminUser, is_default_password: false };
            await AsyncStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(updatedAdmin));
            setAdminUser(updatedAdmin);
            setNeedsPasswordChange(false);

            return { success: true };
        } catch (error) {
            console.error('Change password error:', error);
            return { success: false, error: 'Failed to change password' };
        }
    };

    return (
        <AdminContext.Provider value={{
            isAdminLoggedIn,
            adminUser,
            isLoading,
            needsPasswordChange,
            adminLogin,
            adminLogout,
            changeAdminPassword,
        }}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => useContext(AdminContext);
