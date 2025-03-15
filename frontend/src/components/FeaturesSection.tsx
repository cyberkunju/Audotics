'use client'

import { motion } from 'framer-motion'
import {
  SparklesIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  AdjustmentsHorizontalIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'

const features = [
  {
    name: 'AI-Driven Playlists',
    description: 'Experience personalized music discovery powered by advanced AI algorithms that learn and adapt to your unique taste.',
    icon: SparklesIcon,
  },
  {
    name: 'Collaborative Playlists',
    description: 'Create and share playlists with friends in real-time. Perfect for parties, road trips, or group activities.',
    icon: UserGroupIcon,
  },
  {
    name: 'Offline Listening',
    description: 'Download your favorite tracks and playlists for seamless offline listening, anywhere and anytime.',
    icon: ArrowDownTrayIcon,
  },
  {
    name: 'Real-Time Adjustments',
    description: 'Fine-tune your recommendations on the fly. Skip, like, or adjust - our AI learns instantly.',
    icon: AdjustmentsHorizontalIcon,
  },
  {
    name: 'Location-Based Discovery',
    description: 'Discover music trending in your area or explore sounds from different regions around the world.',
    icon: MapPinIcon,
  },
]

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-gray-50 dark:bg-gradient-to-b dark:from-background dark:to-background-dark relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl mb-4">
            What Makes Audotics Unique?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover how our innovative features transform your music experience into something extraordinary.
          </p>
        </motion.div>

        <div className="mt-20 grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative p-6 bg-white dark:bg-gray-900/50 shadow-lg dark:shadow-none backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-primary/50 transition-colors duration-300"
            >
              <div className="absolute top-6 left-6 rounded-lg p-3 bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <div className="ml-16">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{feature.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
