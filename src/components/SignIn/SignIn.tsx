import { useState, useEffect } from "react";
import TextField from "../Textfield/Textfield";
import NavLink from "../Navlink/Navlink";
import Button from "../Button/Button";
import { loginUser } from "../../redux/actions/auth";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ReduxState } from "../../types/types"; // adjust if needed

const LoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const token = useSelector((state: ReduxState) => state.app.token);

  useEffect(() => {
    if (token) {
      navigate("/chats");
    }
  }, [token, navigate]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(loginUser({ formData }));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-bold text-center">Log In</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <TextField
              label="Email"
              type="email"
              name="email"
              id="email"
              isRequired
              placeHolder="Enter Email"
              value={formData.email}
              handleChange={handleChange}
            />
          </div>
          <div>
            <TextField
              label="Password"
              type="password"
              name="password"
              placeHolder="Enter Password"
              id="password"
              isRequired
              value={formData.password}
              handleChange={handleChange}
            />
          </div>
          <Button label={"Sign In"} type="submit" />
        </form>
        <div className="mt-4 text-center">
          <NavLink to="/register">Dont have Account? Register</NavLink>
        </div>
        <div className="mt-4 text-center">
          <NavLink to="/forgot-password"> Forgot Password ?</NavLink>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
