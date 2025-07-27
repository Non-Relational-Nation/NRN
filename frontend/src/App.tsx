import { Route, Routes } from "react-router-dom";
import "./App.css";
import Page1 from "./pages/Page1/Page1";
import Page2 from "./pages/Page2/Page2";
import NotFound from "./pages/NotFound/NotFound";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Page1 />} />
      <Route path="/page2" element={<Page2 />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
