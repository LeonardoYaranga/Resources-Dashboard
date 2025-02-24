"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/utils/auth";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/main/home");
    } else {
      router.push("/login");
    }
  }, []);

  return <div className="flex justify-center items-center h-screen">Cargando...</div>;
}
