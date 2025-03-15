'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useSpotifyAuth } from '@/lib/spotify-auth/context';
import { BsSpotify } from 'react-icons/bs';
import { HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface ConnectionStatusProps {
  className?: string;
}

export default function ConnectionStatus({ className = '' }: ConnectionStatusProps) {
  const { auth } = useSpotifyAuth();
  const isConnected = auth.isAuthenticated && !!auth.user;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div 
            className={`flex items-center gap-1 p-1 rounded-md ${className}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="flex items-center gap-1.5">
              <BsSpotify className={`w-4 h-4 ${isConnected ? 'text-[#1DB954]' : 'text-gray-400'}`} />
              {isConnected ? (
                <HiOutlineCheckCircle className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <HiOutlineXCircle className="w-3.5 h-3.5 text-red-400" />
              )}
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-semibold">
              {isConnected ? 'Spotify Connected' : 'Spotify Not Connected'}
            </p>
            {!isConnected && (
              <p className="text-xs text-gray-400 mt-1">
                Login to link your Spotify account
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 