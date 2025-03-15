'use client'
import { motion } from 'framer-motion'
import { PlayIcon, HeartIcon } from '@heroicons/react/24/outline'

const playlists = [
  {
    id: 1,
    title: 'Chill Vibes',
    description: 'Perfect for relaxation and focus',
    imageUrl: 'https://source.unsplash.com/random/800x600/?music,chill',
    songCount: 42,
    duration: '2h 35m',
  },
  {
    id: 2,
    title: 'Workout Mix',
    description: 'High-energy tracks for your workout',
    imageUrl: 'https://source.unsplash.com/random/800x600/?music,workout',
    songCount: 35,
    duration: '1h 55m',
  },
  {
    id: 3,
    title: 'Study Session',
    description: 'Concentration-enhancing playlist',
    imageUrl: 'https://source.unsplash.com/random/800x600/?music,study',
    songCount: 28,
    duration: '2h 10m',
  },
  {
    id: 4,
    title: 'Party Hits',
    description: 'Top tracks for your party',
    imageUrl: 'https://source.unsplash.com/random/800x600/?music,party',
    songCount: 50,
    duration: '3h 15m',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
}

export default function FeaturedPlaylists() {
  return (
    <section className="py-screen-10">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container"
      >
        <motion.h2
          variants={itemVariants}
          className="text-fluid-3xl font-bold text-gray-900 dark:text-white mb-8"
        >
          Featured Playlists
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {playlists.map((playlist) => (
            <motion.div
              key={playlist.id}
              variants={itemVariants}
              className="group relative bg-white dark:bg-background-dark rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="aspect-widescreen relative overflow-hidden">
                <img
                  src={playlist.imageUrl}
                  alt={playlist.title}
                  className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-center">
                  <button className="btn-primary p-3 transform scale-90 group-hover:scale-100 transition-transform duration-300 hover:scale-110">
                    <PlayIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <h3 className="text-fluid-lg font-semibold text-gray-900 dark:text-white">
                  {playlist.title}
                </h3>
                <p className="text-fluid-sm text-gray-600 dark:text-gray-300">
                  {playlist.description}
                </p>
                <div className="flex justify-between items-center text-fluid-xs text-gray-500 dark:text-gray-400">
                  <span>{playlist.songCount} songs</span>
                  <span>{playlist.duration}</span>
                </div>
                <button className="w-full mt-2 flex-center gap-2 py-2 text-fluid-sm text-primary hover:text-primary-light transition-colors duration-200">
                  <HeartIcon className="w-5 h-5" />
                  Add to Favorites
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
