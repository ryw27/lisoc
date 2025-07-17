import { createContext } from "react";
import { type selectOptions, type IdMaps } from "./sem-schemas";

const OptionsContext = createContext<{selectOptions: selectOptions, idMaps: IdMaps} | null>(null);

export default OptionsContext;