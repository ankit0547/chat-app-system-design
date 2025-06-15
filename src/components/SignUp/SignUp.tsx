import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, NavLink } from "react-router-dom";
import TextField from "../Textfield/Textfield";
import Button from "../Button/Button";
import { registerUser } from "../../redux/actions/auth";
import { ReduxState } from "../../types/types";

const SignupForm = () => {
  const dispatch = useDispatch();
  // const navigate = useNavigate();

  const token = useSelector((state: ReduxState) => state.app.token);

  // useEffect(() => {
  //   if (token) navigate("/");
  // }, [token, navigate]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(registerUser({ formData }));
  };

  // ✅ Redirect immediately if token exists
  if (token) {
    return <Navigate to="/" replace />;
  }
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-bold text-center">Sign Up</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <TextField
              label="First Name"
              type="firstName"
              name="firstName"
              id="firstName"
              isRequired
              value={formData.firstName}
              handleChange={handleChange}
            />
          </div>
          <div>
            <TextField
              label="Last Name"
              type="lastName"
              name="lastName"
              id="lastName"
              isRequired
              value={formData.lastName}
              handleChange={handleChange}
            />
          </div>
          <div>
            <TextField
              label="Email"
              type="email"
              name="email"
              id="email"
              isRequired
              value={formData.email}
              handleChange={handleChange}
            />
          </div>
          <div>
            <TextField
              label="Password"
              type="password"
              name="password"
              id="password"
              isRequired
              value={formData.password}
              handleChange={handleChange}
            />
          </div>
          <Button label={"Sign Up"} type="submit" />
        </form>
        <div className="mt-4 text-center">
          <NavLink to="/login">Already have account? Login</NavLink>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
