import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import nodemailer from "nodemailer";

// Load Firebase config manually to be more robust in ESM
const firebaseConfigPath = path.resolve(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Setup Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sloudsan@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD || ''
  }
});

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
  },
  {
    clientId: "sanscounts-client-id",
    clientSecret: "sanscounts-secret",
    redirectUris: ["http://localhost:3000/auth/callback", "https://sanscounts.run.app/auth/callback"],
    name: "Sanscounts"
  },
  {
    clientId: "sansnsea-client-id",
    clientSecret: "sansnsea-secret",
    redirectUris: ["http://localhost:3000/auth/callback", "https://sansnsea.run.app/auth/callback"],
    name: "Sansnsea"
  },
  {
    clientId: "sansmap-client-id",
    clientSecret: "sansmap-secret",
    redirectUris: ["http://localhost:3000/auth/callback", "https://sansmap.run.app/auth/callback"],
    name: "Sansmap"
  }
];

async function startServer() {
  console.log("Starting server initialization...");
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  console.log("Setting up API routes...");
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

  // Email OTP Endpoint
  app.post("/api/auth/send-otp-email", async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: "Missing email or code" });

    if (!process.env.GMAIL_APP_PASSWORD) {
      console.warn("GMAIL_APP_PASSWORD is not set. Simulating email send.");
      return res.json({ success: true, simulated: true });
    }

    try {
      await transporter.sendMail({
        from: '"Sanscounts Security" <sloudsan@gmail.com>',
        to: email,
        subject: 'Your Sanscounts Verification Code',
        text: `Your verification code is: ${code}. It will expire in 10 minutes.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #18181b; margin-bottom: 20px;">Sanscounts Verification</h2>
            <p style="color: #52525b; font-size: 16px;">Your verification code is:</p>
            <div style="background-color: #f4f4f5; padding: 16px; border-radius: 6px; text-align: center; margin: 24px 0;">
              <h1 style="font-size: 36px; letter-spacing: 8px; color: #0ea5e9; margin: 0;">${code}</h1>
            </div>
            <p style="color: #52525b; font-size: 14px;">This code will expire in 10 minutes.</p>
            <p style="color: #a1a1aa; font-size: 12px; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px;">If you didn't request this, please ignore this email.</p>
          </div>
        `
      });
      console.log(`[Email OTP] Sent to ${email}: ${code}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // 1. Endpoint to verify client details (used by the frontend consent screen)
  app.get("/api/oauth/client", async (req, res) => {
    const { client_id } = req.query;
    
    // Check hardcoded clients first
    let client = clients.find(c => c.clientId === client_id);
    
    if (!client) {
      try {
        const q = query(collection(db, "developer_apps"), where("clientId", "==", client_id));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const appData = snapshot.docs[0].data();
          client = {
            clientId: appData.clientId,
            clientSecret: appData.clientSecret,
            redirectUris: [], // We don't strictly validate redirect URIs in this prototype
            name: appData.name
          };
        }
      } catch (error) {
        console.error("Error fetching client from Firestore:", error);
      }
    }

    // Auto-accept any client id for easy prototyping (e.g. sansnsea-client-id)
    if (!client && typeof client_id === 'string' && client_id.includes('-client-id')) {
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
    
    if (!client) {
      try {
        const q = query(collection(db, "developer_apps"), where("clientId", "==", client_id));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const appData = snapshot.docs[0].data();
          client = {
            clientId: appData.clientId,
            clientSecret: appData.clientSecret,
            redirectUris: [appData.appUrl],
            name: appData.appName
          };
        }
      } catch (error) {
        console.error("Server: Error fetching client from Firestore:", error);
      }
    }

    // Auto-accept any client id for easy prototyping
    if (!client && typeof client_id === 'string' && client_id.includes('-client-id')) {
      const clientName = client_id.replace('-client-id', '');
      client = {
        clientId: client_id,
        clientSecret: 'secret',
        redirectUris: [],
        name: clientName.charAt(0).toUpperCase() + clientName.slice(1)
      };
    }

    if (!client) {
      console.log("Server: Client not found:", client_id);
      return res.status(400).json({ error: "invalid_client" });
    }

    // Flexible redirect URI check for prototyping
    // In production, this should be strictly enforced
    const isDemoClient = 
      client_id === "sansncar-client-id" || 
      client_id === "sansneat-client-id" || 
      client_id === "sanscounts-client-id" ||
      client_id === "sansnsea-client-id" ||
      client_id === "sansmap-client-id";
    const isLocalhost = redirect_uri?.includes("localhost") || redirect_uri?.includes("127.0.0.1");
    const isRunApp = redirect_uri?.includes(".run.app");
    
    if (!isDemoClient && client.redirectUris.length > 0 && !client.redirectUris.includes(redirect_uri)) {
      console.log("Server: Redirect URI mismatch:", { provided: redirect_uri, registered: client.redirectUris });
      // For now, we'll just log it but allow it if it's a .run.app URL to avoid blocking users in this environment
      if (!isRunApp && !isLocalhost) {
        return res.status(400).json({ error: "invalid_redirect_uri" });
      }
    }

    console.log("Server: Authorizing client:", { client_id, redirect_uri, user_id });

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
    let validClient = !!client;

    if (!validClient) {
      try {
        const q = query(collection(db, "developer_apps"), 
          where("clientId", "==", client_id),
          where("clientSecret", "==", client_secret)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          validClient = true;
        }
      } catch (error) {
        console.error("Error validating client from Firestore:", error);
      }
    }

    if (!validClient) {
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
    const code = req.query.code as string;

    // Support fetching with code (for demo client convenience)
    if (code) {
      try {
        const authDoc = await getDoc(doc(db, "oauth_codes", code));
        if (!authDoc.exists()) {
          return res.status(401).json({ error: "invalid_code" });
        }
        const authData = authDoc.data();
        if (authData.expiresAt < Date.now()) {
          return res.status(401).json({ error: "code_expired" });
        }
        return res.json({
          userId: authData.userId,
          email: authData.email,
          name: authData.name
        });
      } catch (error) {
        console.error("Error fetching user info with code:", error);
        return res.status(500).json({ error: "internal_error" });
      }
    }

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

  console.log("Initializing Vite middleware...");
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log("Application is ready to receive requests.");
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
