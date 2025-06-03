"use client";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import * as Yup from "yup";
const UserForm = () => {
  let signupSchema = Yup.object({
    username: Yup.string()
      .min(3, "Username must be at least 3 characters")
      .required("Username is required"),
    email: Yup.string()
      .email("Email is not valid")
      .required("Email is required"),
    password: Yup.string().min(6).required("Password is required"),
  });
  const router = useRouter();
  const handleSignup = async (values) => {
    const response = await fetch("http://localhost:5000/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        data.error ||
        data.message ||
        "An unknown error occurred during signup.";
      throw new Error(errorMessage);
    }
    return data;
  };
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      username: "",
    },
    validationSchema: signupSchema,
    onSubmit: async (values) => {
      try {
        const result = await handleSignup(values);
        console.log("Signup successful:", result);
        router.push("/login");
      } catch (err) {
        console.error("Signup submission error:", err.message);

        formik.setStatus({ success: false, message: err.message });
      }
    },
  });
  return (
    <div className="flex">
      <div className="w-1/3 ml-[100px] mt-[326px] flex flex-col gap-6">
        <h1 className="font-bold text-2xl">Create your account</h1>
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
          <div>
            <input
              type="text"
              name="username"
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="border-2 w-full p-2 rounded-md"
              placeholder="Enter your username"
            />
            {formik.touched.username && formik.errors.username && (
              <div className="text-red-500 text-sm mt-1">
                {formik.errors.username}
              </div>
            )}
          </div>

          <div>
            <input
              type="email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="border-2 w-full p-2 rounded-md"
              placeholder="Enter your new email"
            />
            {formik.touched.email && formik.errors.email && (
              <div className="text-red-500 text-sm mt-1">
                {formik.errors.email}
              </div>
            )}
          </div>

          <div>
            <input
              type="password"
              name="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="border-2 w-full p-2 rounded-md"
              placeholder="Enter your strong password"
            />
            {formik.touched.password && formik.errors.password && (
              <div className="text-red-500 text-sm mt-1">
                {formik.errors.password}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full border-2 bg-[#18181B] text-white py-2 rounded-2xl"
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting ? "Signing up..." : "Let's go"}
          </button>

          {formik.status && formik.status.message && (
            <div
              className={`text-center mt-2 ${
                formik.status.success ? "text-green-500" : "text-red-500"
              }`}
            >
              {formik.status.message}
            </div>
          )}
        </form>

        <p className="text-center">
          Already have an account?
          <span
            className="text-blue-400 cursor-pointer"
            onClick={() => router.push("/login")}
          >
            {" "}
            Log in
          </span>
        </p>
      </div>
    </div>
  );
};
export default UserForm;
