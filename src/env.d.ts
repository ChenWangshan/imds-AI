/// <reference types="vite/client" />

declare module "eacon-components/index.css";

declare module "*.json" {
  const value: unknown;
  export default value;
}
