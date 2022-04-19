import { db } from "@/utils/db"
import { authAPI, validate } from "@/utils/middlewares"
import { ApiRequest, PopulatedApiRequest } from "@/utils/types"
import { NextApiRequest, NextApiResponse } from "next"
import nc from "next-connect"
import { z } from "zod"
import { DelegateApply } from "@/utils/validators"

const handler = nc<ApiRequest, NextApiResponse>()

// Get the user's application based on their login state
handler.get<PopulatedApiRequest, NextApiResponse>(authAPI, async (req, res) => {
  // get current user's delegate application from the database, or return 404 if not found
  const application = await db.appliedUser.findFirst({
    where: {
      userId: req.user.id,
    },
  })
  if (application) {
    return res.status(200).json({
      statusCode: 200,
      data: application,
    })
  }
  return res.status(404).json({
    statusCode: 404,
    message: "Not Found",
    description: "You have not submitted an application yet",
  })
})

handler.put(
  authAPI,
  validate({
    body: DelegateApply,
    async: true,
  }),
  async (req: ApiRequest, res) => {
    const application: DelegateApply = req.body

    if (!req.populated)
      return res.status(500).json({
        statusCode: 500,
        message: "Internal Server Error",
        description: "You are not logged in",
      })

    const existingApplication = await db.appliedUser.findFirst({
      where: {
        userId: req.user.id,
      },
    })

    if (existingApplication)
      return res.status(403).json({
        statusCode: 403,
        message: "Forbidden",
        description:
          "You have already submitted an application, there is only one allowed per user",
      })

    // submit a new application for the user, since they dont have one yet
    // TODO: send an email to the user
    const newApplication = await db.appliedUser.create({
      data: {
        ...application,
        userId: req.user.id,
        // the payment status is always pending initially
        paymentStatus: "pending",
      },
    })

    console.log("success")

    return res.status(201).json({
      statusCode: 201,
      data: newApplication,
    })
  }
)

// TODO: update your current application

export default handler
