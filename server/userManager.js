const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const USERS_FILE = path.join(__dirname, "users.json");

class UserManager {
  constructor() {
    this.users = [];
    this.loadUsers();
  }

  loadUsers() {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const data = fs.readFileSync(USERS_FILE, "utf8");
        this.users = JSON.parse(data);
      }
    } catch (err) {
      console.error("Error loading users:", err);
      this.users = [];
    }
  }

  saveUsers() {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2));
    } catch (err) {
      console.error("Error saving users:", err);
    }
  }

  getUser(username) {
    return this.users.find((u) => u.username === username);
  }

  async register(username, password, fullName, email, avatarPath) {
    if (this.users.find((u) => u.username === username)) {
      return { success: false, message: "Username already exists" };
    }
    if (this.users.find((u) => u.email === email)) {
      return { success: false, message: "Email already exists" };
    }
    if (password.length < 8) {
      return {
        success: false,
        message: "Password must be at least 8 characters long",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const finalAvatar =
      avatarPath ||
      "https://ui-avatars.com/api/?background=random&name=" +
        encodeURIComponent(username);

    const newUser = {
      username,
      password: hashedPassword,
      fullName,
      email,
      avatar: finalAvatar,
      id: Date.now().toString(),
    };

    this.users.push(newUser);
    this.saveUsers();
    return {
      success: true,
      user: {
        username: newUser.username,
        id: newUser.id,
        avatar: newUser.avatar,
        fullName: newUser.fullName,
        email: newUser.email,
      },
    };
  }

  async login(username, password) {
    const user = this.users.find((u) => u.username === username);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { success: false, message: "Invalid credentials" };
    }

    return {
      success: true,
      user: {
        username: user.username,
        id: user.id,
        avatar: user.avatar,
        fullName: user.fullName,
        email: user.email,
      },
    };
  }
}

module.exports = new UserManager();
