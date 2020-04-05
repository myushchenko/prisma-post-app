import bcrypt from 'bcryptjs'
import getUserId from '../utils/getUserId'
import generateToken from '../utils/generateToken'
import hashPassword from '../utils/hashPassword'

const Mutation = {
	async createUser(parent, args, { prisma }, info) {
		const password = await hashPassword(args.data.password)
		const user = await prisma.mutation.createUser({
			data: {
				...args.data,
				password,
			},
		})
		const token = generateToken(user.id)

		return { user, token }
	},
	async login(parent, args, { prisma }, info) {
		const { email, password } = args.data
		const user = await prisma.query.user({ where: { email } })

		if (!user) {
			throw new Error('Unable to login')
		}

		const isMatch = await bcrypt.compare(password, user.password)

		if (!isMatch) {
			throw new Error('Unable to login')
		}

		const token = generateToken(user.id)

		return { user, token }
	},
	async deleteUser(parent, args, { prisma, request }, info) {
		const id = getUserId(request)

		return prisma.mutation.deleteUser({ where: { id } }, info)
	},
	async updateUser(parent, { data }, { prisma, request }, info) {
		const userId = getUserId(request)

		if (typeof data.password === 'string') {
			data.password = await hashPassword(data.password)
		}

		return await prisma.mutation.updateUser(
			{
				where: { id: userId },
				data,
			},
			info
		)
	},
	async createPost(parent, { data }, { prisma, request }, info) {
		const userId = getUserId(request)
		console.log(userId)

		return prisma.mutation.createPost(
			{
				data: {
					title: data.title,
					body: data.body,
					published: data.published,
					author: {
						connect: {
							id: userId,
						},
					},
				},
			},
			info
		)
	},
	async deletePost(parent, { id }, { prisma, request }, info) {
		const userId = getUserId(request)
		const postExists = await prisma.exists.Post({
			id,
			author: {
				id: userId,
			},
		})

		if (!postExists) {
			throw new Error('Unable to delete post!')
		}

		return prisma.mutation.deletePost({ where: { id } }, info)
	},
	async updatePost(parent, { id, data }, { prisma, request }, info) {
		const userId = getUserId(request)

		const postExists = await prisma.exists.Post({
			id,
			author: {
				id: userId,
			},
		})
		const isPublished = await prisma.exists.Post({
			id,
			published: true,
		})

		if (isPublished && data.published === false) {
			await prisma.mutation.deleteManyComments({
				where: {
					post: {
						id,
					},
				},
			})
		}

		if (!postExists) {
			throw new Error('Unable to update post!')
		}

		return prisma.mutation.updatePost(
			{
				where: { id },
				data,
			},
			info
		)
	},
	async createComment(parent, { data }, { prisma, request }, info) {
		const userId = getUserId(request)
		const postExists = await prisma.exists.Post({
			id: data.post,
			published: true,
		})

		if (!postExists) {
			throw new Error('Unable to find post!')
		}

		return prisma.mutation.createComment(
			{
				data: {
					text: data.text,
					author: {
						connect: {
							id: userId,
						},
					},
					post: {
						connect: {
							id: data.post,
						},
					},
				},
			},
			info
		)
	},
	async deleteComment(parent, { id }, { prisma, request }, info) {
		const userId = getUserId(request)

		const commentExists = await prisma.exists.Comment({
			id,
			author: {
				id: userId,
			},
		})

		if (!commentExists) {
			throw new Error('Unable to delete comment!')
		}

		return prisma.mutation.deleteComment({ where: { id } }, info)
	},
	async updateComment(parent, { id, data }, { prisma, request }, info) {
		const userId = getUserId(request)

		const commentExists = await prisma.exists.Comment({
			id,
			author: {
				id: userId,
			},
		})

		if (!commentExists) {
			throw new Error('Unable to update comment!')
		}

		return prisma.mutation.updateComment(
			{
				where: { id },
				data,
			},
			info
		)
	},
}

export default Mutation
