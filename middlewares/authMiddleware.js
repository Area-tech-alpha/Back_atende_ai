import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    console.log("Acesso negado. Nenhum token fornecido.");
    return res.status(401).json({ error: "Acesso negado. Nenhum token fornecido." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Token inválido ou expirado." });
  }
};
