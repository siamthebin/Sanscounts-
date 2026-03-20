import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// In-memory store for the prototype. In production, this would be Firestore.
// Since we don't have a service account for firebase-admin, we mock the OAuth DB here.
const authCodes = new Map<string, any>();
const accessTokens = new Map<string, any>();
const otps = new Map<string, { code: string, expiresAt: number }>();

// Pre-registered clients (e.g., Sansneat, Sansncar)
const clients = [
  {
    clientId: "sansneat-client-id",
    clientSecret: "sansneat-secret",
    redirectUris: ["http://localhost:3000/auth/callback", "https://sansneat.run.app/auth/callback"],
    name: "Sansneat"
  },
  {
    clientId: "sansncar-client-id",
    clientSecret: "sansncar-secret",
    redirectUris: ["http://localhost:3000/auth/callback", "https://sansncar.run.app/auth/callback"],
    name: "Sansncar"
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API routes FIRST
  
  // OTP Endpoints
  app.post("/api/auth/send-otp", (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: "Phone number is required" });

    // Set default OTP to 200824 for testing
    const code = "200824"; 
    otps.set(phoneNumber, { code, expiresAt: Date.now() + 5 * 60 * 1000 }); // 5 mins

    console.log(`[OTP] Sent to ${phoneNumber}: ${code}`);
    res.json({ success: true, message: "OTP sent successfully" });
  });

  app.post("/api/auth/verify-otp", (req, res) => {
    const { phoneNumber, code } = req.body;
    const otpData = otps.get(phoneNumber);

    if (!otpData || otpData.code !== code || otpData.expiresAt < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    otps.delete(phoneNumber);
    res.json({ success: true });
  });

  // 1. Endpoint to verify client details (used by the frontend consent screen)
  app.get("/api/oauth/client", (req, res) => {
    const { client_id } = req.query;
    let client = clients.find(c => c.clientId === client_id);
    
    // Auto-accept any client id for easy prototyping (e.g. sansnsea-client-id)
    if (!client && typeof client_id === 'string') {
      const name = client_id.replace('-client-id', '');
      client = {
        clientId: client_id,
        clientSecret: 'secret',
        redirectUris: [],
        name: name.charAt(0).toUpperCase() + name.slice(1)
      };
    }

    if (!client) {
      return res.status(404).json({ error: "invalid_client" });
    }
    res.json({ name: client.name });
  });

  // 2. Endpoint to generate an authorization code (called by frontend after user consents)
  app.post("/api/oauth/authorize", (req, res) => {
    const { client_id, redirect_uri, user_id, email, name } = req.body;
    
    // Basic validation
    let client = clients.find(c => c.clientId === client_id);
    
    // Auto-accept any client id for easy prototyping
    if (!client && typeof client_id === 'string') {
      const clientName = client_id.replace('-client-id', '');
      client = {
        clientId: client_id,
        clientSecret: 'secret',
        redirectUris: [],
        name: clientName.charAt(0).toUpperCase() + clientName.slice(1)
      };
    }

    if (!client) {
      return res.status(400).json({ error: "invalid_client" });
    }

    // Generate auth code
    const code = uuidv4();
    authCodes.set(code, {
      clientId: client_id,
      redirectUri: redirect_uri,
      userId: user_id,
      email,
      name,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    res.json({ code });
  });

  // 3. Token Endpoint (called by the third-party backend to exchange code for token)
  app.post("/oauth/token", (req, res) => {
    const { grant_type, code, redirect_uri, client_id, client_secret } = req.body;

    if (grant_type !== "authorization_code") {
      return res.status(400).json({ error: "unsupported_grant_type" });
    }

    const client = clients.find(c => c.clientId === client_id && c.clientSecret === client_secret);
    if (!client) {
      return res.status(401).json({ error: "invalid_client" });
    }

    const authData = authCodes.get(code);
    if (!authData || authData.clientId !== client_id || authData.expiresAt < Date.now()) {
      return res.status(400).json({ error: "invalid_grant" });
    }

    // Generate access token
    const accessToken = uuidv4();
    accessTokens.set(accessToken, {
      userId: authData.userId,
      email: authData.email,
      name: authData.name,
      clientId: client_id,
      expiresAt: Date.now() + 60 * 60 * 1000 // 1 hour
    });

    // Invalidate code
    authCodes.delete(code);

    res.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600
    });
  });

  // 4. UserInfo Endpoint (called by third-party backend with access token)
  app.get("/oauth/userinfo", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "invalid_token" });
    }

    const token = authHeader.split(" ")[1];
    const tokenData = accessTokens.get(token);

    if (!tokenData || tokenData.expiresAt < Date.now()) {
      return res.status(401).json({ error: "invalid_token" });
    }

    res.json({
      sub: tokenData.userId,
      email: tokenData.email,
      name: tokenData.name
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
