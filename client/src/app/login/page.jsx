"use client";
import { useState } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import * as Yup from "yup";

const LoginPage = () => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  const loginSchema = Yup.object({
    email: Yup.string()
      .email("Email is not valid")
      .required("Email is required"),
    password: Yup.string().required("Password is required"),
  });

  const handleLogin = async (values) => {
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

        router.push("/");
      } catch (err) {
        console.error("Login submission error:", err.message);
        setError(err.message || "An unexpected error occurred during login.");
      }
    },
  });

  return (
    <div className="max-w-[400px] mx-auto p-[20px] border border-gray-300 rounded-lg shadow-md bg-white text-center mt-[50px]">
      <h2 className="text-2xl font-bold mb-5">Log In</h2>
      <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
        <div className="text-left">
          <label htmlFor="email" className="block mb-1 font-bold">
            Email:
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            required
            className="w-full p-2 border border-gray-300 rounded-md box-border"
          />
          {formik.touched.email && formik.errors.email && (
            <div className="text-red-500 text-sm mt-1">
              {formik.errors.email}
            </div>
          )}
        </div>

        <div className="text-left">
          <label htmlFor="password" className="block mb-1 font-bold">
            Password:
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            required
            className="w-full p-2 border border-gray-300 rounded-md box-border"
          />
          {formik.touched.password && formik.errors.password && (
            <div className="text-red-500 text-sm mt-1">
              {formik.errors.password}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="py-3 px-5 bg-blue-500 text-white border-none rounded-md cursor-pointer text-base transition-colors duration-300 hover:bg-blue-600"
          disabled={formik.isSubmitting}
        >
          {formik.isSubmitting ? "Logging in..." : "Log In"}
        </button>
      </form>

      {message && <p className="text-green-600 mt-4 font-bold">{message}</p>}
      {error && <p className="text-red-600 mt-4 font-bold">{error}</p>}

      <p className="mt-5 text-sm">
        Don't have an account?{" "}
        <span
          className="text-blue-500 cursor-pointer underline"
          onClick={() => router.push("/signup")}
        >
          Sign Up
        </span>
      </p>
    </div>
  );
};

export default LoginPage;
