// This file suppresses JSX type errors since node_modules and @types/react are not installed locally.

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module "react-router-dom" {
  export const BrowserRouter: any;
  export const Routes: any;
  export const Route: any;
  export const Navigate: any;
  export const Outlet: any;
  export const Link: any;
  export const useNavigate: any;
  export const useLocation: any;
}

declare module "framer-motion" {
  export const motion: any;
  export const AnimatePresence: any;
}
