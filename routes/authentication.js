import express, { json } from "express";
import prisma from "../prismaClient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import session from "express-session";
import emailvalidator from "email-validator";
import { restrictUser } from "../middleware/auth.js";

var router = express.Router();

router.use(function (req, res, next) {
  var err = req.session.error;
  var msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.message = "";
  if (err) res.locals.message = '<p class="msg error">' + err + "</p>";
  if (msg) res.locals.message = '<p class="msg success">' + msg + "</p>";
  next();
});

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    const hashPasword = bcrypt.hashSync(password, 8);

    if (password !== confirmPassword) {
      return res.status(400).json({ msg: "Passwords do not match" });
    } else if (!name || !email || !password) {
      return res.status(400).json({ msg: "Please enter all fields" });
    } else if (!emailvalidator.validate(email)) {
      return res.status(400).json({ msg: "Please enter a valid email" });
    } else if (await prisma.user.findUnique({ where: { email: email } })) {
      return res.status(400).json({ msg: "Email already in use" });
    } else if (await prisma.user.findUnique({ where: { name: name } })) {
      return res.status(400).json({ msg: "Username already in use" });
    } else if (password.length < 8) {
      return res
        .status(400)
        .json({ msg: "Password must be at least 8 characters" });
    }

    const accessToken = jwt.sign({ password }, "token");
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashPasword,
        token: accessToken,
        roleId: 1,
      },
    });

    req.session.token = accessToken;
    req.session.save(function () {
      res.sendStatus(200);
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err });
  }
});

router.post("/setRole", async (req, res, next) => {
  const { id, roleId } = req.body;

  if (!req.session.user || req.session.user.roleId !== 2) {
    return res.status(401).json({ msg: "Unauthorized" });
  }

  const user = await prisma.user.update({
    where: {
      id: id,
    },
    data: {
      roleId: roleId,
    },
  });

  res.sendStatus(200);
});

router.post("/login", async (req, res, next) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }

  const user = await prisma.user.findUnique({
    where: {
      name: name,
    },
  });

  if (!user) {
    return res.status(400).json({ msg: "User does not exist" });
  }
  if (bcrypt.compareSync(password, user.password)) {
    const accessToken = jwt.sign({ password }, "token");

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        token: accessToken,
      },
      include: {
        role: true,
      },
    });

    req.session.user = updatedUser;
    req.session.accessToken = accessToken;
    req.session.save(function () {
      res.status(200).json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        roleId: updatedUser.role,
      });
    });
  } else {
    return res.status(401).json({ msg: "Invalid credentials" });
  }
});

router.post("/logout", async (req, res) => {
  const user = req.session.user;
  if (!user) {
    return res
      .status(400)
      .json({ msg: "This user does not have an active session" });
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      token: null,
    },
  });
  req.session.destroy();
  res.sendStatus(200);
});

router.post("/restricted", restrictUser, async (req, res, next) => {
  res.sendStatus(200);
});

router.get("/loggedInUser", async (req, res, next) => {
  const user = req.session.user;
  if (!user) {
    return res.status(400).json({ msg: "No user logged in" });
  }

  res.status(200).json({
    id: user.id,
    name: user.name,
    email: user.email,
    roleId: user.roleId,
  });
});

export default router;
