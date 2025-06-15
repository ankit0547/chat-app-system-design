import { ReactNode } from "react";

interface NavLinkProps {
  children: ReactNode;
  to: string;
}

const NavLink = ({ children, to }: NavLinkProps) => {
  return (
    <a href={to} className="text-sm text-indigo-600 hover:underline">
      {children}
    </a>
  );
};

export default NavLink;
