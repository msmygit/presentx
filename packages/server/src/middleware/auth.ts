import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getUsersCollection, UserDocument } from '../db/astra-client'; // Import type
import { config } from '../config'; // Import config for JWT secret

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    // Fetch user from Astra DB
    const usersCollection = getUsersCollection();
    const userDocument = await usersCollection.findOne(
        { _id: decoded.userId }, 
        { projection: { email: 1 } } // Only fetch necessary fields
    );

    if (!userDocument) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (userDocument) {
      req.user = { id: userDocument._id, email: userDocument.email };
    } else {
      return res.status(401).json({ error: 'User not found' });
    }

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}; 