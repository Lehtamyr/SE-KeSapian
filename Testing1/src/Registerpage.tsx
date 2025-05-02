"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, Eye, EyeOff, Facebook, Apple } from "lucide-react"
import Button from "../components/ui/button"
import { Input } from "../components/ui/input"
import { FcGoogle } from "react-icons/fc"

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <div className="flex flex-col min-h-screen bg-emerald-500 p-6">
      <div className="w-full max-w-md mx-auto">
        <Link href="/" className="text-white mb-6 inline-block">
          <ArrowLeft className="h-6 w-6" />
        </Link>

        <div className="mt-4">
          <h1 className="text-3xl font-bold text-white mb-2">Register</h1>

          <div className="text-white mb-8">
            <p>If you already have an account</p>
            <p>
              You can{" "}
              <Link href="/sign-in" className="font-bold underline">
                Login Here
              </Link>
            </p>
          </div>

          <form className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-white text-sm">
                Email
              </label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  className="bg-transparent border-white/20 text-white placeholder:text-white/60"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="username" className="text-white text-sm">
                Username
              </label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your user name"
                  className="bg-transparent border-white/20 text-white placeholder:text-white/60"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-white text-sm">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your Password"
                  className="bg-transparent border-white/20 text-white placeholder:text-white/60 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-white text-sm">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your Password"
                  className="bg-transparent border-white/20 text-white placeholder:text-white/60 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button className="w-full bg-emerald-900 hover:bg-emerald-800 text-white font-medium">Register</Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white text-sm mb-4">or continue with</p>
            <div className="flex justify-center space-x-4">
              <Button size="icon" className="rounded-full bg-white hover:bg-gray-100">
                <Facebook className="h-5 w-5 text-blue-600" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full bg-white hover:bg-gray-100">
                <Apple className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full bg-white hover:bg-gray-100">
                <FcGoogle className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
