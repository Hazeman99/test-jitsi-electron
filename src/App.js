import './App.css';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import JitsiComponent from './pages/Jitsi';
// import Meeting from './pages/Meeting';

function App() {
  return (
    <Routes>
      <Route path='/' element={<Home/>}> </Route>
      <Route exact path="/:id" element={<JitsiComponent/>}> </Route>
  </Routes>
  );
}

export default App;
