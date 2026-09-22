import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../firebase';

const InactiveAccount = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      // Wait a tick before navigating
      setTimeout(() => navigate('/'), 100);
    } catch (error) {
      console.error("Logout failed", error);
      navigate('/');
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-bg-base p-4'>
      <div className='max-w-md w-full bg-bg-card rounded-[24px] shadow-sm border border-border-card p-8 text-center'>
        <h2 className='text-2xl font-extrabold text-brand-danger mb-4'>Account Inactive</h2>
        <p className='text-sm text-text-sec mb-8'>
          Your account is currently inactive. You cannot access the HRMS at this time. 
          Please contact your administrator for more information.
        </p>
        <button 
          onClick={handleLogout} 
          className='w-full py-3 bg-brand-primary text-white text-sm font-bold rounded-[14px] hover:bg-brand-hover transition-colors'
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default InactiveAccount;
