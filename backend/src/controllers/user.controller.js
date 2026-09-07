import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/index.js";
import { sendCredentialsEmail } from "../services/email.service.js";

const isValidId = (id) => mongoose.isValidObjectId(id);

const createUser = async (req, res) => {
  try {
    const { role, name, email, firebaseUid, password } = req.body;

    if (!role || !name || !email) {
      return res.status(400).json({
        success: false,
        message: "role, name, and email are required.",
      });
    }

    if (role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be created through signup.",
      });
    }

    let hashedPassword = undefined;
    if (password && password.trim()) {
      hashedPassword = await bcrypt.hash(password.trim(), 10);
    }

    // Auto-generate firebaseUid for local/demo signups if not provided
    const userPayload = {
      ...req.body,
      firebaseUid: firebaseUid || `uid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      password: hashedPassword,
    };

    const user = await User.create(userPayload);

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.firebaseUid;
    delete safeUser.__v;

    return res.status(201).json({
      success: true,
      message: "User profile created successfully.",
      data: safeUser,
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0] || "email";

      return res.status(409).json({
        success: false,
        message: `A user with this ${duplicateField} already exists.`,
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create user error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create the user profile.",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required to sign in.",
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("-firebaseUid -__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this email address. Please check your email or register.",
      });
    }

    // Verify password if user has a password set
    if (user.password) {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Password is required to sign in.",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Incorrect password. Please try again.",
        });
      }
    }

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.status(200).json({
      success: true,
      message: "Signed in successfully.",
      data: safeUser,
    });
  } catch (error) {
    console.error("Login user error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to complete sign in.",
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select("-password -firebaseUid -__v")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch users list.",
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidId(userId)) {
      return res.status(400).json({
        success: false,
        message: "userId must be a valid ID.",
      });
    }

    const user = await User.findById(userId).select("-password -firebaseUid -__v");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch user profile.",
    });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const actorId = req.user?._id || req.body.actorId || userId;

    if (!isValidId(userId)) {
      return res.status(400).json({
        success: false,
        message: "userId must be a valid ID.",
      });
    }

    // Only the user themselves or an admin can update the profile
    if (actorId.toString() !== userId.toString() && req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You can only update your own profile.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const allowedUpdates = [
      "name",
      "branch",
      "batch",
      "skills",
      "linkedinUrl",
      "githubUrl",
      "bio",
      "currentCompany",
      "currentRole",
      "industry",
      "areasOfExpertise",
      "availableForMentorshipCalls",
      "willingToRefer",
      "careerGoal",
      "resumeUrl",
    ];

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        user[key] = req.body[key];
      }
    }

    // Password update handling with current password verification
    if (req.body.newPassword && req.body.newPassword.trim()) {
      if (req.body.currentPassword && user.password) {
        const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({
            success: false,
            message: "Current password is incorrect.",
          });
        }
      }
      user.password = await bcrypt.hash(req.body.newPassword.trim(), 10);
    } else if (req.body.password && req.body.password.trim()) {
      user.password = await bcrypt.hash(req.body.password.trim(), 10);
    }

    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.firebaseUid;
    delete safeUser.__v;

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: safeUser,
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update profile.",
    });
  }
};

const verifyAlumni = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isVerified = true, adminId } = req.body;
    const callerId = req.user?._id || adminId;

    if (!isValidId(userId)) {
      return res.status(400).json({
        success: false,
        message: "userId must be a valid ID.",
      });
    }

    // Verify admin privileges
    if (req.user?.role !== "admin") {
      if (!callerId || !isValidId(callerId)) {
        return res.status(403).json({
          success: false,
          message: "Admin privileges required.",
        });
      }
      const adminUser = await User.findById(callerId);
      if (!adminUser || adminUser.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only administrators can verify alumni.",
        });
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.role !== "alumni") {
      return res.status(400).json({
        success: false,
        message: "Only alumni profiles can be verified.",
      });
    }

    user.isVerified = Boolean(isVerified);
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Alumni verification status updated to ${user.isVerified}.`,
      data: {
        userId: user._id,
        name: user.name,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Verify alumni error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update alumni verification status.",
    });
  }
};

const onboardUser = async (req, res) => {
  try {
    const callerId = req.headers["x-user-id"] || req.user?._id || req.body.adminId;
    if (callerId && isValidId(callerId)) {
      const admin = await User.findById(callerId);
      if (admin && admin.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only administrators can onboard users.",
        });
      }
    }

    const { role, name, email, linkedinUrl, defaultPassword } = req.body;

    if (!role || !name || !email) {
      return res.status(400).json({
        success: false,
        message: "role, name, and email are required.",
      });
    }

    if (!["student", "alumni"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be either 'student' or 'alumni'.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A user with email ${normalizedEmail} already exists.`,
      });
    }

    const passwordToUse = (defaultPassword && defaultPassword.trim()) || "Thapar@2026";
    const hashedPassword = await bcrypt.hash(passwordToUse, 10);

    const newUser = await User.create({
      role,
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      linkedinUrl: role === "alumni" && linkedinUrl ? linkedinUrl.trim() : undefined,
      isVerified: role === "alumni" ? true : false,
    });

    // Send email dispatch
    await sendCredentialsEmail({
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      defaultPassword: passwordToUse,
    });

    const safeUser = newUser.toObject();
    delete safeUser.password;
    delete safeUser.firebaseUid;
    delete safeUser.__v;

    return res.status(201).json({
      success: true,
      message: `Account for ${newUser.name} provisioned successfully. Credentials emailed.`,
      data: {
        user: safeUser,
        defaultPassword: passwordToUse,
      },
    });
  } catch (error) {
    console.error("Onboard user error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to onboard user.",
    });
  }
};

const bulkOnboardUsers = async (req, res) => {
  try {
    const callerId = req.headers["x-user-id"] || req.user?._id || req.body.adminId;
    if (callerId && isValidId(callerId)) {
      const admin = await User.findById(callerId);
      if (admin && admin.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only administrators can perform bulk onboarding.",
        });
      }
    }

    const { users } = req.body;
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "users array is required.",
      });
    }

    const created = [];
    const duplicates = [];
    const defaultPassword = "Thapar@2026";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    for (const record of users) {
      const name = record.name?.trim();
      const email = record.email?.trim().toLowerCase();
      let role = record.role?.trim().toLowerCase();
      if (!role || !["student", "alumni"].includes(role)) {
        role = "student";
      }

      if (!name || !email) {
        continue;
      }

      const existing = await User.findOne({ email });
      if (existing) {
        duplicates.push({ email, name, role, reason: "Email already registered" });
        continue;
      }

      const newUser = await User.create({
        role,
        name,
        email,
        password: hashedPassword,
        linkedinUrl: role === "alumni" && record.linkedinUrl ? record.linkedinUrl.trim() : undefined,
        isVerified: role === "alumni" ? true : false,
      });

      await sendCredentialsEmail({
        name,
        email,
        role,
        defaultPassword,
      });

      created.push({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        defaultPassword,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Bulk onboarding complete: ${created.length} created, ${duplicates.length} skipped.`,
      data: {
        totalProcessed: users.length,
        createdCount: created.length,
        duplicateCount: duplicates.length,
        created,
        duplicates,
      },
    });
  } catch (error) {
    console.error("Bulk onboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process bulk onboarding.",
    });
  }
};

export {
  createUser,
  loginUser,
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  verifyAlumni,
  onboardUser,
  bulkOnboardUsers,
};
