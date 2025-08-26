import express from "express";
import jwt from "jsonwebtoken";
import { getSupabase } from "../src/services/whatsappService.js";
import argon2 from "argon2";
import crypto from "crypto";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const authRouter = express.Router();
const supabase = getSupabase();

authRouter.get("/me", authMiddleware, (req, res) => {
  res.status(200).json({ user: req.user });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios." });
  }

  try {
    const { data: user, error: findError } = await supabase
      .from("login_evolution")
      .select("*")
      .eq("email", email)
      .single();

    if (findError || !user) {
      console.warn(`Tentativa de login falhou para o email: ${email} (usuário não encontrado)`);
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const isPasswordValid = await argon2.verify(user.senha, password);

    if (!isPasswordValid) {
      console.warn(`Tentativa de login falhou para o email: ${email} (senha incorreta)`);
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const safeUserData = {
      id: user.id,
      email: user.email,
      nome_da_instancia: user.nome_da_instancia,
      id_instancia: user.id_instancia,
      apikey: user.apikey,
    };

    const token = jwt.sign(safeUserData, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login bem-sucedido",
      user: safeUserData,
    });
  } catch (error) {
    console.error("Erro inesperado no login:", error);
    return res.status(500).json({ error: "Ocorreu um erro inesperado." });
  }
});

authRouter.post("/register", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, senha e nome são obrigatórios." });
  }

  try {
    const { data: existingUser, error: existingUserError } = await supabase
      .from("login_evolution")
      .select("email, nome_da_instancia")
      .or(`email.eq.${email},nome_da_instancia.eq.${name}`);

    if (existingUserError) {
      console.error("Erro ao verificar usuário existente:", existingUserError);
      return res.status(500).json({ error: "Erro ao verificar usuário." });
    }

    if (existingUser && existingUser.length > 0) {
      return res.status(409).json({ error: "Email ou nome da instância já em uso." });
    }

    const hashedPassword = await argon2.hash(password);

    const apikey = crypto.randomBytes(24).toString("hex");
    const id_instancia = crypto.randomBytes(12).toString("hex");

    const { data, error: insertError } = await supabase
      .from("login_evolution")
      .insert([
        {
          email,
          senha: hashedPassword,
          nome_da_instancia: name,
          id_instancia,
          apikey,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Erro ao inserir usuário:", insertError);
      return res.status(500).json({ error: "Erro ao criar a conta." });
    }

    return res.status(201).json({
      message: "Registro bem-sucedido",
      user: { id: data.id, email: data.email, name: data.nome_da_instancia },
    });
  } catch (error) {
    console.error("Erro inesperado no registro:", error);
    return res.status(500).json({ error: "Ocorreu um erro inesperado." });
  }
});

authRouter.post("/logout", (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    expires: new Date(0),
  });

  res.status(200).json({ message: "Logout bem-sucedido." });
});

export default authRouter;
