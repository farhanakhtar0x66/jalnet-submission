import { registerRootComponent } from "expo";
import PreviewApp from "./src/preview/PreviewApp";

// A separate bundle graph: the preview never loads the server composition.
registerRootComponent(PreviewApp);
