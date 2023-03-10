import express, { json } from "express";
import prisma from "../prismaClient.js";
import { restrictAdmin, restrictUser } from "../middleware/auth.js";

var router = express.Router();

//GET /settings
router.get("/", restrictUser, async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    res.status(200).json(settings);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

//GET /settings/:id
router.get("/:id", restrictUser, async (req, res) => {
  try {
    const settingsId = req.params.id;
    const settings = await prisma.setting.findUnique({
      where: {
        id: Number(settingsId),
      },
    });
    res.status(200).json(settings);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

//POST /settings
router.post("/", restrictUser, async (req, res, next) => {
  try {
    const { settingName, settingValue } = req.body;
    const setting = await prisma.setting.create({
      data: {
        settingName: settingName,
        settingValue: settingValue,
      },
    });
    res.status(201).json(setting);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

// PUT /settings/:id
router.put("/:id", restrictUser, async (req, res) => {
  try {
    const settings_id = req.params.id;
    const { settingName, settingValue } = req.body;
    const setting = await prisma.setting.update({
      where: {
        id: Number(settings_id),
      },
      data: {
        settingName: settingName,
        settingValue: settingValue,
      },
    });
    res.status(200).json(setting);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

//DELETE /setting/:id
router.delete("/:id", restrictUser, async (req, res) => {
  try {
    const settingsId = req.params.id;
    const alarm = await prisma.setting.delete({
      where: {
        id: Number(settingsId),
      },
    });
    res.sendStatus(204);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

export default router;
