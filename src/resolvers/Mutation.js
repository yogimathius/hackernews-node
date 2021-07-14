const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { APP_SECRET, getUserId } = require('../utils')

async function signup(parent, args, context, info) {
  // 1
  const password = await bcrypt.hash(args.password, 10)

  // 2
  const user = await context.prisma.user.create({ data: { ...args, password } })

  // 3
  const token = jwt.sign({ userId: user.id }, APP_SECRET)

  // 4
  return {
    token,
    user,
  }
}

async function login(parent, args, context, info) {
  // 1
  const user = await context.prisma.user.findUnique({ where: { email: args.email } })
  if (!user) {
    throw new Error('No such user found')
  }

  // 2
  const valid = await bcrypt.compare(args.password, user.password)
  if (!valid) {
    throw new Error('Invalid password')
  }

  const token = jwt.sign({ userId: user.id }, APP_SECRET)

  // 3
  return {
    token,
    user,
  }
}

async function post(parent, args, context, info) {
  // const { userId } = context;
  const req = context.request

  const userId = context.request.headers.authorization ? getUserId(req) : null
  
  const newLink = await context.prisma.link.create({
    data: {
      url: args.url,
      description: args.description,
      postedBy: { connect: { id: userId } },
    }
  })
  context.pubsub.publish("NEW_LINK", newLink)

  return newLink
}

module.exports = {
  signup,
  login,
  post,
}


// const resolvers = {
//   Query: {
//     info: () => `This is the API of a Hackernews Clone`,
//     feed: async (parent, args, context) => {
//       return context.prisma.link.findMany()
//     },  },
//   Mutation: {
//     post: (parent, args, context, info) => {
//       const newLink = context.prisma.link.create({
//         data: {
//           url: args.url,
//           description: args.description,
//         },
//       })
//       return newLink
//     },
//     updateLink: (parent, args, context) => {
//       const updatedLink = context.prisma.link.update({
//         where: {
//           id: args.id
//         },
//         data: {
//           description: args.description,
//           url: args.url
//         }
//       })

//       return updatedLink
//     },
//     deleteLink: (parent, args, context) => {
//       return lcontext.prisma.link.delete({
//         where: {
//           id: args.id
//         }
//       })
//     }
//   },
// }