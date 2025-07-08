import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertReceiptSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import sharp from "sharp";
import { google } from "googleapis";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Google OAuth configuration
const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
  (process.env.REPLIT_DOMAINS ? 
    `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/auth/callback` : 
    'http://localhost:5000/auth/callback');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  redirectUri
);

const drive = google.drive({ version: 'v3', auth: oauth2Client });

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.get('/api/auth/google', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/drive.file'
      ],
      prompt: 'consent'
    });
    res.json({ authUrl });
  });

  // Debug endpoint to check OAuth config
  app.get('/api/auth/debug', (req, res) => {
    res.json({
      clientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set',
      redirectUri: redirectUri,
      domain: process.env.REPLIT_DOMAINS
    });
  });

  // OAuth callback route (handles redirect from Google)
  app.get('/auth/callback', async (req, res) => {
    try {
      const code = req.query.code as string;
      
      if (!code) {
        console.error('No authorization code received');
        return res.redirect('/login?error=no_code');
      }

      console.log('Processing OAuth callback with code:', code.substring(0, 20) + '...');
      console.log('Using redirect URI:', redirectUri);
      
      // Use the correct method to exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      
      if (!tokens || !tokens.access_token) {
        console.error('Failed to get access token from Google');
        return res.redirect('/login?error=token_failed');
      }
      
      console.log('Successfully got tokens');
      oauth2Client.setCredentials(tokens);

      // Get user info
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const { data: userInfo } = await oauth2.userinfo.get();

      if (!userInfo.id || !userInfo.email || !userInfo.name) {
        console.error('Invalid user info received from Google');
        return res.redirect('/login?error=invalid_user');
      }

      console.log('User info received:', { email: userInfo.email, name: userInfo.name });

      // Check if user exists
      let user = await storage.getUserByGoogleId(userInfo.id);
      
      if (!user) {
        // Create new user
        console.log('Creating new user');
        const newUser = insertUserSchema.parse({
          googleId: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          profilePicture: userInfo.picture || null,
          accessToken: tokens.access_token || null,
          refreshToken: tokens.refresh_token || null,
        });
        user = await storage.createUser(newUser);
      } else {
        // Update existing user tokens
        console.log('Updating existing user tokens');
        user = await storage.updateUser(user.id, {
          accessToken: tokens.access_token || null,
          refreshToken: tokens.refresh_token || null,
        });
      }

      if (!user) {
        console.error('Failed to create or update user');
        return res.redirect('/login?error=user_creation_failed');
      }

      // Initialize session if not exists
      if (!req.session) {
        console.error('Session not initialized');
        return res.redirect('/login?error=session_error');
      }

      // Store user in session
      req.session.userId = user.id;
      console.log('User logged in successfully:', { userId: user.id, email: user.email });
      
      // Redirect to home page
      res.redirect('/');
    } catch (error) {
      console.error('OAuth callback error:', error);
      // More specific error handling
      if (error.message?.includes('refresh token')) {
        console.error('Refresh token error - user may need to reauthorize');
        return res.redirect('/login?error=reauth_needed');
      }
      if (error.message?.includes('invalid_grant')) {
        console.error('Invalid grant error - authorization code may be expired');
        return res.redirect('/login?error=code_expired');
      }
      res.redirect('/login?error=auth_failed');
    }
  });

  app.post('/api/auth/callback', async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: 'Authorization code is required' });
      }

      const { tokens } = await oauth2Client.getAccessToken(code);
      oauth2Client.setCredentials(tokens);

      // Get user info
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const { data: userInfo } = await oauth2.userinfo.get();

      if (!userInfo.id || !userInfo.email || !userInfo.name) {
        return res.status(400).json({ message: 'Failed to get user information' });
      }

      // Check if user exists
      let user = await storage.getUserByGoogleId(userInfo.id);
      
      if (!user) {
        // Create new user
        const newUser = insertUserSchema.parse({
          googleId: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          profilePicture: userInfo.picture,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        });
        user = await storage.createUser(newUser);
      } else {
        // Update existing user tokens
        user = await storage.updateUser(user.id, {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        });
      }

      // Store user in session
      req.session.userId = user!.id;
      
      res.json({ 
        user: {
          id: user!.id,
          email: user!.email,
          name: user!.name,
          profilePicture: user!.profilePicture,
        }
      });
    } catch (error) {
      console.error('Auth callback error:', error);
      res.status(500).json({ message: 'Authentication failed' });
    }
  });

  app.get('/api/auth/user', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to get user' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Receipt routes
  app.get('/api/receipts', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const receipts = await storage.getReceiptsByUserId(req.session.userId);
      res.json(receipts);
    } catch (error) {
      console.error('Get receipts error:', error);
      res.status(500).json({ message: 'Failed to get receipts' });
    }
  });

  app.get('/api/receipts/recent', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const receipts = await storage.getRecentReceipts(req.session.userId, limit);
      res.json(receipts);
    } catch (error) {
      console.error('Get recent receipts error:', error);
      res.status(500).json({ message: 'Failed to get recent receipts' });
    }
  });

  app.post('/api/receipts/upload', upload.single('receipt'), async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Set up OAuth client with user tokens
      oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken,
      });

      // Compress image
      const compressedBuffer = await sharp(req.file.buffer)
        .jpeg({ quality: 85 })
        .resize(1200, 1600, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .toBuffer();

      // Generate folder structure
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const timestamp = now.toISOString().replace(/[:.]/g, '-');
      const folderPath = `receipts/${user.email.split('@')[0]}/${dateStr}`;
      const fileName = `receipt-${timestamp}.jpg`;

      // Create folder structure in Google Drive
      const folders = folderPath.split('/');
      let parentId = 'root';
      
      for (const folderName of folders) {
        const { data: existingFolders } = await drive.files.list({
          q: `name='${folderName}' and parents in '${parentId}' and mimeType='application/vnd.google-apps.folder'`,
          fields: 'files(id, name)',
        });

        if (existingFolders.files && existingFolders.files.length > 0) {
          parentId = existingFolders.files[0].id!;
        } else {
          const { data: newFolder } = await drive.files.create({
            requestBody: {
              name: folderName,
              mimeType: 'application/vnd.google-apps.folder',
              parents: [parentId],
            },
            fields: 'id',
          });
          parentId = newFolder.id!;
        }
      }

      // Upload file to Google Drive
      const { data: file } = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [parentId],
        },
        media: {
          mimeType: 'image/jpeg',
          body: Buffer.from(compressedBuffer),
        },
        fields: 'id, webViewLink, thumbnailLink',
      });

      // Save receipt to storage
      const receipt = await storage.createReceipt({
        userId: req.session.userId,
        fileName,
        originalName: req.file.originalname,
        googleDriveId: file.id!,
        driveUrl: file.webViewLink!,
        thumbnailUrl: file.thumbnailLink || null,
        fileSize: compressedBuffer.length,
        mimeType: 'image/jpeg',
        folderPath,
      });

      res.json(receipt);
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Failed to upload receipt' });
    }
  });

  app.get('/api/receipts/:id', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const receiptId = parseInt(req.params.id);
      const receipt = await storage.getReceipt(receiptId);
      
      if (!receipt) {
        return res.status(404).json({ message: 'Receipt not found' });
      }

      if (receipt.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json(receipt);
    } catch (error) {
      console.error('Get receipt error:', error);
      res.status(500).json({ message: 'Failed to get receipt' });
    }
  });

  app.delete('/api/receipts/:id', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const receiptId = parseInt(req.params.id);
      const receipt = await storage.getReceipt(receiptId);
      
      if (!receipt) {
        return res.status(404).json({ message: 'Receipt not found' });
      }

      if (receipt.userId !== req.session.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Delete from Google Drive
      oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken,
      });

      await drive.files.delete({
        fileId: receipt.googleDriveId,
      });

      // Delete from storage
      await storage.deleteReceipt(receiptId);

      res.json({ message: 'Receipt deleted successfully' });
    } catch (error) {
      console.error('Delete receipt error:', error);
      res.status(500).json({ message: 'Failed to delete receipt' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
