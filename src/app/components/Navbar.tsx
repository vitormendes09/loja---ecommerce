import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { UserButton, SignInButton } from "@clerk/nextjs";


function NavBar() {
    return (
        <nav>
          <ul className="fixed top-0 w-full flex items-center py-2 px-8 justify-between z-50 bg-slate-800 text-gray-300">
            <Link 
              href="/" 
              className = 'uppercase font-bold text-md h-12 flex items-center'
              >
              Ecommerce
            </Link>

            <div className="flex items-center gap-8"> 

              <SignedIn>
                <UserButton />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal"> 
                  <button className="uppercase rounded-md border-gray-400 px-3 py2">
                    Login
                </button>
                </SignInButton> 



              </SignedOut>

            </div>

          </ul>
        </nav>
    );
}

export default NavBar;