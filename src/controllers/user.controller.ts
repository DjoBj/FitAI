import { Request, Response } from 'express';
import { User } from '../models/user.model';

export class UserController {
  public static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      res.status(200).json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch profile', error: (error as Error).message });
    }
  }

  public static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { firstName, lastName, phoneNumber, birthDate } = req.body;
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (phoneNumber) user.phoneNumber = phoneNumber;
      if (birthDate) user.birthDate = new Date(birthDate);

      await user.save();
      res.status(200).json({ success: true, message: 'Profile updated successfully', user });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update profile', error: (error as Error).message });
    }
  }
}