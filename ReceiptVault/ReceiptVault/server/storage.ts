import { users, receipts, type User, type InsertUser, type Receipt, type InsertReceipt } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  
  // Receipt operations
  getReceipt(id: number): Promise<Receipt | undefined>;
  getReceiptsByUserId(userId: number): Promise<Receipt[]>;
  getRecentReceipts(userId: number, limit?: number): Promise<Receipt[]>;
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;
  deleteReceipt(id: number): Promise<boolean>;
  getReceiptsByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Receipt[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private receipts: Map<number, Receipt>;
  private currentUserId: number;
  private currentReceiptId: number;

  constructor() {
    this.users = new Map();
    this.receipts = new Map();
    this.currentUserId = 1;
    this.currentReceiptId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.googleId === googleId);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getReceipt(id: number): Promise<Receipt | undefined> {
    return this.receipts.get(id);
  }

  async getReceiptsByUserId(userId: number): Promise<Receipt[]> {
    return Array.from(this.receipts.values())
      .filter(receipt => receipt.userId === userId)
      .sort((a, b) => new Date(b.uploadDate!).getTime() - new Date(a.uploadDate!).getTime());
  }

  async getRecentReceipts(userId: number, limit: number = 20): Promise<Receipt[]> {
    const userReceipts = await this.getReceiptsByUserId(userId);
    return userReceipts.slice(0, limit);
  }

  async createReceipt(insertReceipt: InsertReceipt): Promise<Receipt> {
    const id = this.currentReceiptId++;
    const receipt: Receipt = {
      ...insertReceipt,
      id,
      uploadDate: new Date(),
    };
    this.receipts.set(id, receipt);
    return receipt;
  }

  async deleteReceipt(id: number): Promise<boolean> {
    return this.receipts.delete(id);
  }

  async getReceiptsByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Receipt[]> {
    return Array.from(this.receipts.values())
      .filter(receipt => {
        if (receipt.userId !== userId) return false;
        const uploadDate = new Date(receipt.uploadDate!);
        return uploadDate >= startDate && uploadDate <= endDate;
      })
      .sort((a, b) => new Date(b.uploadDate!).getTime() - new Date(a.uploadDate!).getTime());
  }
}

export const storage = new MemStorage();
