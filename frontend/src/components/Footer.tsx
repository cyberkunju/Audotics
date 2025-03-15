'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  GlobeAltIcon,
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

const footerLinks = {
  product: [
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Playlists', href: '/playlists' },
    { name: 'Mobile App', href: '/mobile' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Blog', href: '/blog' },
  ],
  resources: [
    { name: 'Support', href: '/support' },
    { name: 'Documentation', href: '/docs' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
  social: [
    { name: 'Website', icon: GlobeAltIcon, href: 'https://audotics.com' },
    { name: 'Support', icon: ChatBubbleLeftIcon, href: '/support' },
    { name: 'Documentation', icon: DocumentTextIcon, href: '/docs' },
    { name: 'Community', icon: UserGroupIcon, href: '/community' },
  ],
}

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

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-50/80 dark:bg-background-dark/50 backdrop-blur-lg border-t border-gray-200 dark:border-foreground/10">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
      >
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <motion.div variants={itemVariants} className="space-y-4">
            <Link href="/" className="animated-gradient-text text-2xl font-bold">
              Audotics
            </Link>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs">
              Experience the future of music with AI-powered recommendations and personalized playlists.
            </p>
            <div className="flex space-x-4">
              {footerLinks.social.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors duration-200"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.name}</span>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Product Links */}
          <motion.div variants={itemVariants}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 tracking-wider uppercase mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Company Links */}
          <motion.div variants={itemVariants}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 tracking-wider uppercase mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Resources Links */}
          <motion.div variants={itemVariants}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 tracking-wider uppercase mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          variants={itemVariants}
          className="mt-12 pt-8 border-t border-foreground/10"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} Audotics. All rights reserved.
            </p>
            <div className="mt-4 sm:mt-0 flex space-x-6">
              <Link
                href="/privacy"
                className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </footer>
  )
}
