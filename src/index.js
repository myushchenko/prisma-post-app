import '@babel/polyfill/noConflict'
import { GraphQLServer, PubSub } from 'graphql-yoga'
import { resolvers, fragmentReplacements } from './resolvers'
import prisma from './prisma'

const pubsub = new PubSub()

const server = new GraphQLServer({
	typeDefs: './src/schema.graphql',
	resolvers,
	fragmentReplacements,
	context(request) {
		return {
			pubsub,
			prisma,
			request,
		}
	},
})

server.start({ port: process.env.PORT }, () => {
	console.log('The server is up!')
})
