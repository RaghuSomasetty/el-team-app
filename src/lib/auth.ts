import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('--- AUTH ATTEMPT ---')
        console.log('Email:', credentials?.email)

        if (!credentials?.email || !credentials?.password) {
          console.error('Missing email or password')
          throw new Error('Email and password are required')
        }

        const email = credentials.email.trim().toLowerCase()
        const password = credentials.password.trim()

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user) {
          console.error('User not found:', email)
          throw new Error('Account not found. Please check your email or register.')
        }

        console.log('User found, comparing password...')
        const isValid = await bcrypt.compare(password, user.passwordHash)
        
        if (!isValid) {
          console.error('Invalid password for user:', credentials.email)
          return null
        }

        console.log('Auth successful for:', credentials.email)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          designation: user.designation,
          employeeId: user.employeeId,
          department: user.department,
          image: user.image,
          phone: user.phone,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role
        token.designation = (user as any).designation
        token.employeeId = (user as any).employeeId
        token.department = (user as any).department
        token.phone = (user as any).phone
        token.id = user.id
        // Only store image if it's a small URL, never a large base64 string
        const image = (user as any).image
        if (image && image.length < 1000 && !image.startsWith('data:image')) {
          token.image = image
        } else {
          token.image = null
        }
      }
      // Handle session update
      if (trigger === "update") {
        if (session?.name) token.name = session.name
        if (session?.designation) token.designation = session.designation
        if (session?.employeeId) token.employeeId = session.employeeId
        if (session?.department) token.department = session.department
        if (session?.phone) token.phone = session.phone
        // Prevent large base64 images from entering JWT during session updates
        if (session?.image) {
          if (session.image.length < 1000 && !session.image.startsWith('data:image')) {
            token.image = session.image
          } else {
            token.image = null
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).designation = token.designation
        ;(session.user as any).employeeId = token.employeeId
        ;(session.user as any).department = token.department
        ;(session.user as any).phone = token.phone
        ;(session.user as any).id = token.id
        ;(session.user as any).image = token.image
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,
}
