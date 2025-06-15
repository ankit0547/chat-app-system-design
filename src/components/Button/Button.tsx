type ButtonProps = {
  handleClick?: React.MouseEventHandler<HTMLButtonElement>;
  label?: string;
  type?: "button" | "submit" | "reset";
  name?: string;
  id?: string;
};

const Button = ({
  handleClick = undefined,
  label = "Button",
  type = "button",
  name = "button",
  id = "button",
}: ButtonProps) => {
  return (
    <button
      id={id}
      name={name}
      type={type}
      onClick={handleClick}
      className="w-full px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-500"
    >
      {label}
    </button>
  );
};

export default Button;
