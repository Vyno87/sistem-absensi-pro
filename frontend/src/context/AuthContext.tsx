import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

interface User {
    _id: string;
    username: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string) => void;
    logout: () => void;
    registerBiometric: () => Promise<void>;
    loginBiometric: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    // Set default header
                    api.defaults.headers.common['x-auth-token'] = token;
                    const res = await api.get('/auth');
                    setUser(res.data);
                } catch (error) {
                    console.error("Auth Load Error", error);
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                }
            }
            setIsLoading(false);
        };

        loadUser();
    }, [token]);

    const login = (newToken: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    };

    const registerBiometric = async () => {
        try {
            // WebAuthn Registration Logic
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            const userID = user?._id || 'user_id';
            const publicKeyCredentialCreationOptions: any = {
                challenge,
                rp: { name: "Axiom ID", id: window.location.hostname },
                user: {
                    id: Uint8Array.from(userID, c => c.charCodeAt(0)),
                    name: user?.username || "user",
                    displayName: user?.username || "User",
                },
                pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                authenticatorSelection: { authenticatorAttachment: "platform" },
                timeout: 60000,
                attestation: "direct"
            };

            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions
            }) as any;

            if (credential) {
                // Convert ArrayBuffer to Base64 safely without iteration errors
                const uint8 = new Uint8Array(credential.rawId);
                let binary = '';
                uint8.forEach(byte => binary += String.fromCharCode(byte));
                const credentialIdBase64 = btoa(binary);

                // Store credentialId and publicKey on backend
                await api.post('/auth/biometric/register', {
                    credentialId: credentialIdBase64,
                    publicKey: "WEBAUTHN_PUBLIC_KEY" // Simplified for logic demonstration
                });
                alert("Biometrik berhasil didaftarkan!");
            }
        } catch (err) {
            console.error("Biometric Reg Error:", err);
            throw err;
        }
    };

    const loginBiometric = async () => {
        try {
            // WebAuthn Login Logic
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            const publicKeyCredentialRequestOptions: any = {
                challenge,
                allowCredentials: [], // Allow any registered credential for this RP
                timeout: 60000,
                userVerification: "required",
            };

            const assertion = await navigator.credentials.get({
                publicKey: publicKeyCredentialRequestOptions
            }) as any;

            if (assertion) {
                // Convert ArrayBuffer to Base64 safely without iteration errors
                const uint8 = new Uint8Array(assertion.rawId);
                let binary = '';
                uint8.forEach(byte => binary += String.fromCharCode(byte));
                const credId = btoa(binary);

                const res = await api.post('/auth/biometric/login', { credentialId: credId });
                login(res.data.token);
            }
        } catch (err) {
            console.error("Biometric Login Error:", err);
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    useEffect(() => {
        let idleTimer: NodeJS.Timeout;

        const resetTimer = () => {
            if (idleTimer) clearTimeout(idleTimer);
            // 15 minutes timeout (900,000 ms)
            idleTimer = setTimeout(() => {
                if (token) {
                    console.log('Idle timeout reached. Logging out.');
                    logout();
                }
            }, 15 * 60 * 1000);
        };

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        if (token) {
            events.forEach(event => window.addEventListener(event, resetTimer));
            resetTimer(); // Start the timer initialy
        }

        return () => {
            if (idleTimer) clearTimeout(idleTimer);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [token]);

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, registerBiometric, loginBiometric }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
