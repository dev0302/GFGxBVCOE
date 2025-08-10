import { Link, NavLink } from "react-router-dom";
import logo from "../images/gfgLogo.png"


function Navbar(){
    
    return(
        <div className=" NAVBAR_CONTAINER mt-4 w-9/12 mx-auto flex items-center justify-between mb-8 navbar_shadow pb-2">

            <div className="flex items-center gap-2">
                <NavLink to="/">
                    <img src={logo} alt="nf" className="w-[40px] h-[40px] rounded-full" />
                </NavLink>
                <p>GFGxBVCOE</p>
            </div>

            <nav>
                <ul className="hidden gap-4 text-sm sm:flex ">
                    <li><NavLink to="/">Home</NavLink></li>
                    <li><NavLink to="/about">About</NavLink></li>
                    <li><NavLink to="/contact">Contact</NavLink></li>
                </ul>
            </nav>

            

        </div>
    )
};

export default Navbar;