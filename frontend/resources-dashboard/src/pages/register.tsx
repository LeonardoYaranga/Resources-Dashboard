"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const response = await fetch("http://localhost:8000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();
    if (response.ok) {
      router.push("/login");
    } else {
      setError(data.detail);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center">Registro</h2>
        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        <form onSubmit={handleRegister} className="space-y-4 mt-4">
          <input type="text" placeholder="Nombre de usuario" className="w-full p-2 border rounded-md"
            value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input type="email" placeholder="Correo" className="w-full p-2 border rounded-md"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Contraseña" className="w-full p-2 border rounded-md"
            value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="w-full bg-green-500 text-white p-2 rounded-md font-bold hover:bg-green-700">
            Registrarse
          </button>
        </form>
        <p className="text-center mt-4">¿Ya tienes cuenta? <a href="/login" className="text-blue-500">Inicia sesión</a></p>
      </div>
    </div>
  );
}
