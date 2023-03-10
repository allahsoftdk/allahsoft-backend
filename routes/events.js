import express, { json } from "express";
import prisma from "../prismaClient.js";
import { restrictAdmin, restrictUser } from "../middleware/auth.js";

var router = express.Router();

//GET /event
router.get("/", async (req, res) => {
  try {
    const event = await prisma.IslamicEvent.findMany();
    res.status(200).json(event);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

// POST /event
router.post("/", restrictAdmin, async (req, res, next) => {
  try {
    const { name, eventDate, eventFrom, eventTo } = req.body;

    if (await prisma.IslamicEvent.findUnique({ where: { name: name } })) {
      return res.status(400).json({ msg: "Event name already exists" });
    }

    const newEvent = await prisma.IslamicEvent.create({
      data: {
        name: name,
        eventDate: eventDate,
        eventFrom: eventFrom,
        eventTo: eventTo,
      },
    });
    res.status(201).json(newEvent);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

// PUT /event/:id
router.put("/:id", restrictAdmin, async (req, res) => {
  try {
    const eventId = req.params.id;
    const { name, eventDate, eventFrom, eventTo } = req.body;
    const updateEvent = await prisma.IslamicEvent.update({
      where: {
        id: Number(eventId),
      },
      data: {
        name: name,
        eventDate: eventDate,
        eventFrom: eventFrom,
        eventTo: eventTo,
      },
    });
    res.status(200).json(updateEvent);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

// DELETE /event/:id
router.delete("/:id", restrictAdmin, async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await prisma.islamicEvent.delete({
      where: {
        id: Number(eventId),
      },
    });
    res.sendStatus(204);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
});

export default router;
