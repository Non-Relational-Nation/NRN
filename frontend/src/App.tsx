import { Route, Routes } from "react-router-dom";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<h1>Frontend setup</h1>} />
      <Route path="/placeholder" element={<h1>Frontend setup page 2</h1>} />
    </Routes>
  );
}

export default App;
