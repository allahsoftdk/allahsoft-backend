import prisma from "../prismaClient.js";
import { Cookie } from "express-session";

export default function (io) {
  io.on("connection", function (socket) {
    console.log("a user connected");

    socket.on("findRoom", async (id) => {
      socket.leaveAll();
      const room = await prisma.chat_room.findUnique({
        where: {
          id: Number(id),
        },
        include: {
          chatRoomParticipants: true,
          chatMessages: true,
        },
      });
      socket.join(room.id);
      socket.emit("roomFound", room);
    });

    socket.on("newMessage", async (message) => {
      const newMessage = await prisma.chat_message.create({
        data: {
          message: message.message,
          chatRoomId: message.chat_room_id,
          userId: message.user_id,
        },
      });
      io.to(message.chat_room_id).emit("messageCreated", newMessage);
    });
  });
}
