const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const userManager = require("./userManager");

const path = require("path");
const multer = require("multer");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "uploads");
    if (!require("fs").existsSync(uploadPath)) {
      require("fs").mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Auth Routes
app.post("/api/register", upload.single("avatar"), async (req, res) => {
  const { username, password, fullName, email } = req.body;
  let avatarPath = null;
  if (req.file) {
    avatarPath = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;
  }

  if (!username || !password || !fullName || !email) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  const result = await userManager.register(
    username,
    password,
    fullName,
    email,
    avatarPath
  );
  res.json(result);
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  const result = await userManager.login(username, password);
  res.json(result);
});

// Socket.io Logic
let onlineUsers = [];

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join", (username) => {
    const user = userManager.getUser(username);
    onlineUsers.push({
      socketId: socket.id,
      username,
      avatar: user?.avatar || null,
    });
    io.emit("onlineUsers", onlineUsers);
    socket.broadcast.emit("message", {
      user: "System",
      text: `${username} has joined the chat`,
    });
  });

  socket.on("sendMessage", (data) => {
    io.emit("message", data);
  });

  socket.on("disconnect", () => {
    const user = onlineUsers.find((u) => u.socketId === socket.id);
    if (user) {
      onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
      io.emit("onlineUsers", onlineUsers);
      socket.broadcast.emit("message", {
        user: "System",
        text: `${user.username} has left the chat`,
      });
    }
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
