"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

//import { login } from "@/utils/auth";  antes con token en la local storage

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validar que email y password no estén vacíos
    if (!email || !password) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    const response = await fetch("http://localhost:8000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password: password.trim() }), // Eliminar espacios en blanco
    });

    const data = await response.json();
    if (response.ok) {
        Cookies.set("token", data.access_token, { expires: 1 });
        router.push("/main/home");
    } else {
      // Manejar error de validación
      if (Array.isArray(data.detail)) {
        setError(data.detail.map((err: any) => err.msg).join(", ")); // Extraer solo los mensajes de error
      } else {
        setError(data.detail);
      }
    }
  };


  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center">Iniciar Sesión</h2>
        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4 mt-4">
          <input type="email" placeholder="Correo" className="w-full p-2 border rounded-md"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Contraseña" className="w-full p-2 border rounded-md"
            value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded-md font-bold hover:bg-blue-700">
            Iniciar Sesión
          </button>
        </form>
        <p className="text-center mt-4">¿No tienes cuenta? <a href="/register" className="text-blue-500">Regístrate</a></p>
      </div>
    </div>
  );
}
