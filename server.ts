import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";

// Load Firebase config manually to be more robust in ESM
const firebaseConfigPath = path.resolve(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

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
  app.post("/api/auth/send-otp", async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: "Phone number is required" });

    // Set default OTP to 200824 for testing
    const code = "200824"; 
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins
    
    try {
      await setDoc(doc(db, "verification_codes", phoneNumber), {
        email: phoneNumber, // Using phone as email for this mock
        code,
        type: "login_verify",
        status: "pending",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(expiresAt).toISOString()
      });
      console.log(`[OTP] Sent to ${phoneNumber}: ${code}`);
      res.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    const { phoneNumber, code } = req.body;
    
    try {
      const otpDoc = await getDoc(doc(db, "verification_codes", phoneNumber));
      if (!otpDoc.exists()) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }
      
      const otpData = otpDoc.data();
      const expiresAt = new Date(otpData.expiresAt).getTime();

      if (otpData.code !== code || expiresAt < Date.now() || otpData.status !== "pending") {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      await updateDoc(doc(db, "verification_codes", phoneNumber), { status: "used" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ error: "Failed to verify OTP" });
    }
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
  app.post("/api/oauth/authorize", async (req, res) => {
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
    try {
      await setDoc(doc(db, "oauth_codes", code), {
        clientId: client_id,
        redirectUri: redirect_uri,
        userId: user_id,
        email,
        name,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
      });
      res.json({ code });
    } catch (error) {
      console.error("Error generating auth code:", error);
      res.status(500).json({ error: "Failed to generate auth code" });
    }
  });

  // 3. Token Endpoint (called by the third-party backend to exchange code for token)
  app.post("/oauth/token", async (req, res) => {
    const { grant_type, code, redirect_uri, client_id, client_secret } = req.body;

    if (grant_type !== "authorization_code") {
      return res.status(400).json({ error: "unsupported_grant_type" });
    }

    const client = clients.find(c => c.clientId === client_id && c.clientSecret === client_secret);
    if (!client) {
      return res.status(401).json({ error: "invalid_client" });
    }

    try {
      const authDoc = await getDoc(doc(db, "oauth_codes", code));
      if (!authDoc.exists()) {
        return res.status(400).json({ error: "invalid_grant" });
      }
      
      const authData = authDoc.data();
      if (authData.clientId !== client_id || authData.expiresAt < Date.now()) {
        return res.status(400).json({ error: "invalid_grant" });
      }

      // Generate access token
      const accessToken = uuidv4();
      await setDoc(doc(db, "oauth_tokens", accessToken), {
        userId: authData.userId,
        email: authData.email,
        name: authData.name,
        clientId: client_id,
        expiresAt: Date.now() + 60 * 60 * 1000 // 1 hour
      });

      // Invalidate code
      await deleteDoc(doc(db, "oauth_codes", code));

      res.json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 3600
      });
    } catch (error) {
      console.error("Error exchanging token:", error);
      res.status(500).json({ error: "Failed to exchange token" });
    }
  });

  // 4. UserInfo Endpoint (called by third-party backend with access token)
  app.get("/oauth/userinfo", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "invalid_token" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const tokenDoc = await getDoc(doc(db, "oauth_tokens", token));
      if (!tokenDoc.exists()) {
        return res.status(401).json({ error: "invalid_token" });
      }
      
      const tokenData = tokenDoc.data();
      if (tokenData.expiresAt < Date.now()) {
        return res.status(401).json({ error: "invalid_token" });
      }

      res.json({
        sub: tokenData.userId,
        email: tokenData.email,
        name: tokenData.name
      });
    } catch (error) {
      console.error("Error fetching user info:", error);
      res.status(500).json({ error: "Failed to fetch user info" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Ensure SPA fallback even in dev if vite.middlewares doesn't catch it
    app.get('*', async (req, res, next) => {
      // Skip API routes and specific server-only OAuth routes
      const serverRoutes = ['/api', '/oauth/token', '/oauth/userinfo'];
      if (serverRoutes.some(route => req.originalUrl.startsWith(route))) {
        return next();
      }
      
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      // Fallback if dist doesn't exist but we're in production mode
      app.get('*', (req, res) => {
        res.status(404).send("Production build not found. Please run 'npm run build'.");
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
