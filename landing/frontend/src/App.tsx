import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Submit from './pages/Submit';
import TokenCounter from './pages/TokenCounter';
import Admin from './pages/Admin';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/submit" element={<Submit />} />
              <Route path="/token-counter" element={<TokenCounter />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
