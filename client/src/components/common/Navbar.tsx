import React from "react";
import { Link } from "react-router";
import { useState } from "react";
import {
  HiBars3BottomRight,
  HiOutlineChatBubbleLeftRight,
  HiOutlineUser,
} from "react-icons/hi2";
import { IoMdClose } from "react-icons/io";
import { useAppSelector } from "../../store/hooks/hook";

const Navbar = () => {
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const toggleNavDrawer = () => {
    setNavDrawerOpen(!navDrawerOpen);
  };

  return (
    <div>
      <nav className="flex justify-between items-center mx-auto container py-4 px-5">
        {/* Logo */}
        <div>
          <Link
            to={"/"}
            className="font-medium text-2xl flex items-center gap-2"
          >
            <HiOutlineChatBubbleLeftRight className="h-7 w-7" />
            ChatApp
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-6">
          <Link
            to="/"
            className="text-gray-700 hover:text-black text-sm font-medium uppercase"
          >
            Home
          </Link>
          <Link
            to="/chat"
            className="text-gray-700 hover:text-black text-sm font-medium uppercase"
          >
            Chat
          </Link>
          <Link
            to="/friends"
            className="text-gray-700 hover:text-black text-sm font-medium uppercase"
          >
            Friends
          </Link>
          <Link
            to="/friend-requests"
            className="text-gray-700 hover:text-black text-sm font-medium uppercase"
          >
            Requests
          </Link>
          <Link
            to="/discover"
            className="text-gray-700 hover:text-black text-sm font-medium uppercase"
          >
            Discover
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="hover:text-black flex items-center gap-2"
              >
                <HiOutlineUser className="h-6 w-6 text-gray-700" />
                <span className="hidden sm:inline text-sm">
                  {user?.username}
                </span>
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 hover:text-black"
            >
              Login
            </Link>
          )}

          <button onClick={toggleNavDrawer} className="md:hidden">
            <HiBars3BottomRight className="h-6 w-6 text-gray-700" />
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      <div
        className={`fixed top-0 left-0 w-3/4 sm:w-1/2 md:w-1/4 h-full bg-white shadow-lg transform transition-transform duration-300 z-50 ${
          navDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button onClick={toggleNavDrawer}>
            <IoMdClose className="h-6 w-6 text-gray-600" />
          </button>
        </div>
        <div className="flex flex-col p-4 space-y-4">
          <Link
            to="/"
            className="text-gray-700 hover:text-blue-600 text-sm font-medium uppercase border-b border-gray-100 pb-2"
            onClick={toggleNavDrawer}
          >
            Home
          </Link>
          <Link
            to="/chat"
            className="text-gray-700 hover:text-blue-600 text-sm font-medium uppercase border-b border-gray-100 pb-2"
            onClick={toggleNavDrawer}
          >
            Chat
          </Link>
          <Link
            to="/friends"
            className="text-gray-700 hover:text-blue-600 text-sm font-medium uppercase border-b border-gray-100 pb-2"
            onClick={toggleNavDrawer}
          >
            Friends
          </Link>
          <Link
            to="/friend-requests"
            className="text-gray-700 hover:text-blue-600 text-sm font-medium uppercase border-b border-gray-100 pb-2"
            onClick={toggleNavDrawer}
          >
            Friend Requests
          </Link>
          <Link
            to="/discover"
            className="text-gray-700 hover:text-blue-600 text-sm font-medium uppercase border-b border-gray-100 pb-2"
            onClick={toggleNavDrawer}
          >
            Discover People
          </Link>
          {isAuthenticated ? (
            <Link
              to="/profile"
              className="text-gray-700 hover:text-blue-600 text-sm font-medium uppercase border-b border-gray-100 pb-2"
              onClick={toggleNavDrawer}
            >
              Profile
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-gray-700 hover:text-blue-600 text-sm font-medium uppercase border-b border-gray-100 pb-2"
              onClick={toggleNavDrawer}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
