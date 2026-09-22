import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background decoration elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-200/50 to-purple-200/50 blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-blue-200/50 to-cyan-200/50 blur-[100px] pointer-events-none -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-2xl w-full bg-white/70 backdrop-blur-xl shadow-2xl rounded-3xl p-10 md:p-16 text-center border border-white/50"
      >
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="relative inline-block mb-6"
        >
          <h1 className="text-[120px] md:text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 leading-none drop-shadow-sm select-none">
            404
          </h1>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            className="absolute -bottom-4 right-0 md:right-10 bg-rose-500 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg transform rotate-12"
          >
            Lost in space!
          </motion.div>
        </motion.div>

        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-4">
          Page Not Found
        </h2>
        <p className="text-lg text-slate-500 mb-10 max-w-md mx-auto leading-relaxed">
          The page you are looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-700 font-semibold shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-all duration-200 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
          
          <Link
            to="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 hover:from-indigo-500 hover:to-blue-500 transition-all duration-200 active:scale-95"
          >
            <Home className="w-5 h-5" />
            Return Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
