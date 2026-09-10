"use client";

import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();

    const handleLogin = (e?: React.FormEvent) => {
        e?.preventDefault();
        router.push('/dashboard');
    };
    
    return (
        <div className="auth-page min-h-screen bg-gray-900/90 flex items-center justify-center p-4">
            <div className="auth-card bg-white w-full max-w-md rounded-2xl shadow-2xl p-12 flex flex-col items-center gap-12">
                <h1 className="auth-title text-4xl font-bold text-gray-800">Login</h1>

                <button
                    onClick={() => handleLogin()}
                    className="auth-google w-full flex items-center justify-center gap-3 py-3 px-4 bg-green-50 text-[#00a854] rounded-lg font-semibold hover:bg-green-100 transition-colors border border-green-100"
                >
                    <img src="https://www.google.com/favicon.ico" alt="google" className="w-4 h-4" />
                    Login with Google
                </button>

                <div className="w-full flex items-center gap-4 text-xs text-gray-300">
                    <div className="flex-1 h-px bg-gray-100"></div>
                    <span>or sign up through email</span>
                    <div className="flex-1 h-px bg-gray-100"></div>
                </div>

                <form onSubmit={handleLogin} className="w-full flex flex-col gap-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Email ID"
                            className="auth-input w-full bg-gray-50 border-none rounded-xl py-4 px-6 outline-none text-gray-600 focus:ring-1 focus:ring-green-500"
                        />
                    </div>
                    <div className="relative">
                        <input
                            type="password"
                            placeholder="Password"
                            className="auth-input w-full bg-gray-50 border-none rounded-xl py-4 px-6 outline-none text-gray-600 focus:ring-1 focus:ring-green-500"
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-button w-full py-4 bg-[#00a854] text-white rounded-xl font-bold hover:bg-[#008c45] transition-all text-center shadow-lg shadow-green-100"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}
