import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import fs from 'fs';
import path from 'path';

// Load Firebase config
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = express();

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// OTP Store (In-memory for speed, but could be Firestore)
const otps = new Map<string, { code: string, expiresAt: number }>();

// Pre-registered clients
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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// OTP Endpoints
app.post("/api/auth/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otps.set(email, { code, expiresAt: Date.now() + 5 * 60 * 1000 }); // 5 mins

  console.log(`[OTP] Sent to ${email}: ${code}`);
  
  // In a real app, you would use an email service here.
  // Example with Resend:
  // if (process.env.RESEND_API_KEY) { ... send email ... }

  res.json({ success: true, message: "OTP sent successfully" });
});

app.post("/api/auth/verify-otp", async (req, res) => {
  const { email, code } = req.body;
  const otpData = otps.get(email);

  if (!otpData || otpData.code !== code || otpData.expiresAt < Date.now()) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  otps.delete(email);
  res.json({ success: true });
});

// API routes
app.get("/api/oauth/client", (req, res) => {
  const { client_id } = req.query;
  let client = clients.find(c => c.clientId === client_id);
  
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

app.post("/api/oauth/authorize", async (req, res) => {
  const { client_id, redirect_uri, user_id, email, name } = req.body;
  
  let client = clients.find(c => c.clientId === client_id);
  
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

  const code = uuidv4();
  
  // Store in Firestore
  await setDoc(doc(db, "oauth_codes", code), {
    clientId: client_id,
    redirectUri: redirect_uri,
    userId: user_id,
    email,
    name,
    expiresAt: Date.now() + 10 * 60 * 1000
  });

  res.json({ code });
});

app.post("/oauth/token", async (req, res) => {
  const { grant_type, code, redirect_uri, client_id, client_secret } = req.body;

  if (grant_type !== "authorization_code") {
    return res.status(400).json({ error: "unsupported_grant_type" });
  }

  const client = clients.find(c => c.clientId === client_id && c.clientSecret === client_secret);
  if (!client) {
    return res.status(401).json({ error: "invalid_client" });
  }

  // Get from Firestore
  const codeDoc = await getDoc(doc(db, "oauth_codes", code));
  const authData = codeDoc.data();

  if (!authData || authData.clientId !== client_id || authData.expiresAt < Date.now()) {
    return res.status(400).json({ error: "invalid_grant" });
  }

  const accessToken = uuidv4();
  
  // Store in Firestore
  await setDoc(doc(db, "oauth_tokens", accessToken), {
    userId: authData.userId,
    email: authData.email,
    name: authData.name,
    clientId: client_id,
    expiresAt: Date.now() + 60 * 60 * 1000
  });

  // Delete code
  await deleteDoc(doc(db, "oauth_codes", code));

  res.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600
  });
});

app.get("/oauth/userinfo", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "invalid_token" });
  }

  const token = authHeader.split(" ")[1];
  
  // Get from Firestore
  const tokenDoc = await getDoc(doc(db, "oauth_tokens", token));
  const tokenData = tokenDoc.data();

  if (!tokenData || tokenData.expiresAt < Date.now()) {
    return res.status(401).json({ error: "invalid_token" });
  }

  res.json({
    sub: tokenData.userId,
    email: tokenData.email,
    name: tokenData.name
  });
});

export default app;
