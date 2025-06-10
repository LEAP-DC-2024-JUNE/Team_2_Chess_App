"use client";
import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

const LoginPage = () => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginSchema = Yup.object({
    email: Yup.string()
      .email("Email is not valid")
      .required("Email is required"),
    password: Yup.string().required("Password is required"),
  });

  const handleLogin = async (values) => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.message ||
          data.error ||
          "Login failed. Please check your credentials.";
        throw new Error(errorMessage);
      }

      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      setMessage("");
      setError("");

      try {
        const result = await handleLogin(values);
        console.log("Login successful:", result);

        localStorage.setItem("jwtToken", result.token);
        localStorage.setItem("userId", result.userId);
        localStorage.setItem("username", result.username);

        setMessage(result.message || "Login successful!");

        window.location.href = "/multiplayer";
      } catch (err) {
        console.error("Login submission error:", err.message);
        setError(err.message || "An unexpected error occurred during login.");
      }
    },
  });

  return (
    <div className="min-h-screen bg-[#151618] flex items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto p-8 bg-white/5  rounded-xl shadow-2xl border border-gray-700 text-center relative overflow-hidden">
        <div className="absolute top-[-50px] left-[-50px] w-40 h-40 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 "></div>
        <div className="absolute bottom-[-50px] right-[-50px] w-40 h-40 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30  animation-delay-2000"></div>
        <h2 className="text-4xl font-extrabold mb-8 text-white tracking-wide">
          Ultimatechess
        </h2>

        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-6">
          <div className="text-left relative">
            <label
              htmlFor="email"
              className="block mb-2 text-lg font-semibold text-gray-200"
            >
              Email:
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="email"
                id="email"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter your email"
                className={`w-full pl-10 pr-4 py-3 bg-white/10 text-white placeholder-gray-400 border border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                  ${
                    formik.touched.email && formik.errors.email
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
              />
            </div>
            {formik.touched.email && formik.errors.email && (
              <div className="text-red-400 text-sm mt-2 flex items-center">
                <AlertCircle size={16} className="mr-1" />
                {formik.errors.email}
              </div>
            )}
          </div>

          <div className="text-left relative">
            <label
              htmlFor="password"
              className="block mb-2 text-lg font-semibold text-gray-200"
            >
              Password:
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="password"
                id="password"
                name="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter your password"
                className={`w-full pl-10 pr-4 py-3 bg-white/10 text-white placeholder-gray-400 border border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                  ${
                    formik.touched.password && formik.errors.password
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
              />
            </div>
            {formik.touched.password && formik.errors.password && (
              <div className="text-red-400 text-sm mt-2 flex items-center">
                <AlertCircle size={16} className="mr-1" />
                {formik.errors.password}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 px-6 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center gap-2
              disabled:bg-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
            disabled={isLoading || formik.isSubmitting}
          >
            {isLoading || formik.isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Logging in...
              </>
            ) : (
              "Log In"
            )}
          </button>
        </form>
        {message && (
          <p className="text-green-400 mt-6 font-semibold text-lg animate-fade-in">
            {message}
          </p>
        )}
        {error && (
          <p className="text-red-400 mt-6 font-semibold text-lg animate-fade-in">
            {error}
          </p>
        )}
        <p className="mt-8 text-gray-300 text-base">
          Don't have an account?{" "}
          <span
            className="text-blue-400 cursor-pointer font-semibold hover:underline transition-colors duration-200"
            onClick={() => (window.location.href = "/signup")}
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
