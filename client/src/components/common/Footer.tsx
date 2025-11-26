import React from "react";
import { Link } from "react-router";
import { FaGithub, FaTwitter, FaLinkedin } from "react-icons/fa";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";

const Footer = () => {
  return (
    <footer className="border-t py-8 bg-gray-50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <HiOutlineChatBubbleLeftRight className="h-6 w-6" />
              <h3 className="text-lg font-semibold text-gray-800">ChatApp</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Connect with friends and chat in real-time. Built with FastAPI and
              React.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-gray-600 hover:text-blue-600 text-sm transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/chat"
                  className="text-gray-600 hover:text-blue-600 text-sm transition-colors"
                >
                  Chat
                </Link>
              </li>
              <li>
                <Link
                  to="/friends"
                  className="text-gray-600 hover:text-blue-600 text-sm transition-colors"
                >
                  Friends
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-600 hover:text-blue-600 text-sm transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Connect</h3>
            <div className="flex space-x-4">
              <a
                href="https://github.com/anuz505"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 text-2xl transition-colors"
              >
                <FaGithub />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-400 text-2xl transition-colors"
              >
                <FaTwitter />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-700 text-2xl transition-colors"
              >
                <FaLinkedin />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-gray-600 text-center text-sm">
            © {new Date().getFullYear()} ChatApp. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
